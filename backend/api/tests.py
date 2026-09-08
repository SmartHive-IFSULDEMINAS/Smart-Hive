import json
from django.contrib.auth import get_user_model
from datetime import date
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import Apiario, Colmeia, Notificacao, AlertaRuidoConfig, ProducaoMel, LeituraSensor, ColetaProduto, AuditLog
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


class UsuarioMeTests(APITestCase):
	def test_me_retorna_flags_de_permissao_para_dono(self):
		dono = User.objects.create_user(username='dono1', password='SenhaForte123!', role='dono')
		self.client.force_authenticate(user=dono)

		response = self.client.get('/api/auth/me/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data['is_dono'])
		self.assertFalse(response.data['is_gestor'])
		self.assertTrue(response.data['can_manage_users'])
		self.assertTrue(response.data['can_manage_apiarios'])
		self.assertTrue(response.data['can_view_reports'])

	def test_me_retorna_flags_de_permissao_para_apicultor(self):
		apicultor = User.objects.create_user(username='apicultor1', password='SenhaForte123!', role='apicultor')
		self.client.force_authenticate(user=apicultor)

		response = self.client.get('/api/auth/me/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertFalse(response.data['is_dono'])
		self.assertFalse(response.data['can_manage_users'])

	def test_usuarios_viewset_lista_vazia_para_apicultor(self):
		apicultor = User.objects.create_user(username='apicultor2', password='SenhaForte123!', role='apicultor')
		User.objects.create_user(username='outro', password='SenhaForte123!', role='apicultor')
		self.client.force_authenticate(user=apicultor)

		response = self.client.get('/api/usuarios/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		resultados = response.data['results'] if 'results' in response.data else response.data
		self.assertEqual(len(resultados), 0)

	def test_usuarios_viewset_lista_todos_para_dono(self):
		dono = User.objects.create_user(username='dono2', password='SenhaForte123!', role='dono')
		User.objects.create_user(username='outro2', password='SenhaForte123!', role='apicultor')
		self.client.force_authenticate(user=dono)

		response = self.client.get('/api/usuarios/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		resultados = response.data['results'] if 'results' in response.data else response.data
		self.assertEqual(len(resultados), 2)

	def test_apicultor_nao_pode_criar_usuario_via_api(self):
		apicultor = User.objects.create_user(username='apic_create', password='SenhaForte123!', role='apicultor')
		self.client.force_authenticate(user=apicultor)

		response = self.client.post(
			'/api/usuarios/',
			{'username': 'tentativa', 'email': 'x@x.com', 'password': 'SenhaForte123!', 'role': 'dono'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
		self.assertFalse(User.objects.filter(username='tentativa').exists())

	def test_dono_pode_criar_usuario_com_senha_utilizavel(self):
		dono = User.objects.create_user(username='dono_create', password='SenhaForte123!', role='dono')
		self.client.force_authenticate(user=dono)

		response = self.client.post(
			'/api/usuarios/',
			{'username': 'gestor_criado', 'email': 'gestor@x.com', 'password': 'SenhaForte123!', 'role': 'gestor'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertNotIn('password', response.data)

		novo_usuario = User.objects.get(username='gestor_criado')
		self.assertEqual(novo_usuario.role, 'gestor')
		self.assertTrue(novo_usuario.check_password('SenhaForte123!'))

		login_response = self.client.post(
			'/api/auth/login/',
			{'username': 'gestor_criado', 'password': 'SenhaForte123!'},
			format='json',
		)
		self.assertEqual(login_response.status_code, status.HTTP_200_OK)

	def test_apicultor_nao_consegue_se_autopromover_via_profile(self):
		apicultor = User.objects.create_user(username='apic_escalar', password='SenhaForte123!', role='apicultor')
		self.client.force_authenticate(user=apicultor)

		response = self.client.patch(
			'/api/auth/profile/',
			{'is_superuser': True, 'is_staff': True, 'role': 'dono', 'first_name': 'Nome Legítimo'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		apicultor.refresh_from_db()
		self.assertFalse(apicultor.is_superuser)
		self.assertFalse(apicultor.is_staff)
		self.assertEqual(apicultor.role, 'apicultor')
		# A edição legítima (campo de perfil de verdade) continua funcionando
		self.assertEqual(apicultor.first_name, 'Nome Legítimo')

	def test_dono_nao_consegue_alterar_is_superuser_via_usuarios_viewset(self):
		dono = User.objects.create_user(username='dono_naoescala', password='SenhaForte123!', role='dono')
		outro = User.objects.create_user(username='alvo', password='SenhaForte123!', role='apicultor')
		self.client.force_authenticate(user=dono)

		response = self.client.patch(
			f'/api/usuarios/{outro.id}/',
			{'is_superuser': True, 'is_staff': True},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		outro.refresh_from_db()
		self.assertFalse(outro.is_superuser)
		self.assertFalse(outro.is_staff)


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


class IoTJsonUploadTests(APITestCase):
	def setUp(self):
		self.apiario = Apiario.objects.create(
			nome='Apiário Upload',
			localizacao='Zona Rural',
			data_criacao=date.today(),
		)
		self.colmeia = Colmeia.objects.create(
			apiario=self.apiario,
			identificador='CLM-UP-001',
			data_instalacao=date.today(),
		)

	def test_importa_arquivo_json_com_varias_leituras(self):
		payload = {
			'colmeia_identificador': self.colmeia.identificador,
			'leituras': [
				{
					'temperatura': 30.5,
					'nivel_ruido': 41.2,
					'timestamp': '2026-08-01T10:00:00-03:00',
				},
				{
					'temperatura': 31.7,
					'nivel_ruido': 43.8,
					'umidade': 66.4,
					'timestamp': '2026-08-01T10:05:00-03:00',
				},
			],
		}
		arquivo = SimpleUploadedFile(
			'leituras.json',
			json.dumps(payload).encode('utf-8'),
			content_type='application/json',
		)

		response = self.client.post(
			'/api/iot/colmeia/upload-json/',
			{
				'colmeia_identificador': self.colmeia.identificador,
				'arquivo_json': arquivo,
			},
			format='multipart',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['total_processado'], 2)
		self.assertEqual(response.data['colmeias_atualizadas'], [self.colmeia.identificador])
		self.assertEqual(LeituraSensor.objects.filter(colmeia=self.colmeia).count(), 2)

		self.colmeia.refresh_from_db()
		self.assertEqual(float(self.colmeia.temperatura_atual), 31.7)
		self.assertEqual(float(self.colmeia.nivel_ruido), 43.8)
		self.assertIsNotNone(self.colmeia.data_ultima_leitura_sensor)


class ColetaProdutoTests(APITestCase):
	def setUp(self):
		self.usuario = User.objects.create_user(
			username='apicultor1',
			email='apicultor1@smarthive.local',
			password='SenhaForte123!',
			role='apicultor',
		)
		self.apiario = Apiario.objects.create(
			nome='Apiário Coleta',
			localizacao='Zona Rural',
			data_criacao=date.today(),
		)
		self.colmeia = Colmeia.objects.create(
			apiario=self.apiario,
			identificador='CLM-COLETA-001',
			data_instalacao=date.today(),
		)
		self.client.force_authenticate(user=self.usuario)

	def test_cria_coleta_de_polen(self):
		response = self.client.post(
			'/api/coletas-produto/',
			{
				'colmeia': self.colmeia.id,
				'tipo_produto': 'polen',
				'data_coleta': '2026-09-01',
				'quantidade_g': '150.50',
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data['tipo_produto'], 'polen')
		self.assertEqual(response.data['colmeia_identificador'], self.colmeia.identificador)
		self.assertEqual(ColetaProduto.objects.filter(tipo_produto='polen').count(), 1)

	def test_cria_coleta_de_propolis(self):
		response = self.client.post(
			'/api/coletas-produto/',
			{
				'colmeia': self.colmeia.id,
				'tipo_produto': 'propolis',
				'data_coleta': '2026-09-01',
				'quantidade_g': '30.00',
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data['tipo_produto'], 'propolis')
		self.assertEqual(ColetaProduto.objects.filter(tipo_produto='propolis').count(), 1)

	def test_listagem_filtra_por_tipo_produto(self):
		ColetaProduto.objects.create(
			colmeia=self.colmeia, tipo_produto='polen', data_coleta=date(2026, 9, 1), quantidade_g=100,
		)
		ColetaProduto.objects.create(
			colmeia=self.colmeia, tipo_produto='propolis', data_coleta=date(2026, 9, 1), quantidade_g=40,
		)

		response = self.client.get('/api/coletas-produto/?tipo_produto=polen')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		resultados = response.data['results'] if 'results' in response.data else response.data
		self.assertEqual(len(resultados), 1)
		self.assertEqual(resultados[0]['tipo_produto'], 'polen')

	def test_dashboard_reflete_totais_de_polen_e_propolis(self):
		hoje = date.today()
		ColetaProduto.objects.create(
			colmeia=self.colmeia, tipo_produto='polen', data_coleta=hoje, quantidade_g=100,
		)
		ColetaProduto.objects.create(
			colmeia=self.colmeia, tipo_produto='polen', data_coleta=hoje, quantidade_g=50,
		)
		ColetaProduto.objects.create(
			colmeia=self.colmeia, tipo_produto='propolis', data_coleta=hoje, quantidade_g=25,
		)

		response = self.client.get('/api/dashboard/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(float(response.data['producao_polen_mes_g']), 150.0)
		self.assertEqual(float(response.data['producao_propolis_mes_g']), 25.0)

	def test_export_excel_retorna_arquivo_xlsx(self):
		ColetaProduto.objects.create(
			colmeia=self.colmeia, tipo_produto='polen', data_coleta=date.today(), quantidade_g=100,
		)

		response = self.client.get('/api/export/coletas-produto/?tipo_produto=polen&format=excel')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('spreadsheetml', response['Content-Type'])

	def test_export_pdf_retorna_arquivo_pdf(self):
		ColetaProduto.objects.create(
			colmeia=self.colmeia, tipo_produto='propolis', data_coleta=date.today(), quantidade_g=30,
		)

		response = self.client.get('/api/export/coletas-produto/?tipo_produto=propolis&format=pdf')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response['Content-Type'], 'application/pdf')


class AuditLogTests(APITestCase):
	def setUp(self):
		self.dono = User.objects.create_user(username='dono_audit', password='SenhaForte123!', role='dono')
		self.apicultor = User.objects.create_user(username='apicultor_audit', password='SenhaForte123!', role='apicultor')
		self.apiario = Apiario.objects.create(
			nome='Apiário Audit', localizacao='Zona Rural', data_criacao=date.today(),
		)

	def test_registrar_navegacao_cria_log_view(self):
		self.client.force_authenticate(user=self.apicultor)

		response = self.client.post(
			'/api/log-navegacao/',
			{'pagina': '/relatorios', 'titulo': 'Relatórios'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		log = AuditLog.objects.filter(user=self.apicultor, action='VIEW').first()
		self.assertIsNotNone(log)
		self.assertEqual(log.model_name, '/relatorios')

	def test_mutacao_em_qualquer_endpoint_de_api_gera_log(self):
		"""Antes, só 8 caminhos fixos eram auditados; agora cobre qualquer endpoint da API."""
		self.client.force_authenticate(user=self.dono)

		response = self.client.post(
			'/api/apiarios/',
			{'nome': 'Novo Apiário', 'localizacao': 'Zona Rural', 'data_criacao': str(date.today())},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		log = AuditLog.objects.filter(user=self.dono, action='CREATE', model_name='apiarios').first()
		self.assertIsNotNone(log)

	def test_endpoint_de_navegacao_nao_gera_log_recursivo(self):
		self.client.force_authenticate(user=self.dono)
		self.client.post('/api/log-navegacao/', {'pagina': '/colmeias', 'titulo': 'Colmeias'}, format='json')

		logs_para_log_navegacao = AuditLog.objects.filter(model_name='log-navegacao')
		self.assertEqual(logs_para_log_navegacao.count(), 0)

	def test_logs_viewset_vazio_para_apicultor(self):
		AuditLog.log_action(user=self.dono, action='VIEW', model_name='/colmeias')
		self.client.force_authenticate(user=self.apicultor)

		response = self.client.get('/api/logs/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		resultados = response.data['results'] if 'results' in response.data else response.data
		self.assertEqual(len(resultados), 0)

	def test_logs_viewset_lista_para_dono(self):
		AuditLog.log_action(user=self.dono, action='VIEW', model_name='/colmeias')
		AuditLog.log_action(user=self.apicultor, action='VIEW', model_name='/apiarios')
		self.client.force_authenticate(user=self.dono)

		response = self.client.get('/api/logs/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		resultados = response.data['results'] if 'results' in response.data else response.data
		self.assertEqual(len(resultados), 2)

	def test_logs_viewset_filtra_por_usuario(self):
		AuditLog.log_action(user=self.dono, action='VIEW', model_name='/colmeias')
		AuditLog.log_action(user=self.apicultor, action='VIEW', model_name='/apiarios')
		self.client.force_authenticate(user=self.dono)

		response = self.client.get(f'/api/logs/?usuario={self.apicultor.id}')

		resultados = response.data['results'] if 'results' in response.data else response.data
		self.assertEqual(len(resultados), 1)
		self.assertEqual(resultados[0]['usuario_username'], 'apicultor_audit')
