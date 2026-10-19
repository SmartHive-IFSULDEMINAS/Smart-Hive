"""Testes do agendador do monitoramento (só biblioteca padrão): python -m unittest camera-pi/test_agendador_monitoramento.py"""
import os
import sys
import tempfile
import time
import unittest
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import agendador_monitoramento  # noqa: E402
from agendador_monitoramento import (  # noqa: E402
    Agendador, ArmazemAgenda, Config, INICIO_ESTAVEL_S, Monitoramento, deve_executar, normalizar_agenda,
)

agendador_monitoramento.log = lambda msg: None

SP = ZoneInfo('America/Sao_Paulo')


def agenda(habilitado=True, inicio='07:00', fim='15:00', versao=1):
    return {'habilitado': habilitado, 'hora_inicio': inicio, 'hora_fim': fim,
            'versao': versao, 'fuso_horario': 'America/Sao_Paulo'}


class ProcessoFake:
    def __init__(self):
        self.proc = None
        self.vivo = False
        self.iniciados = 0
        self.parados = 0
        self.erro_iniciar = None
        self.parar_resultado = (True, '')
        self.duracao = 100

    @property
    def rodando(self):
        return self.proc is not None and self.vivo

    @property
    def existe(self):
        return self.proc is not None

    def iniciar(self):
        if self.erro_iniciar:
            raise self.erro_iniciar
        self.iniciados += 1
        self.proc = object()
        self.vivo = True

    def recolher(self):
        self.proc = None
        return 1, self.duracao

    def parar(self, timeout):
        self.parados += 1
        ok, mensagem = self.parar_resultado
        if ok:
            self.proc = None
            self.vivo = False
        return ok, mensagem

    def morrer(self, duracao):
        self.vivo = False
        self.duracao = duracao


class ArmazemFake:
    def __init__(self, agenda=None):
        self.agenda = agenda
        self.salvas = []

    def carregar(self):
        return self.agenda

    def salvar(self, agenda):
        self.salvas.append(agenda)
        self.agenda = agenda


class Servidor:
    """Responde com `self.agenda` (None = fora do ar) e guarda os relatos."""

    def __init__(self, agenda=None):
        self.agenda = agenda
        self.relatos = []

    def __call__(self, config, relato):
        self.relatos.append(dict(relato))
        return dict(self.agenda) if self.agenda else None


class Relogio:
    def __init__(self):
        self.t = 0.0

    def __call__(self):
        return self.t


def config(comando='python3 monitor.py'):
    return Config({'SMARTHIVE_URL': 'http://vps:8080', 'CAMERA_TOKEN': 'tok', 'MONITORAMENTO_CMD': comando})


class RegraHorarioTests(unittest.TestCase):
    def em(self, h, m=0):
        return datetime(2026, 10, 19, h, m, tzinfo=SP)

    def test_inicio_inclusivo_fim_exclusivo(self):
        a = agenda()
        self.assertFalse(deve_executar(a, self.em(6, 59)))
        self.assertTrue(deve_executar(a, self.em(7, 0)))
        self.assertTrue(deve_executar(a, self.em(14, 59)))
        self.assertFalse(deve_executar(a, self.em(15, 0)))
        self.assertFalse(deve_executar(a, self.em(23, 0)))

    def test_desabilitado_ou_sem_agenda_e_continuo(self):
        self.assertTrue(deve_executar(agenda(habilitado=False), self.em(3)))
        self.assertTrue(deve_executar(None, self.em(3)))

    def test_compara_no_fuso_de_sao_paulo_mesmo_com_relogio_em_utc(self):
        # 09:30 UTC = 06:30 em São Paulo; 10:30 UTC = 07:30
        self.assertFalse(deve_executar(agenda(), datetime(2026, 10, 19, 9, 30, tzinfo=timezone.utc)))
        self.assertTrue(deve_executar(agenda(), datetime(2026, 10, 19, 10, 30, tzinfo=timezone.utc)))

    def test_normalizar_rejeita_configuracao_invalida(self):
        for dados in (
            agenda(inicio='15:00', fim='07:00'),
            agenda(inicio='10:00', fim='10:00'),
            agenda(inicio='25:00'),
            {'hora_inicio': '07:00', 'hora_fim': '15:00'},
            None,
        ):
            with self.subTest(dados=dados), self.assertRaises((ValueError, TypeError)):
                normalizar_agenda(dados)


class AgendadorTests(unittest.TestCase):
    def setUp(self):
        self.agora = datetime(2026, 10, 19, 6, 59, tzinfo=SP)
        self.relogio = Relogio()
        self.processo = ProcessoFake()
        self.servidor = Servidor(agenda())
        self.armazem = ArmazemFake()

    def criar(self, cfg=None):
        self.agendador = Agendador(
            cfg or config(), self.processo, self.armazem, sincronizar=self.servidor,
            relogio=self.relogio, agora=lambda: self.agora,
        )
        return self.agendador

    def as_(self, h, m=0):
        self.agora = datetime(2026, 10, 19, h, m, tzinfo=SP)
        self.agendador.passo()

    def test_ciclo_diario(self):
        self.criar()
        self.as_(6, 59)
        self.assertEqual(self.processo.iniciados, 0)
        self.assertEqual(self.agendador.estado, 'parado')

        self.as_(7, 0)
        self.assertEqual(self.processo.iniciados, 1)
        self.assertEqual(self.agendador.estado, 'executando')

        # Verificações seguintes não iniciam outra instância
        for minuto in range(1, 10):
            self.as_(10, minuto)
        self.assertEqual(self.processo.iniciados, 1)

        self.as_(15, 0)
        self.assertEqual(self.processo.parados, 1)
        self.assertEqual(self.agendador.estado, 'parado')
        self.assertIn('encerrando', [r['estado'] for r in self.servidor.relatos])
        self.assertIsNotNone(self.servidor.relatos[-1]['ultimo_encerramento'])

        # Dia seguinte
        self.agora = datetime(2026, 10, 20, 7, 0, tzinfo=SP)
        self.agendador.passo()
        self.assertEqual(self.processo.iniciados, 2)

    def test_relata_estado_real_e_versao_aplicada(self):
        self.criar()
        self.as_(8)
        relato = self.servidor.relatos[-1]
        self.assertEqual(relato['estado'], 'executando')
        self.assertTrue(relato['deve_executar'])
        self.assertEqual(relato['versao_aplicada'], 1)
        self.assertIsNotNone(relato['ultimo_inicio'])

    def test_reinicio_do_pi_dentro_do_horario_sem_servidor_usa_configuracao_salva(self):
        self.armazem = ArmazemFake(agenda())
        self.servidor.agenda = None
        self.criar()
        self.as_(10)
        self.assertEqual(self.processo.iniciados, 1)

    def test_reinicio_do_pi_fora_do_horario_nao_inicia(self):
        self.armazem = ArmazemFake(agenda())
        self.servidor.agenda = None
        self.criar()
        self.as_(16)
        self.assertEqual(self.processo.iniciados, 0)
        self.assertEqual(self.agendador.estado, 'parado')

    def test_sem_configuracao_e_sem_servidor_roda_continuo(self):
        self.servidor.agenda = None
        self.criar()
        self.as_(3)
        self.assertEqual(self.processo.iniciados, 1)

    def test_configuracao_recebida_e_salva_em_disco(self):
        self.criar()
        self.as_(6)
        self.assertEqual(self.armazem.salvas, [agenda()])
        self.as_(6, 1)
        self.assertEqual(len(self.armazem.salvas), 1)  # só grava quando muda

    def test_mudanca_de_horario_com_monitoramento_rodando_encerra_na_hora(self):
        self.criar()
        self.as_(10)
        self.assertTrue(self.processo.rodando)
        self.servidor.agenda = agenda(inicio='11:00', fim='15:00', versao=2)
        self.as_(10, 1)
        self.assertFalse(self.processo.existe)

    def test_mudanca_de_horario_que_inclui_agora_inicia_na_hora(self):
        self.criar()
        self.as_(16)
        self.assertEqual(self.processo.iniciados, 0)
        self.servidor.agenda = agenda(inicio='07:00', fim='18:00', versao=2)
        self.as_(16, 1)
        self.assertEqual(self.processo.iniciados, 1)

    def test_desabilitar_volta_ao_monitoramento_continuo(self):
        self.criar()
        self.as_(20)
        self.assertFalse(self.processo.existe)
        self.servidor.agenda = agenda(habilitado=False, versao=2)
        self.as_(20, 1)
        self.assertTrue(self.processo.rodando)

    def test_configuracao_invalida_do_servidor_e_ignorada(self):
        self.criar()
        self.as_(10)
        self.servidor.agenda = agenda(inicio='15:00', fim='07:00', versao=2)
        self.as_(10, 1)
        self.assertTrue(self.processo.rodando)
        self.assertEqual(self.agendador.agenda['versao'], 1)

    def test_sem_comando_configurado(self):
        self.criar(config(comando=''))
        self.as_(10)
        self.assertEqual(self.processo.iniciados, 0)
        self.assertEqual(self.agendador.estado, 'sem_comando')
        self.assertIn('MONITORAMENTO_CMD', self.servidor.relatos[-1]['mensagem'])

    def test_falha_ao_iniciar_espera_backoff(self):
        self.processo.erro_iniciar = FileNotFoundError(2, 'No such file or directory', 'python3')
        self.criar()
        self.as_(10)
        self.assertEqual(self.agendador.estado, 'falha_inicio')
        self.assertIn('No such file', self.agendador.mensagem)

        self.processo.erro_iniciar = None
        self.relogio.t = 1
        self.as_(10, 1)
        self.assertEqual(self.processo.iniciados, 0)  # ainda no backoff
        self.relogio.t = 10
        self.as_(10, 2)
        self.assertEqual(self.processo.iniciados, 1)
        self.assertEqual(self.agendador.estado, 'executando')

    def test_processo_que_morre_logo_apos_iniciar_e_falha_de_inicio(self):
        self.criar()
        self.as_(10)
        self.processo.morrer(INICIO_ESTAVEL_S - 1)
        self.as_(10, 1)
        self.assertEqual(self.agendador.estado, 'falha_inicio')
        self.assertEqual(self.processo.iniciados, 1)

    def test_processo_que_morre_depois_de_estavel_reinicia_na_hora(self):
        self.criar()
        self.as_(10)
        self.processo.morrer(INICIO_ESTAVEL_S + 100)
        self.as_(11)
        self.assertEqual(self.processo.iniciados, 2)
        self.assertEqual(self.agendador.estado, 'executando')

    def test_falha_ao_encerrar_e_tenta_de_novo(self):
        self.criar()
        self.as_(10)
        self.processo.parar_resultado = (False, 'o processo continua rodando mesmo após SIGKILL')
        self.as_(15)
        self.assertEqual(self.agendador.estado, 'falha_encerramento')

        self.processo.parar_resultado = (True, '')
        self.as_(15, 1)
        self.assertEqual(self.agendador.estado, 'parado')
        self.assertEqual(self.processo.parados, 2)

    def test_encerrar_o_agendador_para_o_monitoramento(self):
        self.criar()
        self.as_(10)
        self.agendador.encerrar()
        self.assertFalse(self.processo.existe)
        self.assertEqual(self.servidor.relatos[-1]['estado'], 'parado')


class ArmazemTests(unittest.TestCase):
    def test_salva_e_carrega(self):
        with tempfile.TemporaryDirectory() as d:
            ArmazemAgenda(d).salvar(agenda())
            self.assertEqual(ArmazemAgenda(d).carregar(), agenda())
            self.assertFalse(os.path.exists(os.path.join(d, 'agendamento.json.tmp')))

    def test_arquivo_ausente_ou_corrompido(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertIsNone(ArmazemAgenda(d).carregar())
            with open(os.path.join(d, 'agendamento.json'), 'w') as f:
                f.write('{nao e json')
            self.assertIsNone(ArmazemAgenda(d).carregar())


@unittest.skipUnless(hasattr(os, 'killpg'), 'precisa de grupos de processos POSIX')
class MonitoramentoRealTests(unittest.TestCase):
    """Processos de verdade (sh/sleep), para conferir o encerramento do grupo."""

    def monitor(self, script):
        m = Monitoramento(config(comando=f"sh -c '{script}'"))
        m.iniciar()
        time.sleep(0.3)
        return m

    def test_encerramento_gradual_alcanca_subprocessos(self):
        m = self.monitor('sleep 60 & wait')
        pgid = m.proc.pid
        ok, mensagem = m.parar(timeout=5)
        self.assertTrue(ok)
        self.assertEqual(mensagem, '')
        self.assertFalse(agendador_monitoramento._grupo_vivo(pgid))

    def test_processo_que_ignora_sigterm_e_finalizado_a_forca(self):
        m = self.monitor('trap "" TERM; while true; do sleep 0.1; done')
        pgid = m.proc.pid
        inicio = time.monotonic()
        ok, mensagem = m.parar(timeout=1)
        self.assertTrue(ok)
        self.assertIn('à força', mensagem)
        self.assertLess(time.monotonic() - inicio, 5)
        self.assertFalse(agendador_monitoramento._grupo_vivo(pgid))

    def test_comando_inexistente(self):
        m = Monitoramento(config(comando='/nao/existe/monitor'))
        with self.assertRaises(OSError):
            m.iniciar()


if __name__ == '__main__':
    unittest.main()
