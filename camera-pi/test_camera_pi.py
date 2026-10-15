"""Testes do agente do Pi (só biblioteca padrão): python -m unittest camera-pi/test_camera_pi.py"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import camera_pi  # noqa: E402
from camera_pi import Agente, Config, FALHAS_PARA_PARAR, INICIO_ESTAVEL_S  # noqa: E402

camera_pi.log = lambda msg: None


class TransmissaoFake:
    def __init__(self):
        self.existe = False
        self.rodando = False
        self.iniciadas = 0
        self.duracao = 100

    def iniciar(self, caminho):
        self.iniciadas += 1
        self.caminho = caminho
        self.existe = self.rodando = True

    def parar(self):
        if not self.existe:
            return None
        self.existe = self.rodando = False
        return self.duracao

    def morrer(self, duracao):
        """Simula o ffmpeg caindo sozinho depois de `duracao` segundos."""
        self.rodando = False
        self.duracao = duracao


class Relogio:
    def __init__(self):
        self.t = 0.0

    def __call__(self):
        return self.t


def config():
    return Config({'SMARTHIVE_URL': 'http://vps:8080', 'CAMERA_TOKEN': 'tok'})


class AgenteTests(unittest.TestCase):
    def setUp(self):
        self.respostas = []
        self.tx = TransmissaoFake()
        self.relogio = Relogio()
        self.agente = Agente(config(), self.tx, consultar=lambda c: self.respostas.pop(0), relogio=self.relogio)

    def passo(self, resposta):
        self.respostas.append(resposta)
        self.agente.passo()

    def test_inicia_quando_pedido_e_para_quando_nao(self):
        self.passo({'transmitir': False})
        self.assertEqual(self.tx.iniciadas, 0)

        self.passo({'transmitir': True, 'caminho_stream': 'cam9'})
        self.assertTrue(self.tx.rodando)
        self.assertEqual(self.tx.caminho, 'cam9')

        self.passo({'transmitir': True})
        self.assertEqual(self.tx.iniciadas, 1)  # não reinicia o que está rodando

        self.passo({'transmitir': False})
        self.assertFalse(self.tx.existe)

    def test_tolera_falhas_curtas_de_rede(self):
        self.passo({'transmitir': True})
        for _ in range(FALHAS_PARA_PARAR - 1):
            self.passo(None)
        self.assertTrue(self.tx.rodando)

        self.passo(None)
        self.assertFalse(self.tx.existe)

    def test_resposta_ok_zera_contagem_de_falhas(self):
        self.passo({'transmitir': True})
        for _ in range(FALHAS_PARA_PARAR - 1):
            self.passo(None)
        self.passo({'transmitir': True})
        for _ in range(FALHAS_PARA_PARAR - 1):
            self.passo(None)
        self.assertTrue(self.tx.rodando)

    def test_reinicia_com_backoff_quando_cai_logo_apos_iniciar(self):
        self.passo({'transmitir': True})
        self.tx.morrer(duracao=2)

        self.passo({'transmitir': True})  # detecta a queda, agenda backoff de 2s
        self.assertEqual(self.tx.iniciadas, 1)

        self.relogio.t += 1
        self.passo({'transmitir': True})
        self.assertEqual(self.tx.iniciadas, 1)

        self.relogio.t += 2
        self.passo({'transmitir': True})
        self.assertEqual(self.tx.iniciadas, 2)

        # Segunda queda rápida: backoff dobra (4s)
        self.tx.morrer(duracao=2)
        self.passo({'transmitir': True})
        self.relogio.t += 3
        self.passo({'transmitir': True})
        self.assertEqual(self.tx.iniciadas, 2)
        self.relogio.t += 2
        self.passo({'transmitir': True})
        self.assertEqual(self.tx.iniciadas, 3)

    def test_queda_depois_de_estavel_reinicia_na_hora(self):
        self.passo({'transmitir': True})
        self.tx.morrer(duracao=INICIO_ESTAVEL_S + 60)
        self.passo({'transmitir': True})
        self.assertEqual(self.tx.iniciadas, 2)


class ConfigTests(unittest.TestCase):
    def test_rtsp_host_vem_da_url(self):
        self.assertEqual(config().rtsp_host, 'vps')

    def test_validacao(self):
        self.assertEqual(config().validar(), [])
        self.assertEqual(len(Config({}).validar()), 3)
        self.assertTrue(Config({'SMARTHIVE_URL': 'http://x', 'CAMERA_TOKEN': 't', 'CAMERA_FONTE': 'webcam'}).validar())


if __name__ == '__main__':
    unittest.main()
