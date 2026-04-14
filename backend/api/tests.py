from django.contrib.auth import get_user_model
from datetime import date
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import Apiario, Colmeia, Notificacao, AlertaRuidoConfig, ProducaoMel
from api.alert_utils import gerar_alerta_producao


User = get_user_model()


class AuthLoginTests(APITestCase):
	def setUp(self):
		self.password = 'SenhaForte123!'
		self.superuser = User.objects.create_superuser(
			username='admin',
			email='admin@smarthive.local',
			password=self.password,
		)

	def test_superuser_can_login_with_username(self):
		response = self.client.post(
			'/api/auth/login/',
			{'username': 'admin', 'password': self.password},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('access', response.data)
		self.assertIn('refresh', response.data)
		self.assertEqual(response.data['user']['username'], 'admin')

	def test_superuser_can_login_with_email_and_whitespace(self):
		response = self.client.post(
			'/api/auth/login/',
			{'username': '  admin@smarthive.local  ', 'password': self.password},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('access', response.data)
		self.assertEqual(response.data['user']['username'], 'admin')

	def test_login_with_invalid_password_returns_401(self):
		response = self.client.post(
			'/api/auth/login/',
			{'username': 'admin', 'password': 'senha_errada'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AlertaRuidoTests(APITestCase):
	def setUp(self):
		self.usuario_alerta = User.objects.create_user(
			username='gestor1',
			email='gestor1@smarthive.local',
			password='SenhaForte123!',
			role='gestor',
		)
		self.apiario = Apiario.objects.create(
			nome='Apiário Teste',
			localizacao='Zona Rural',
			data_criacao=date.today(),
		)
		self.colmeia = Colmeia.objects.create(
			apiario=self.apiario,
			identificador='CLM-TESTE-001',
			data_instalacao=date.today(),
		)
		AlertaRuidoConfig.objects.update_or_create(
			usuario=self.usuario_alerta,
			defaults={
				'ativo': True,
				'janela_media': 10,
				'percentual_desvio': 20,
				'alertar_temperatura': True,
				'desvio_temperatura': 20,
				'alertar_producao': True,
				'desvio_producao': 20,
				'cooldown_minutos': 30,
			},
		)

	def _enviar_leitura_ruido(self, valor_ruido):
		return self.client.post(
			'/api/iot/colmeia/dados/',
			{
				'colmeia_identificador': self.colmeia.identificador,
				'nivel_ruido': valor_ruido,
			},
			format='json',
		)

	def test_gera_alerta_quando_ruido_ultrapassa_media_movel(self):
		for _ in range(10):
			response = self._enviar_leitura_ruido(40)
			self.assertEqual(response.status_code, status.HTTP_200_OK)

		response = self._enviar_leitura_ruido(60)
		self.assertEqual(response.status_code, status.HTTP_200_OK)

		notificacoes = Notificacao.objects.filter(
			usuario=self.usuario_alerta,
			colmeia=self.colmeia,
			tipo='alerta_ruido',
		)
		self.assertEqual(notificacoes.count(), 1)
		self.assertIn('Ruído atual', notificacoes.first().mensagem)

	def test_cooldown_evitar_alertas_repetidos(self):
		for _ in range(10):
			self._enviar_leitura_ruido(40)

		self._enviar_leitura_ruido(60)
		self._enviar_leitura_ruido(62)

		notificacoes = Notificacao.objects.filter(
			usuario=self.usuario_alerta,
			colmeia=self.colmeia,
			tipo='alerta_ruido',
		)
		self.assertEqual(notificacoes.count(), 1)

	def test_usuario_pode_atualizar_janela_configuracao(self):
		self.client.force_authenticate(user=self.usuario_alerta)

		response = self.client.patch(
			'/api/notificacoes/alerta_ruido_config/',
			{'janela_media': 20},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['janela_media'], 20)

	def test_gera_alerta_quando_temperatura_ultrapassa_media_movel(self):
		for _ in range(10):
			response = self.client.post(
				'/api/iot/colmeia/dados/',
				{
					'colmeia_identificador': self.colmeia.identificador,
					'temperatura': 30,
				},
				format='json',
			)
			self.assertEqual(response.status_code, status.HTTP_200_OK)

		response = self.client.post(
			'/api/iot/colmeia/dados/',
			{
				'colmeia_identificador': self.colmeia.identificador,
				'temperatura': 40,
			},
			format='json',
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)

		notificacao = Notificacao.objects.filter(
			usuario=self.usuario_alerta,
			colmeia=self.colmeia,
			tipo='alerta_temperatura',
		).first()

		self.assertIsNotNone(notificacao)
		self.assertIn('Temperatura atual', notificacao.mensagem)

	def test_gera_alerta_quando_producao_foge_da_media(self):
		for indice in range(10):
			ProducaoMel.objects.create(
				colmeia=self.colmeia,
				data_colheita=date(2026, 1, indice + 1),
				quantidade_kg=10,
			)

		nova_producao = ProducaoMel.objects.create(
			colmeia=self.colmeia,
			data_colheita=date(2026, 2, 20),
			quantidade_kg=20,
			tipo_mel='multifloral',
			qualidade='primeira',
		)

		gerar_alerta_producao(nova_producao)

		notificacao = Notificacao.objects.filter(
			usuario=self.usuario_alerta,
			colmeia=self.colmeia,
			tipo='alerta_producao',
		).first()

		self.assertIsNotNone(notificacao)
		self.assertIn('Produção atual', notificacao.mensagem)
