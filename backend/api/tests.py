import json
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import Apiario, Colmeia, Notificacao, AlertaRuidoConfig, ProducaoMel, LeituraSensor, ColetaProduto, AuditLog, Custo, Receita, ClassificacaoPolen, Camera, EspectadorCamera
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


class FinanceiroPermissionTests(APITestCase):
	def setUp(self):
		self.dono = User.objects.create_user(username='dono_fin', password='SenhaForte123!', role='dono')
		self.apicultor = User.objects.create_user(username='apicultor_fin', password='SenhaForte123!', role='apicultor')
		Custo.objects.create(descricao='Custo existente', tipo_custo='outro', valor=50, data=date.today())
		Receita.objects.create(descricao='Receita existente', tipo_receita='outro', valor=100, data=date.today())

	def test_apicultor_nao_ve_custos(self):
		self.client.force_authenticate(user=self.apicultor)

		response = self.client.get('/api/custos/')

		resultados = response.data['results'] if 'results' in response.data else response.data
		self.assertEqual(len(resultados), 0)

	def test_apicultor_nao_pode_criar_custo(self):
		self.client.force_authenticate(user=self.apicultor)

		response = self.client.post(
			'/api/custos/',
			{'descricao': 'Tentativa', 'tipo_custo': 'outro', 'valor': 10, 'data': str(date.today())},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
		self.assertFalse(Custo.objects.filter(descricao='Tentativa').exists())

	def test_apicultor_nao_pode_criar_receita(self):
		self.client.force_authenticate(user=self.apicultor)

		response = self.client.post(
			'/api/receitas/',
			{'descricao': 'Tentativa', 'tipo_receita': 'outro', 'valor': 10, 'data': str(date.today())},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_dono_ve_e_cria_custos_e_receitas(self):
		self.client.force_authenticate(user=self.dono)

		list_response = self.client.get('/api/custos/')
		resultados = list_response.data['results'] if 'results' in list_response.data else list_response.data
		self.assertEqual(len(resultados), 1)

		create_response = self.client.post(
			'/api/receitas/',
			{'descricao': 'Nova receita', 'tipo_receita': 'venda_mel', 'valor': 250, 'data': str(date.today())},
			format='json',
		)
		self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(create_response.data['created_by_username'], 'dono_fin')

	def test_apicultor_nao_pode_exportar_financeiro(self):
		self.client.force_authenticate(user=self.apicultor)

		response = self.client.get('/api/export/financeiro/?format=excel')

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ClassificacaoPolenPayloadIdTests(APITestCase):
	AMOSTRA = {
		'F1': 2, 'F2': 8, 'F3': 5, 'F4': 13, 'F5': 23,
		'F6': 20, 'F7': 21, 'F8': 5, 'NIR': 61, 'CLEAR': 2,
	}

	def test_id_do_payload_e_salvo_e_retornado(self):
		response = self.client.post(
			'/api/ia/polen/classificar/',
			{**self.AMOSTRA, 'id': 'amostra-42'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['payload_id'], 'amostra-42')

		classificacao = ClassificacaoPolen.objects.get(id=response.data['id'])
		self.assertEqual(classificacao.payload_id, 'amostra-42')

	def test_payload_sem_id_salva_payload_id_vazio(self):
		response = self.client.post('/api/ia/polen/classificar/', self.AMOSTRA, format='json')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['payload_id'], '')

		classificacao = ClassificacaoPolen.objects.get(id=response.data['id'])
		self.assertEqual(classificacao.payload_id, '')

	def test_id_numerico_no_payload_e_convertido_para_string(self):
		response = self.client.post(
			'/api/ia/polen/classificar/',
			{**self.AMOSTRA, 'id': 12345},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['payload_id'], '12345')

	def test_payload_id_aparece_na_listagem(self):
		self.client.post('/api/ia/polen/classificar/', {**self.AMOSTRA, 'id': 'amostra-lista'}, format='json')

		dono = User.objects.create_user(username='dono_polen', password='SenhaForte123!', role='dono')
		self.client.force_authenticate(user=dono)

		response = self.client.get('/api/ia/classificacoes/')

		resultados = response.data['results'] if 'results' in response.data else response.data
		self.assertEqual(resultados[0]['payload_id'], 'amostra-lista')


class ImportarCsvPolenTests(APITestCase):
	CABECALHO = 'DATA,ID,TIPO,ESPECIE,NOTAS,F1,F2,F3,F4,F5,F6,F7,F8,NIR,CLEAR'
	LINHA_VALIDA = '2026-01-10 08:00:00,amostra-csv-1,eucalipto,Eucalyptus sp.,coleta manhã,2,8,5,13,23,20,21,5,61,2'

	def setUp(self):
		self.dono = User.objects.create_user(username='dono_csv', password='SenhaForte123!', role='dono')

	def _upload(self, conteudo, nome='dados.csv'):
		arquivo = SimpleUploadedFile(nome, conteudo.encode('utf-8'), content_type='text/csv')
		return self.client.post('/api/ia/polen/upload-csv/', {'arquivo_csv': arquivo}, format='multipart')

	def test_requer_autenticacao(self):
		response = self._upload(self.CABECALHO + '\n' + self.LINHA_VALIDA)

		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_csv_valido_cria_registro_com_origem_csv_e_payload_id(self):
		self.client.force_authenticate(user=self.dono)

		response = self._upload(self.CABECALHO + '\n' + self.LINHA_VALIDA)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['total_processado'], 1)
		self.assertEqual(response.data['total_ignorado'], 0)

		classificacao = ClassificacaoPolen.objects.get(id=response.data['ids_criados'][0])
		self.assertEqual(classificacao.origem, 'csv')
		self.assertEqual(classificacao.payload_id, 'amostra-csv-1')
		self.assertEqual(classificacao.timestamp.year, 2026)
		self.assertEqual(classificacao.timestamp.month, 1)
		self.assertEqual(classificacao.timestamp.day, 10)
		self.assertIn('eucalipto', classificacao.notas)
		self.assertIn('Eucalyptus sp.', classificacao.notas)
		self.assertIn('coleta manhã', classificacao.notas)
		self.assertIsNotNone(classificacao.knn_classe)
		self.assertIsNotNone(classificacao.kmeans_cluster)

	def test_colunas_obrigatorias_ausentes_retorna_400(self):
		self.client.force_authenticate(user=self.dono)

		response = self._upload('DATA,ID,F1,F2,F3\n2026-01-10,amostra-1,2,8,5')

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertFalse(response.data['success'])

	def test_csv_minimo_sem_colunas_opcionais_funciona(self):
		self.client.force_authenticate(user=self.dono)

		cabecalho = 'F1,F2,F3,F4,F5,F6,F7,F8,NIR,CLEAR'
		linha = '2,8,5,13,23,20,21,5,61,2'

		response = self._upload(cabecalho + '\n' + linha)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['total_processado'], 1)

		classificacao = ClassificacaoPolen.objects.get(id=response.data['ids_criados'][0])
		self.assertEqual(classificacao.origem, 'csv')
		self.assertEqual(classificacao.payload_id, '')

	def test_linha_invalida_e_ignorada_sem_abortar_o_restante(self):
		self.client.force_authenticate(user=self.dono)

		linha_invalida = '2026-01-10,amostra-ruim,ruim,,,abc,8,5,13,23,20,21,5,61,2'
		conteudo = '\n'.join([self.CABECALHO, linha_invalida, self.LINHA_VALIDA])

		response = self._upload(conteudo)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['total_linhas'], 2)
		self.assertEqual(response.data['total_processado'], 1)
		self.assertEqual(response.data['total_ignorado'], 1)
		self.assertEqual(response.data['ignoradas'][0]['linha'], 2)

	def test_filtro_origem_na_listagem(self):
		self.client.force_authenticate(user=self.dono)

		self._upload(self.CABECALHO + '\n' + self.LINHA_VALIDA)
		self.client.post(
			'/api/ia/polen/classificar/',
			{'F1': 2, 'F2': 8, 'F3': 5, 'F4': 13, 'F5': 23, 'F6': 20, 'F7': 21, 'F8': 5, 'NIR': 61, 'CLEAR': 2},
			format='json',
		)

		resp_csv = self.client.get('/api/ia/classificacoes/?origem=csv')
		resp_ao_vivo = self.client.get('/api/ia/classificacoes/?origem=ao_vivo')

		resultados_csv = resp_csv.data['results'] if 'results' in resp_csv.data else resp_csv.data
		resultados_ao_vivo = resp_ao_vivo.data['results'] if 'results' in resp_ao_vivo.data else resp_ao_vivo.data

		self.assertEqual(len(resultados_csv), 1)
		self.assertEqual(resultados_csv[0]['origem'], 'csv')
		self.assertEqual(len(resultados_ao_vivo), 1)
		self.assertEqual(resultados_ao_vivo[0]['origem'], 'ao_vivo')


@override_settings(MEDIAMTX_AUTH_SECRET='segredo-teste', CAMERA_SESSAO_MAX_MINUTOS=30)
class CameraAoVivoTests(APITestCase):
	def setUp(self):
		self.usuario = User.objects.create_user(
			username='apicultor_cam',
			email='cam@smarthive.local',
			password='SenhaForte123!',
			role='apicultor',
		)
		self.outro = User.objects.create_user(
			username='gestor_cam',
			email='cam2@smarthive.local',
			password='SenhaForte123!',
			role='gestor',
		)
		self.camera = Camera.objects.create(nome='Câmera Teste', caminho_stream='camera1')
		cache.clear()

	# ── helpers ──────────────────────────────────────────────────────────
	def _jwt(self, usuario=None):
		return str(RefreshToken.for_user(usuario or self.usuario).access_token)

	def _ligar(self, usuario=None):
		self.client.force_authenticate(user=usuario or self.usuario)
		return self.client.post('/api/camera/ligar/')

	def _renovar(self, sessao, usuario=None):
		self.client.force_authenticate(user=usuario or self.usuario)
		return self.client.post('/api/camera/renovar/', {'sessao': sessao}, format='json')

	def _desligar(self, sessao, usuario=None):
		self.client.force_authenticate(user=usuario or self.usuario)
		return self.client.post('/api/camera/desligar/', {'sessao': sessao}, format='json')

	def _estado_pi(self, token=None):
		self.client.force_authenticate(user=None)
		return self.client.get(
			'/api/camera/pi/estado/',
			HTTP_X_CAMERA_TOKEN=token if token is not None else self.camera.token,
		)

	def _mediamtx_auth(self, payload, segredo='segredo-teste'):
		self.client.force_authenticate(user=None)
		return self.client.post(
			f'/api/camera/mediamtx-auth/?segredo={segredo}',
			payload,
			format='json',
		)

	def _ler(self, **extra):
		return self._mediamtx_auth({'action': 'read', 'path': 'camera1', 'token': self._jwt(), **extra})

	def _publicar(self, senha=None, path='camera1'):
		return self._mediamtx_auth({
			'action': 'publish', 'path': path, 'user': 'camera',
			'password': self.camera.token if senha is None else senha,
		})

	# ── status ───────────────────────────────────────────────────────────
	def test_token_gerado_automaticamente(self):
		self.assertTrue(self.camera.token)

	def test_status_exige_login(self):
		response = self.client.get('/api/camera/')
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_status_inicial_desligada(self):
		self.client.force_authenticate(user=self.usuario)
		response = self.client.get('/api/camera/')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertFalse(response.data['ativa'])
		self.assertFalse(response.data['pi_online'])
		self.assertEqual(response.data['espectadores'], 0)
		self.assertEqual(response.data['hls_url'], '/hls/camera1/index.m3u8')
		self.assertNotIn('token', response.data)

	def test_status_sem_camera_cadastrada(self):
		Camera.objects.all().delete()
		self.client.force_authenticate(user=self.usuario)
		response = self.client.get('/api/camera/')
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

	# ── sessões ──────────────────────────────────────────────────────────
	def test_ligar_faz_pi_transmitir_e_desligar_para(self):
		self.assertFalse(self._estado_pi().data['transmitir'])

		response = self._ligar()
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data['ativa'])
		self.assertTrue(response.data['sessao'])
		self.assertTrue(self._estado_pi().data['transmitir'])

		self.assertEqual(self._desligar(response.data['sessao']).status_code, status.HTTP_200_OK)
		self.assertFalse(self._estado_pi().data['transmitir'])

	def test_um_espectador_saindo_nao_derruba_o_outro(self):
		sessao_a = self._ligar().data['sessao']
		self._ligar(self.outro)

		self._desligar(sessao_a)

		self.assertTrue(self._estado_pi().data['transmitir'])
		self.client.force_authenticate(user=self.usuario)
		self.assertEqual(self.client.get('/api/camera/').data['espectadores'], 1)

	def test_nao_desliga_sessao_de_outro_usuario(self):
		sessao_outro = self._ligar(self.outro).data['sessao']
		response = self._desligar(sessao_outro, usuario=self.usuario)
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
		self.assertTrue(self._estado_pi().data['transmitir'])

	def test_desligar_sem_sessao_valida(self):
		self.assertEqual(self._desligar('').status_code, status.HTTP_400_BAD_REQUEST)
		self.assertEqual(self._desligar('nao-e-uuid').status_code, status.HTTP_400_BAD_REQUEST)

	def test_sessao_expira_sem_heartbeat(self):
		sessao = self._ligar().data['sessao']
		EspectadorCamera.objects.filter(sessao=sessao).update(expira_em=timezone.now() - timedelta(seconds=1))
		self.assertFalse(self._estado_pi().data['transmitir'])

	def test_renovar_estende_a_sessao(self):
		sessao = self._ligar().data['sessao']
		EspectadorCamera.objects.filter(sessao=sessao).update(expira_em=timezone.now() + timedelta(seconds=5))

		response = self._renovar(sessao)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		espectador = EspectadorCamera.objects.get(sessao=sessao)
		self.assertGreater(espectador.expira_em, timezone.now() + timedelta(seconds=60))

	def test_renovar_sessao_inexistente(self):
		response = self._renovar('00000000-0000-0000-0000-000000000000')
		self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
		self.assertEqual(response.data['motivo'], 'sessao_inexistente')

	def test_renovar_sessao_expirada_e_recusado(self):
		sessao = self._ligar().data['sessao']
		EspectadorCamera.objects.filter(sessao=sessao).update(expira_em=timezone.now() - timedelta(seconds=1))
		response = self._renovar(sessao)
		self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
		self.assertEqual(response.data['motivo'], 'sessao_inexistente')

	def test_renovar_apos_tempo_maximo_encerra_a_sessao(self):
		sessao = self._ligar().data['sessao']
		EspectadorCamera.objects.filter(sessao=sessao).update(
			iniciada_em=timezone.now() - timedelta(minutes=31),
		)

		response = self._renovar(sessao)

		self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
		self.assertEqual(response.data['motivo'], 'tempo_esgotado')
		self.assertFalse(self._estado_pi().data['transmitir'])

	def test_renovar_nao_e_auditado(self):
		antes_ligar = AuditLog.objects.count()
		sessao = self._ligar().data['sessao']
		# ligar é auditado (quem ligou a câmera fica registrado)...
		self.assertEqual(AuditLog.objects.count(), antes_ligar + 1)
		antes = AuditLog.objects.count()
		# ...o heartbeat não
		self._renovar(sessao)
		self.assertEqual(AuditLog.objects.count(), antes)

	def test_ligar_limpa_sessoes_antigas(self):
		antiga = EspectadorCamera.objects.create(
			camera=self.camera, usuario=self.outro,
			expira_em=timezone.now() - timedelta(hours=2),
		)
		self._ligar()
		self.assertFalse(EspectadorCamera.objects.filter(pk=antiga.pk).exists())

	# ── Pi ───────────────────────────────────────────────────────────────
	def test_estado_pi_com_token_invalido(self):
		self.assertEqual(self._estado_pi(token='errado').status_code, status.HTTP_401_UNAUTHORIZED)
		self.assertEqual(self._estado_pi(token='').status_code, status.HTTP_401_UNAUTHORIZED)

	def test_estado_pi_marca_pi_online(self):
		self._estado_pi()
		self.client.force_authenticate(user=self.usuario)
		self.assertTrue(self.client.get('/api/camera/').data['pi_online'])

	def test_estado_pi_nao_grava_contato_a_cada_consulta(self):
		self._estado_pi()
		primeiro = Camera.objects.get(pk=self.camera.pk).ultimo_contato_pi
		self._estado_pi()
		self.assertEqual(Camera.objects.get(pk=self.camera.pk).ultimo_contato_pi, primeiro)

	# ── webhook do MediaMTX ──────────────────────────────────────────────
	def test_mediamtx_auth_segredo_errado(self):
		self._ligar()
		self.assertEqual(self._publicar_com_segredo('errado').status_code, status.HTTP_401_UNAUTHORIZED)

	@override_settings(MEDIAMTX_AUTH_SECRET='')
	def test_mediamtx_auth_sem_segredo_configurado_nega_tudo(self):
		self._ligar()
		self.assertEqual(self._publicar_com_segredo('').status_code, status.HTTP_401_UNAUTHORIZED)

	def _publicar_com_segredo(self, segredo):
		return self._mediamtx_auth(
			{'action': 'publish', 'path': 'camera1', 'user': 'camera', 'password': self.camera.token},
			segredo=segredo,
		)

	def test_mediamtx_auth_publish(self):
		# Sem ninguém assistindo, nem o Pi publica
		self.assertEqual(self._publicar().status_code, status.HTTP_401_UNAUTHORIZED)

		self._ligar()
		self.assertEqual(self._publicar().status_code, status.HTTP_200_OK)
		self.assertEqual(self._publicar(senha='x').status_code, status.HTTP_401_UNAUTHORIZED)
		self.assertEqual(self._publicar(path='outra').status_code, status.HTTP_401_UNAUTHORIZED)

	def test_mediamtx_auth_read(self):
		# Sem sessão ativa ninguém assiste
		self.assertEqual(self._ler().status_code, status.HTTP_401_UNAUTHORIZED)

		self._ligar()
		self.assertEqual(self._ler().status_code, status.HTTP_200_OK)
		self.assertEqual(self._ler(token='nao-e-um-jwt').status_code, status.HTTP_401_UNAUTHORIZED)

	def test_mediamtx_auth_read_com_jwt_na_query(self):
		self._ligar()
		response = self._mediamtx_auth({'action': 'read', 'path': 'camera1', 'query': f'jwt={self._jwt()}'})
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_mediamtx_auth_read_usuario_inativo(self):
		self._ligar(self.outro)
		self.usuario.ativo = False
		self.usuario.save()
		self.assertEqual(self._ler().status_code, status.HTTP_401_UNAUTHORIZED)

		self.usuario.ativo = True
		self.usuario.is_active = False
		self.usuario.save()
		self.assertEqual(self._ler().status_code, status.HTTP_401_UNAUTHORIZED)

	def test_mediamtx_auth_acoes_desconhecidas_negadas(self):
		self._ligar()
		for acao in ('api', 'metrics', 'pprof', 'playback'):
			response = self._mediamtx_auth({'action': acao, 'path': 'camera1', 'token': self._jwt()})
			self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, acao)

	def test_mediamtx_auth_read_usa_cache(self):
		self._ligar()
		jwt = self._jwt()
		payload = {'action': 'read', 'path': 'camera1', 'token': jwt}
		self.assertEqual(self._mediamtx_auth(payload).status_code, status.HTTP_200_OK)

		# Liberação em cache: não refaz validação de JWT/usuário a cada segmento
		with self.assertNumQueries(2):  # câmera + sessão ativa
			response = self.client.post('/api/camera/mediamtx-auth/?segredo=segredo-teste', payload, format='json')
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_mediamtx_auth_read_cache_nao_vale_sem_sessao(self):
		sessao = self._ligar().data['sessao']
		self.assertEqual(self._ler().status_code, status.HTTP_200_OK)
		self._desligar(sessao)
		# Com a câmera desligada, nega mesmo com a liberação ainda em cache
		self.assertEqual(self._ler().status_code, status.HTTP_401_UNAUTHORIZED)
