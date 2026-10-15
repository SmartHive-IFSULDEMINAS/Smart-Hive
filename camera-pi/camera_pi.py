#!/usr/bin/env python3
"""
Agente da câmera ao vivo do Smart-Hive (Raspberry Pi 5).

O Pi fica atrás de NAT, então é ele que pergunta ao servidor, a cada poucos
segundos, se alguém quer assistir. Enquanto a resposta for `transmitir: true`,
mantém rodando `rpicam-vid | ffmpeg` publicando H.264 via RTSP no MediaMTX;
quando vira `false` (ou o servidor some), encerra a transmissão.

Configuração por variáveis de ambiente:
  SMARTHIVE_URL   URL da plataforma, ex.: http://meu-vps:8080       (obrigatória)
  CAMERA_TOKEN    token da câmera (Django Admin → Câmeras)           (obrigatória)
  RTSP_HOST       host do MediaMTX (padrão: host de SMARTHIVE_URL)
  RTSP_PORT       padrão 8554
  LARGURA/ALTURA/FPS  padrão 1280 / 720 / 15
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

SMARTHIVE_URL = os.environ.get('SMARTHIVE_URL', '').rstrip('/')
CAMERA_TOKEN = os.environ.get('CAMERA_TOKEN', '')
RTSP_HOST = os.environ.get('RTSP_HOST') or urlparse(SMARTHIVE_URL).hostname
RTSP_PORT = os.environ.get('RTSP_PORT', '8554')
LARGURA = os.environ.get('LARGURA', '1280')
ALTURA = os.environ.get('ALTURA', '720')
FPS = os.environ.get('FPS', '15')
CAMERA_FONTE = os.environ.get('CAMERA_FONTE', 'pi')
INTERVALO = float(os.environ.get('INTERVALO', '3'))


def log(msg):
    print(time.strftime('%H:%M:%S'), msg, flush=True)


def consultar_estado():
    """Retorna o JSON de /api/camera/pi/estado/ ou None se não deu para falar com o servidor."""
    req = urllib.request.Request(
        f'{SMARTHIVE_URL}/api/camera/pi/estado/',
        headers={'X-Camera-Token': CAMERA_TOKEN},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        log(f'servidor respondeu {e.code} (token errado?)')
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        log(f'sem conexão com o servidor: {e}')
    return None


class Transmissao:
    def __init__(self):
        self.processos = []

    @property
    def rodando(self):
        return bool(self.processos) and all(p.poll() is None for p in self.processos)

    def iniciar(self, caminho):
        self.parar()
        destino = f'rtsp://camera:{CAMERA_TOKEN}@{RTSP_HOST}:{RTSP_PORT}/{caminho}'
        saida = [
            '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
            # keyframe a cada 1s: o HLS só consegue começar num keyframe
            '-g', FPS, '-pix_fmt', 'yuv420p',
            '-f', 'rtsp', '-rtsp_transport', 'tcp', destino,
        ]

        if CAMERA_FONTE == 'teste':
            ffmpeg = subprocess.Popen(
                ['ffmpeg', '-loglevel', 'warning', '-re', '-f', 'lavfi',
                 '-i', f'testsrc=size={LARGURA}x{ALTURA}:rate={FPS}', *saida],
            )
            self.processos = [ffmpeg]
        else:
            # O Pi 5 não tem encoder H.264 em hardware: a câmera entrega
            # YUV cru e o ffmpeg codifica em software (libx264).
            rpicam = subprocess.Popen(
                ['rpicam-vid', '-t', '0', '-n', '--codec', 'yuv420',
                 '--width', LARGURA, '--height', ALTURA, '--framerate', FPS, '-o', '-'],
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
            )
            ffmpeg = subprocess.Popen(
                ['ffmpeg', '-loglevel', 'warning',
                 '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', f'{LARGURA}x{ALTURA}',
                 '-framerate', FPS, '-i', '-', *saida],
                stdin=rpicam.stdout,
            )
            rpicam.stdout.close()  # o ffmpeg é o único leitor do pipe
            self.processos = [rpicam, ffmpeg]
        log(f'transmissão iniciada → rtsp://{RTSP_HOST}:{RTSP_PORT}/{caminho}')

    def parar(self):
        if not self.processos:
            return
        for p in self.processos:
            if p.poll() is None:
                p.terminate()
        for p in self.processos:
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()
        self.processos = []
        log('transmissão encerrada')


def main():
    if not SMARTHIVE_URL or not CAMERA_TOKEN:
        sys.exit('Defina SMARTHIVE_URL e CAMERA_TOKEN.')

    transmissao = Transmissao()

    def encerrar(*_):
        transmissao.parar()
        sys.exit(0)

    signal.signal(signal.SIGTERM, encerrar)
    signal.signal(signal.SIGINT, encerrar)

    log(f'consultando {SMARTHIVE_URL} a cada {INTERVALO}s')
    while True:
        estado = consultar_estado()
        # Sem resposta do servidor = ninguém pode estar assistindo; não gasta banda
        if estado and estado.get('transmitir'):
            if not transmissao.rodando:
                transmissao.iniciar(estado.get('caminho_stream', 'camera1'))
        else:
            transmissao.parar()
        time.sleep(INTERVALO)


if __name__ == '__main__':
    main()
