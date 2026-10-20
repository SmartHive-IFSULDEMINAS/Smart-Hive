#!/usr/bin/env python3
"""
Agendador do monitoramento das abelhas no Raspberry Pi (Smart-Hive).

Mantém o código de monitoramento (MONITORAMENTO_CMD) rodando só no horário
configurado na plataforma (tela "Agendamento do Monitoramento"), todos os
dias, no intervalo [início, fim). O Pi continua ligado: só o processo de
monitoramento é iniciado e encerrado.

A cada INTERVALO segundos o agendador:
  1. Faz POST em /api/monitoramento/pi/ relatando o estado real do processo
     e recebe a configuração vigente, que é gravada em disco
     (MONITORAMENTO_DIR_ESTADO/agendamento.json).
  2. Decide pelo relógio do Pi, no fuso da plataforma (America/Sao_Paulo),
     se o monitoramento deve estar rodando, e inicia/encerra o processo.

Robustez:
  - Sem servidor (rede fora, VPS fora), segue a última configuração salva
    em disco, inclusive depois de reiniciar o Pi. Sem nenhuma configuração
    salva, o monitoramento roda continuamente (comportamento de antes do
    agendamento existir).
  - Agendamento desabilitado = monitoramento contínuo.
  - Encerramento gradual: SIGTERM para o grupo de processos do monitoramento
    (ele e os subprocessos), espera até MONITORAMENTO_TIMEOUT_PARADA segundos
    para o trabalho em andamento terminar e só então usa SIGKILL, registrando
    a ocorrência.
  - Processo que morre logo após iniciar conta como falha de início: a nova
    tentativa espera um backoff crescente em vez de reiniciar em loop.
  - Uma trava em disco impede dois agendadores (e dois monitoramentos)
    simultâneos.

Configuração por variáveis de ambiente (em /etc/smarthive-camera.env):
  SMARTHIVE_URL                 URL da plataforma                         (obrigatória)
  CAMERA_TOKEN                  token do Pi (Django Admin → Câmeras)      (obrigatória)
  MONITORAMENTO_CMD             comando do monitoramento, ex.: "/usr/bin/python3 /opt/abelhas/captura.py"
  MONITORAMENTO_DIR_TRABALHO    diretório em que o comando roda (padrão: o do serviço)
  MONITORAMENTO_DIR_ESTADO      padrão /var/lib/smarthive-monitoramento
  MONITORAMENTO_TIMEOUT_PARADA  segundos de encerramento gradual, padrão 60
  MONITORAMENTO_INTERVALO       segundos entre verificações, padrão 10
  FUSO_HORARIO                  usado se o servidor não informar, padrão America/Sao_Paulo

Só usa a biblioteca padrão do Python.
"""
import json
import os
import shlex
import signal
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# Se o processo morre antes disso, conta como falha de início (aplica backoff)
INICIO_ESTAVEL_S = 30
BACKOFF_MAX_S = 300
# Depois do SIGKILL, quanto esperar o processo sumir antes de declarar falha
ESPERA_APOS_KILL_S = 5
FORMATO_HORA = '%H:%M'


def log(msg):
    print(time.strftime('%Y-%m-%d %H:%M:%S'), msg, flush=True)


class Config:
    def __init__(self, env=os.environ):
        self.smarthive_url = env.get('SMARTHIVE_URL', '').rstrip('/')
        self.token = env.get('CAMERA_TOKEN', '')
        self.comando = env.get('MONITORAMENTO_CMD', '').strip()
        self.dir_trabalho = env.get('MONITORAMENTO_DIR_TRABALHO') or None
        self.dir_estado = env.get('MONITORAMENTO_DIR_ESTADO', '/var/lib/smarthive-monitoramento')
        self.timeout_parada = float(env.get('MONITORAMENTO_TIMEOUT_PARADA', '60'))
        self.intervalo = float(env.get('MONITORAMENTO_INTERVALO', '10'))
        self.fuso = env.get('FUSO_HORARIO', 'America/Sao_Paulo')

    def validar(self):
        erros = []
        if not self.smarthive_url:
            erros.append('SMARTHIVE_URL não definida')
        if not self.token:
            erros.append('CAMERA_TOKEN não definido')
        if self.comando:
            try:
                if not shlex.split(self.comando):
                    erros.append('MONITORAMENTO_CMD vazio')
            except ValueError as e:
                erros.append(f'MONITORAMENTO_CMD inválido: {e}')
        return erros


# ── regra do horário ─────────────────────────────────────────────────────

def _hora(texto):
    return datetime.strptime(str(texto), FORMATO_HORA).time()


def normalizar_agenda(dados):
    """Valida a configuração recebida do servidor (ou lida do disco). ValueError se inválida."""
    if not isinstance(dados, dict) or not isinstance(dados.get('habilitado'), bool):
        raise ValueError('configuração sem "habilitado"')
    inicio, fim = _hora(dados.get('hora_inicio')), _hora(dados.get('hora_fim'))
    if inicio >= fim:
        raise ValueError('horário de início deve ser anterior ao de encerramento')
    versao = dados.get('versao')
    return {
        'habilitado': dados['habilitado'],
        'hora_inicio': inicio.strftime(FORMATO_HORA),
        'hora_fim': fim.strftime(FORMATO_HORA),
        'versao': int(versao) if versao is not None else None,
        'fuso_horario': str(dados.get('fuso_horario') or ''),
    }


_avisos_fuso = set()


def fuso(nome):
    try:
        return ZoneInfo(nome)
    except (ZoneInfoNotFoundError, ValueError):
        if nome not in _avisos_fuso:
            _avisos_fuso.add(nome)
            log(f'fuso horário "{nome}" desconhecido; usando o fuso do sistema')
        return None


def deve_executar(agenda, agora, fuso_padrao='America/Sao_Paulo'):
    """`agora` é um datetime aware. Sem agenda ou agenda desabilitada: contínuo."""
    if not agenda or not agenda['habilitado']:
        return True
    tz = fuso(agenda.get('fuso_horario') or fuso_padrao)
    local = agora.astimezone(tz) if tz else agora.astimezone()
    return _hora(agenda['hora_inicio']) <= local.time() < _hora(agenda['hora_fim'])


# ── persistência ─────────────────────────────────────────────────────────

class ArmazemAgenda:
    """Última configuração recebida, em disco, para valer sem servidor e após reiniciar."""

    def __init__(self, diretorio):
        self.caminho = os.path.join(diretorio, 'agendamento.json')

    def carregar(self):
        try:
            with open(self.caminho, encoding='utf-8') as f:
                return normalizar_agenda(json.load(f))
        except FileNotFoundError:
            return None
        except (OSError, ValueError) as e:
            log(f'configuração salva em {self.caminho} ilegível ({e}); ignorando')
            return None

    def salvar(self, agenda):
        # Escrita atômica: um desligamento no meio não deixa o arquivo pela metade
        temporario = self.caminho + '.tmp'
        with open(temporario, 'w', encoding='utf-8') as f:
            json.dump(agenda, f)
            f.flush()
            os.fsync(f.fileno())
        os.replace(temporario, self.caminho)


def sincronizar(config, relato):
    """POST do relato; retorna a configuração do servidor ou None se não deu para falar com ele."""
    req = urllib.request.Request(
        f'{config.smarthive_url}/api/monitoramento/pi/',
        data=json.dumps(relato).encode(),
        headers={
            'X-Camera-Token': config.token,
            'Content-Type': 'application/json',
            'User-Agent': 'smarthive-monitoramento-pi',
        },
        method='POST',
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


# ── processo de monitoramento ────────────────────────────────────────────

def _sinalizar_grupo(pgid, sinal):
    try:
        os.killpg(pgid, sinal)
    except ProcessLookupError:
        pass


def _grupo_vivo(pgid):
    try:
        os.killpg(pgid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def _esperar_grupo(pgid, timeout):
    limite = time.monotonic() + timeout
    while _grupo_vivo(pgid):
        if time.monotonic() >= limite:
            return False
        time.sleep(0.2)
    return True


class Monitoramento:
    """O processo de MONITORAMENTO_CMD, numa sessão/grupo de processos próprio
    para que o encerramento alcance também os subprocessos dele."""

    def __init__(self, config):
        self.config = config
        self.proc = None
        self.iniciado_em = None

    @property
    def rodando(self):
        return self.proc is not None and self.proc.poll() is None

    @property
    def existe(self):
        return self.proc is not None

    def iniciar(self):
        """OSError se o comando não puder ser executado."""
        self.proc = subprocess.Popen(
            shlex.split(self.config.comando),
            cwd=self.config.dir_trabalho,
            stdin=subprocess.DEVNULL,
            # stdout/stderr herdados: a saída vai para o journal do serviço
            start_new_session=True,
        )
        self.iniciado_em = time.monotonic()
        log(f'monitoramento iniciado (pid {self.proc.pid}): {self.config.comando}')

    def recolher(self):
        """Processo terminou sozinho: limpa o que sobrou do grupo. Retorna (código, duração)."""
        pgid = self.proc.pid
        codigo = self.proc.wait()
        duracao = time.monotonic() - self.iniciado_em
        if _grupo_vivo(pgid):
            log('subprocessos do monitoramento continuaram vivos; encerrando')
            _sinalizar_grupo(pgid, signal.SIGTERM)
            if not _esperar_grupo(pgid, ESPERA_APOS_KILL_S):
                _sinalizar_grupo(pgid, signal.SIGKILL)
        self.proc = None
        self.iniciado_em = None
        return codigo, duracao

    def parar(self, timeout):
        """
        Encerramento gradual. Retorna (ok, mensagem); ok=False se o processo
        sobreviveu até ao SIGKILL (o processo continua registrado para nova
        tentativa).
        """
        pgid = self.proc.pid
        mensagem = ''
        if self.proc.poll() is None:
            log(f'encerrando monitoramento (SIGTERM; até {timeout:.0f}s para concluir o trabalho em andamento)')
            _sinalizar_grupo(pgid, signal.SIGTERM)
            try:
                self.proc.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                log(f'AVISO: monitoramento não terminou em {timeout:.0f}s; forçando (SIGKILL)')
                mensagem = f'não terminou em {timeout:.0f}s após o pedido de encerramento; finalizado à força'
                _sinalizar_grupo(pgid, signal.SIGKILL)
                try:
                    self.proc.wait(timeout=ESPERA_APOS_KILL_S)
                except subprocess.TimeoutExpired:
                    log('ERRO: monitoramento continua rodando mesmo após SIGKILL')
                    return False, 'o processo continua rodando mesmo após SIGKILL'

        # O processo principal saiu, mas algum subprocesso pode ter ficado
        if _grupo_vivo(pgid):
            _sinalizar_grupo(pgid, signal.SIGTERM)
            if not _esperar_grupo(pgid, min(timeout, 10)):
                log('AVISO: subprocessos do monitoramento não terminaram; forçando (SIGKILL)')
                _sinalizar_grupo(pgid, signal.SIGKILL)
                if not _esperar_grupo(pgid, ESPERA_APOS_KILL_S):
                    return False, 'subprocessos do monitoramento continuam rodando mesmo após SIGKILL'
                mensagem = mensagem or 'subprocessos finalizados à força'

        duracao = time.monotonic() - self.iniciado_em
        log(f'monitoramento encerrado após {duracao:.0f}s (código de saída: {self.proc.returncode})')
        self.proc = None
        self.iniciado_em = None
        return True, mensagem


# ── decisão ──────────────────────────────────────────────────────────────

def _agora_iso(agora):
    return agora.astimezone(timezone.utc).isoformat(timespec='seconds')


class Agendador:
    """A cada passo: sincroniza com o servidor, decide e inicia/encerra o processo."""

    def __init__(self, config, processo, armazem, sincronizar=sincronizar,
                 relogio=time.monotonic, agora=lambda: datetime.now(timezone.utc)):
        self.config = config
        self.processo = processo
        self.armazem = armazem
        self.sincronizar = sincronizar
        self.relogio = relogio
        self.agora = agora
        self.agenda = armazem.carregar()
        self.estado = 'parado'
        self.mensagem = ''
        self.deve = None
        self.ultimo_inicio = None
        self.ultimo_encerramento = None
        self.falhas_inicio = 0
        self.proxima_tentativa = 0.0
        if self.agenda:
            log(f'configuração salva carregada: {self._descrever(self.agenda)}')
        else:
            log('nenhuma configuração salva; monitoramento contínuo até receber uma do servidor')

    @staticmethod
    def _descrever(agenda):
        if not agenda or not agenda['habilitado']:
            return 'agendamento desabilitado (monitoramento contínuo)'
        return f'das {agenda["hora_inicio"]} às {agenda["hora_fim"]}, todos os dias'

    def relato(self):
        return {
            'estado': self.estado,
            'deve_executar': self.deve,
            'mensagem': self.mensagem,
            'versao_aplicada': self.agenda['versao'] if self.agenda else None,
            'ultimo_inicio': _agora_iso(self.ultimo_inicio) if self.ultimo_inicio else None,
            'ultimo_encerramento': _agora_iso(self.ultimo_encerramento) if self.ultimo_encerramento else None,
        }

    def _relatar(self):
        resposta = self.sincronizar(self.config, self.relato())
        if resposta is None:
            return
        try:
            agenda = normalizar_agenda(resposta)
        except (ValueError, TypeError) as e:
            log(f'configuração inválida recebida do servidor ({e}); mantendo a atual')
            return
        if agenda == self.agenda:
            return
        log(f'nova configuração: {self._descrever(agenda)}')
        self.agenda = agenda
        try:
            self.armazem.salvar(agenda)
        except OSError as e:
            log(f'não foi possível salvar a configuração em disco: {e}')

    def _backoff(self):
        return min(BACKOFF_MAX_S, 5 * 2 ** (self.falhas_inicio - 1))

    def _falha_inicio(self, motivo):
        self.falhas_inicio += 1
        espera = self._backoff()
        self.proxima_tentativa = self.relogio() + espera
        self.estado = 'falha_inicio'
        self.mensagem = f'{motivo}; nova tentativa em {espera}s'
        log(f'falha ao iniciar o monitoramento: {self.mensagem}')

    def _garantir_rodando(self):
        if self.processo.rodando:
            self.estado = 'executando'
            return
        if self.processo.existe:
            codigo, duracao = self.processo.recolher()
            self.ultimo_encerramento = self.agora()
            if duracao < INICIO_ESTAVEL_S:
                self._falha_inicio(f'o monitoramento terminou {duracao:.0f}s após iniciar (código {codigo})')
            else:
                self.falhas_inicio = 0
                log(f'monitoramento terminou sozinho após {duracao:.0f}s (código {codigo}); reiniciando')
        if self.relogio() < self.proxima_tentativa:
            return
        try:
            self.processo.iniciar()
        except OSError as e:
            self._falha_inicio(f'não foi possível executar o comando: {e}')
            return
        self.ultimo_inicio = self.agora()
        self.estado = 'executando'
        self.mensagem = ''

    def _garantir_parado(self, motivo):
        self.falhas_inicio = 0
        self.proxima_tentativa = 0.0
        if not self.processo.existe:
            if self.estado != 'parado':
                self.estado, self.mensagem = 'parado', ''
            return
        if self.estado != 'falha_encerramento':
            log(f'encerrando o monitoramento: {motivo}')
            self.estado, self.mensagem = 'encerrando', ''
            # Avisa a plataforma antes de esperar o encerramento gradual
            self.sincronizar(self.config, self.relato())
        try:
            ok, mensagem = self.processo.parar(self.config.timeout_parada)
        except OSError as e:
            ok, mensagem = False, f'erro ao enviar o sinal de encerramento: {e}'
        if ok:
            self.ultimo_encerramento = self.agora()
            self.estado, self.mensagem = 'parado', mensagem
        else:
            log(f'falha ao encerrar o monitoramento: {mensagem}')
            self.estado, self.mensagem = 'falha_encerramento', mensagem

    def aplicar(self):
        self.deve = deve_executar(self.agenda, self.agora(), self.config.fuso)
        if not self.config.comando:
            self.estado = 'sem_comando'
            self.mensagem = 'MONITORAMENTO_CMD não definido em /etc/smarthive-camera.env'
            return
        if self.deve:
            self._garantir_rodando()
        else:
            self._garantir_parado(f'fora do horário agendado ({self._descrever(self.agenda)})')

    def passo(self):
        self._relatar()
        antes = (self.estado, self.deve, self.mensagem)
        self.aplicar()
        if (self.estado, self.deve, self.mensagem) != antes:
            # Relata a mudança na hora, sem esperar o próximo ciclo
            self.sincronizar(self.config, self.relato())

    def encerrar(self):
        """O próprio agendador está parando (systemctl stop / desligamento)."""
        if self.processo.existe:
            self._garantir_parado('agendador encerrado')
            self.sincronizar(self.config, self.relato())


def _travar(diretorio):
    """Impede dois agendadores ao mesmo tempo. Mantém o arquivo aberto (e travado) enquanto o processo viver."""
    import fcntl
    arquivo = open(os.path.join(diretorio, 'agendador.lock'), 'w')
    try:
        fcntl.flock(arquivo, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        sys.exit('Outro agendador do monitoramento já está rodando.')
    return arquivo


def main():
    config = Config()
    erros = config.validar()
    if erros:
        sys.exit('Configuração inválida: ' + '; '.join(erros))
    os.makedirs(config.dir_estado, exist_ok=True)
    trava = _travar(config.dir_estado)  # noqa: F841 (precisa continuar referenciado)

    parar = threading.Event()
    signal.signal(signal.SIGTERM, lambda *_: parar.set())
    signal.signal(signal.SIGINT, lambda *_: parar.set())

    agendador = Agendador(config, Monitoramento(config), ArmazemAgenda(config.dir_estado))
    log(f'agendador consultando {config.smarthive_url} a cada {config.intervalo:.0f}s '
        f'(comando: {config.comando or "não definido"})')
    while not parar.is_set():
        try:
            agendador.passo()
        except Exception as e:  # nunca deixa o agendador morrer por um erro inesperado
            log(f'erro inesperado: {e!r}')
        parar.wait(config.intervalo)

    log('agendador encerrando')
    agendador.encerrar()


if __name__ == '__main__':
    main()
