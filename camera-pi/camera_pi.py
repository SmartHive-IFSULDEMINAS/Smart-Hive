#!/usr/bin/env python3
"""
Agente da câmera ao vivo do Smart-Hive (Raspberry Pi 5).

O Pi fica atrás de NAT, então é ele que pergunta ao servidor, a cada poucos
segundos, se alguém quer assistir. Enquanto a resposta for `transmitir: true`,
mantém rodando `rpicam-vid | ffmpeg` publicando H.264 via RTSP no MediaMTX;
quando vira `false`, encerra a transmissão.

Robustez:
  - Falhas curtas de rede não derrubam uma transmissão em andamento: só
    paramos depois de FALHAS_PARA_PARAR consultas seguidas sem resposta.
  - Se o ffmpeg/câmera cair logo depois de iniciar (câmera ocupada, MediaMTX
    recusando, rede ruim), a próxima tentativa espera um backoff crescente
    em vez de reiniciar em loop a cada consulta.

Configuração por variáveis de ambiente:
  SMARTHIVE_URL   URL da plataforma, ex.: https://meu-dominio ou http://ip:8080   (obrigatória)
  CAMERA_TOKEN    token da câmera (Django Admin → Câmeras)                       (obrigatória)
  RTSP_HOST       host do MediaMTX (padrão: host de SMARTHIVE_URL)
  RTSP_PORT       padrão 8554
  LARGURA/ALTURA/FPS  padrão 1280 / 720 / 15
  BITRATE         bitrate máximo do vídeo, padrão 1500k
  CAMERA_FONTE    "pi" (padrão) ou "teste" (padrão de teste do ffmpeg, sem câmera)
  INTERVALO       segundos entre consultas, padrão 3

Só usa a biblioteca padrão do Python.
"""
import json
import os
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse

FALHAS_PARA_PARAR = 4
# Se o processo morre antes disso, conta como falha de início (aplica backoff)
INICIO_ESTAVEL_S = 15
BACKOFF_MAX_S = 60


def log(msg):
    print(time.strftime('%Y-%m-%d %H:%M:%S'), msg, flush=True)


class Config:
    def __init__(self, env=os.environ):
        self.smarthive_url = env.get('SMARTHIVE_URL', '').rstrip('/')
        self.token = env.get('CAMERA_TOKEN', '')
        self.rtsp_host = env.get('RTSP_HOST') or urlparse(self.smarthive_url).hostname
        self.rtsp_port = env.get('RTSP_PORT', '8554')
        self.largura = env.get('LARGURA', '1280')
        self.altura = env.get('ALTURA', '720')
        self.fps = env.get('FPS', '15')
        self.bitrate = env.get('BITRATE', '1500k')
        self.fonte = env.get('CAMERA_FONTE', 'pi')
        self.intervalo = float(env.get('INTERVALO', '3'))

    def validar(self):
        erros = []
        if not self.smarthive_url:
            erros.append('SMARTHIVE_URL não definida')
        if not self.token:
            erros.append('CAMERA_TOKEN não definido')
        if not self.rtsp_host:
            erros.append('não foi possível descobrir o host RTSP (defina RTSP_HOST)')
        if self.fonte not in ('pi', 'teste'):
            erros.append('CAMERA_FONTE deve ser "pi" ou "teste"')
        return erros


def consultar_estado(config):
    """Retorna o JSON de /api/camera/pi/estado/ ou None se não deu para falar com o servidor."""
    req = urllib.request.Request(
        f'{config.smarthive_url}/api/camera/pi/estado/',
        headers={'X-Camera-Token': config.token, 'User-Agent': 'smarthive-camera-pi'},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        if e.code == 401:
            log('servidor recusou o token (401): confira CAMERA_TOKEN')
        else:
            log(f'servidor respondeu {e.code}')
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as e:
        log(f'sem conexão com o servidor: {e}')
    return None


class Transmissao:
    """Pipeline rpicam-vid | ffmpeg -> RTSP."""

    def __init__(self, config):
        self.config = config
        self.processos = []
        self.iniciada_em = None

    @property
    def rodando(self):
        return bool(self.processos) and all(p.poll() is None for p in self.processos)

    @property
    def existe(self):
        return bool(self.processos)

    def _comando_saida(self, caminho):
        c = self.config
        destino = f'rtsp://camera:{c.token}@{c.rtsp_host}:{c.rtsp_port}/{caminho}'
        return [
            '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
            '-b:v', c.bitrate, '-maxrate', c.bitrate, '-bufsize', c.bitrate,
            # keyframe a cada 1s: o HLS só consegue começar/segmentar em keyframes
            '-g', c.fps, '-keyint_min', c.fps, '-pix_fmt', 'yuv420p',
            '-f', 'rtsp', '-rtsp_transport', 'tcp', destino,
        ]

    def iniciar(self, caminho):
        self.parar()
        c = self.config
        saida = self._comando_saida(caminho)

        if c.fonte == 'teste':
            ffmpeg = subprocess.Popen(
                ['ffmpeg', '-hide_banner', '-loglevel', 'warning', '-re', '-f', 'lavfi',
                 '-i', f'testsrc=size={c.largura}x{c.altura}:rate={c.fps}', *saida],
                stdin=subprocess.DEVNULL,
            )
            self.processos = [ffmpeg]
        else:
            # O Pi 5 não tem encoder H.264 em hardware: a câmera entrega
            # YUV cru e o ffmpeg codifica em software (libx264).
            rpicam = subprocess.Popen(
                ['rpicam-vid', '-t', '0', '-n', '--codec', 'yuv420',
                 '--width', c.largura, '--height', c.altura, '--framerate', c.fps, '-o', '-'],
                stdout=subprocess.PIPE,
            )
            ffmpeg = subprocess.Popen(
                ['ffmpeg', '-hide_banner', '-loglevel', 'warning',
                 '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', f'{c.largura}x{c.altura}',
                 '-framerate', c.fps, '-i', '-', *saida],
                stdin=rpicam.stdout,
            )
            rpicam.stdout.close()  # o ffmpeg é o único leitor do pipe
            self.processos = [rpicam, ffmpeg]

        self.iniciada_em = time.monotonic()
        log(f'transmissão iniciada → rtsp://{c.rtsp_host}:{c.rtsp_port}/{caminho}')

    def parar(self):
        """Encerra os processos. Retorna por quantos segundos a transmissão durou."""
        if not self.processos:
            return None
        for p in self.processos:
            if p.poll() is None:
                p.terminate()
        for p in self.processos:
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()
                p.wait()
        codigos = [p.returncode for p in self.processos]
        duracao = time.monotonic() - self.iniciada_em
        self.processos = []
        self.iniciada_em = None
        log(f'transmissão encerrada após {duracao:.0f}s (códigos de saída: {codigos})')
        return duracao


class Agente:
    """Decide, a cada consulta, se inicia/mantém/encerra a transmissão."""

    def __init__(self, config, transmissao, consultar=consultar_estado, relogio=time.monotonic):
        self.config = config
        self.transmissao = transmissao
        self.consultar = consultar
        self.relogio = relogio
        self.falhas_seguidas = 0
        self.falhas_inicio = 0
        self.proxima_tentativa = 0.0

    def _backoff(self):
        return min(BACKOFF_MAX_S, 2 ** self.falhas_inicio)

    def _registrar_fim(self, duracao):
        """Transmissão que morre logo após iniciar conta como falha de início."""
        if duracao is None:
            return
        if duracao < INICIO_ESTAVEL_S:
            self.falhas_inicio += 1
            espera = self._backoff()
            self.proxima_tentativa = self.relogio() + espera
            log(f'transmissão caiu logo após iniciar; nova tentativa em {espera}s')
        else:
            self.falhas_inicio = 0

    def passo(self):
        estado = self.consultar(self.config)

        if estado is None:
            self.falhas_seguidas += 1
            # Rede oscilando: mantém o que está rodando por algumas consultas
            if self.falhas_seguidas >= FALHAS_PARA_PARAR and self.transmissao.existe:
                log(f'{self.falhas_seguidas} consultas seguidas sem resposta; encerrando')
                self.transmissao.parar()
            return
        self.falhas_seguidas = 0

        if not estado.get('transmitir'):
            if self.transmissao.existe:
                self.transmissao.parar()
                self.falhas_inicio = 0
            return

        if self.transmissao.rodando:
            return
        if self.transmissao.existe:
            # Algum processo do pipeline morreu sozinho
            self._registrar_fim(self.transmissao.parar())
        if self.relogio() < self.proxima_tentativa:
            return
        self.transmissao.iniciar(estado.get('caminho_stream') or 'camera1')


def main():
    config = Config()
    erros = config.validar()
    if erros:
        sys.exit('Configuração inválida: ' + '; '.join(erros))

    transmissao = Transmissao(config)
    agente = Agente(config, transmissao)

    def encerrar(*_):
        transmissao.parar()
        sys.exit(0)

    signal.signal(signal.SIGTERM, encerrar)
    signal.signal(signal.SIGINT, encerrar)

    log(f'consultando {config.smarthive_url} a cada {config.intervalo}s (fonte: {config.fonte})')
    while True:
        try:
            agente.passo()
        except Exception as e:  # nunca deixa o agente morrer por um erro inesperado
            log(f'erro inesperado: {e!r}')
        time.sleep(config.intervalo)


if __name__ == '__main__':
    main()
