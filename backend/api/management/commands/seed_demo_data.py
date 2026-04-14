"""
Comando Django para popular o banco com dados de demonstracao
"""
import random
from datetime import date, timedelta, datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import (
    EspecieAbelha, Apiario, Colmeia, Inspecao, ProducaoMel, Tratamento,
    Custo, Receita, Fornecedor, Equipamento, Notificacao, LeituraSensor
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Popula o banco de dados com dados de demonstracao'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('[SEED] Iniciando populacao de dados de demonstracao...'))
        
        # Limpar dados existentes (opcional)
        self.stdout.write('Limpando dados existentes...')
        LeituraSensor.objects.all().delete()
        Notificacao.objects.all().delete()
        Equipamento.objects.all().delete()
        Receita.objects.all().delete()
        Custo.objects.all().delete()
        Fornecedor.objects.all().delete()
        Tratamento.objects.all().delete()
        ProducaoMel.objects.all().delete()
        Inspecao.objects.all().delete()
        Colmeia.objects.all().delete()
        Apiario.objects.all().delete()
        EspecieAbelha.objects.all().delete()
        User.objects.filter(username__in=['dono', 'gestor', 'apicultor']).delete()
        
        # Criar usuários de exemplo
        self.stdout.write('Criando usuários...')
        dono = User.objects.create_user(
            username='dono',
            email='dono@smarthive.com',
            password='admin123',
            role='dono',
            first_name='João',
            last_name='Silva',
            telefone='(11) 99999-0001',
            is_staff=True
        )
        gestor = User.objects.create_user(
            username='gestor',
            email='gestor@smarthive.com',
            password='admin123',
            role='gestor',
            first_name='Maria',
            last_name='Santos',
            telefone='(11) 99999-0002'
        )
        apicultor = User.objects.create_user(
            username='apicultor',
            email='apicultor@smarthive.com',
            password='admin123',
            role='apicultor',
            first_name='Pedro',
            last_name='Oliveira',
            telefone='(11) 99999-0003'
        )
        self.stdout.write(f'  [OK] 3 usuários criados')
        
        # Criar Especies de Abelhas
        self.stdout.write('Criando especies de abelhas...')
        especies = [
            EspecieAbelha.objects.create(
                nome='Apis mellifera',
                nome_cientifico='Apis mellifera ligustica',
                descricao='Abelha europeia, a mais comum na apicultura comercial. Excelente produtora de mel.',
                caracteristicas='Coloracao amarelo-dourada, muito produtiva, relativamente docil.',
                nivel_agressividade=2,
                producao_media_anual_kg=Decimal('25.00'),
                cor_identificacao='#F4A100'
            ),
            EspecieAbelha.objects.create(
                nome='Abelha Africanizada',
                nome_cientifico='Apis mellifera scutellata hybrid',
                descricao='Hibrido entre abelhas africanas e europeias. Muito produtiva mas defensiva.',
                caracteristicas='Mais agressiva, resistente a doencas, alta produtividade.',
                nivel_agressividade=4,
                producao_media_anual_kg=Decimal('30.00'),
                cor_identificacao='#FF5722'
            ),
            EspecieAbelha.objects.create(
                nome='Jatai',
                nome_cientifico='Tetragonisca angustula',
                descricao='Abelha nativa sem ferrao. Mel muito valorizado e medicinal.',
                caracteristicas='Pequena, docil, sem ferrao. Produz mel de alta qualidade.',
                nivel_agressividade=1,
                producao_media_anual_kg=Decimal('1.50'),
                cor_identificacao='#4CAF50'
            ),
            EspecieAbelha.objects.create(
                nome='Mandacaia',
                nome_cientifico='Melipona quadrifasciata',
                descricao='Abelha nativa brasileira sem ferrao. Mel premium.',
                caracteristicas='Porte medio, docil, mel com propriedades medicinais.',
                nivel_agressividade=1,
                producao_media_anual_kg=Decimal('3.00'),
                cor_identificacao='#2196F3'
            ),
            EspecieAbelha.objects.create(
                nome='Urucu',
                nome_cientifico='Melipona scutellaris',
                descricao='Abelha nativa do Nordeste brasileiro. Maior das meliponineas.',
                caracteristicas='Grande porte, mansa, excelente para meliponicultura.',
                nivel_agressividade=1,
                producao_media_anual_kg=Decimal('5.00'),
                cor_identificacao='#9C27B0'
            ),
            EspecieAbelha.objects.create(
                nome='Carnica',
                nome_cientifico='Apis mellifera carnica',
                descricao='Abelha originaria dos Alpes. Muito mansa e boa para iniciantes.',
                caracteristicas='Cinza-escura, muito docil, boa para climas frios.',
                nivel_agressividade=2,
                producao_media_anual_kg=Decimal('22.00'),
                cor_identificacao='#607D8B'
            ),
        ]
        self.stdout.write(f'  [OK] {len(especies)} especies criadas')

        # Criar Apiarios
        self.stdout.write('Criando apiarios...')
        apiarios = [
            Apiario.objects.create(
                nome='Apiario Central',
                localizacao='Fazenda Santa Clara - Lote 15',
                latitude=Decimal('-23.5505'),
                longitude=Decimal('-46.6333'),
                descricao='Apiario principal da fazenda, proximo ao pomar de laranjeiras.',
                responsavel=gestor,
                responsavel_nome='Maria Santos',
                telefone_contato='(11) 99999-1234',
                data_criacao=date(2020, 3, 15),
                ativo=True,
                proprietario=dono,
                observacoes='Acesso pela estrada principal, porteira verde.'
            ),
            Apiario.objects.create(
                nome='Apiario do Vale',
                localizacao='Vale das Flores - Setor B',
                latitude=Decimal('-23.5600'),
                longitude=Decimal('-46.6400'),
                descricao='Apiario em area de florada silvestre, excelente para mel multifloral.',
                responsavel=apicultor,
                responsavel_nome='Pedro Oliveira',
                telefone_contato='(11) 99999-5678',
                data_criacao=date(2021, 6, 20),
                ativo=True,
                proprietario=dono,
                observacoes='Area com sombra natural. Levar agua extra.'
            ),
            Apiario.objects.create(
                nome='Apiario do Eucalipto',
                localizacao='Reflorestamento Norte - Km 12',
                latitude=Decimal('-23.5300'),
                longitude=Decimal('-46.6100'),
                descricao='Proximo a plantacao de eucaliptos. Mel monofloral.',
                responsavel=apicultor,
                responsavel_nome='Pedro Oliveira',
                telefone_contato='(11) 99999-9012',
                data_criacao=date(2022, 1, 10),
                ativo=True,
                proprietario=dono,
                observacoes='Melhor producao entre julho e setembro.'
            ),
            Apiario.objects.create(
                nome='Apiario das Nascentes',
                localizacao='Area de Preservacao - Nascente 3',
                latitude=Decimal('-23.5700'),
                longitude=Decimal('-46.6500'),
                descricao='Area de mata nativa com abelhas sem ferrao.',
                responsavel=gestor,
                responsavel_nome='Maria Santos',
                telefone_contato='(11) 99999-3456',
                data_criacao=date(2023, 4, 5),
                ativo=True,
                proprietario=dono,
                observacoes='Apenas meliponineos. Area sensivel.'
            ),
            Apiario.objects.create(
                nome='Apiario Experimental',
                localizacao='Centro de Pesquisa - Galpao 2',
                latitude=Decimal('-23.5400'),
                longitude=Decimal('-46.6200'),
                descricao='Apiario para testes e reproducao de rainhas.',
                responsavel=gestor,
                responsavel_nome='Maria Santos',
                telefone_contato='(11) 99999-7890',
                data_criacao=date(2019, 8, 1),
                ativo=False,
                proprietario=dono,
                observacoes='Temporariamente inativo para manutencao.'
            ),
        ]
        self.stdout.write(f'  [OK] {len(apiarios)} apiarios criados')

        # Criar Colmeias
        self.stdout.write('Criando colmeias...')
        colmeias = []
        status_choices = ['ativa', 'ativa', 'ativa', 'ativa', 'quarentena', 'inativa']
        tipo_caixa_choices = ['langstroth', 'langstroth', 'top_bar', 'warre', 'inpa']
        
        colmeia_num = 1
        for apiario in apiarios[:4]:  # Nao incluir o inativo
            num_colmeias = random.randint(8, 15)
            for i in range(num_colmeias):
                especie = random.choice(especies[:2]) if apiario.nome != 'Apiario das Nascentes' else random.choice(especies[2:5])
                status = random.choice(status_choices)
                
                colmeia = Colmeia.objects.create(
                    apiario=apiario,
                    especie=especie,
                    identificador=f'CLM-{colmeia_num:03d}',
                    nome=f'Colmeia {colmeia_num}' if random.random() > 0.5 else '',
                    tipo_caixa=random.choice(tipo_caixa_choices),
                    quantidade_abelhas_estimada=random.randint(20000, 80000),
                    status=status,
                    data_instalacao=date(2020, 1, 1) + timedelta(days=random.randint(0, 1500)),
                    idade_rainha_meses=random.randint(1, 24),
                    data_ultima_troca_rainha=date.today() - timedelta(days=random.randint(30, 365)) if random.random() > 0.3 else None,
                    numero_quadros=random.randint(8, 12),
                    peso_estimado_kg=Decimal(str(random.randint(20, 45))),
                    observacoes='Colmeia forte e produtiva.' if status == 'ativa' else 'Necessita atencao.' if status == 'quarentena' else ''
                )
                colmeias.append(colmeia)
                colmeia_num += 1
        
        self.stdout.write(f'  [OK] {len(colmeias)} colmeias criadas')

        # Criar Leituras de Sensores IoT
        self.stdout.write('Criando leituras de sensores IoT...')
        leituras_criadas = 0
        agora = datetime.now()

        for colmeia in colmeias:
            sensor_ativo = colmeia.status == 'ativa' and random.random() > 0.25

            if not sensor_ativo:
                colmeia.sensor_iot_ativo = False
                colmeia.temperatura_atual = None
                colmeia.nivel_ruido = None
                colmeia.luminosidade = None
                colmeia.umidade = None
                colmeia.pressao = None
                colmeia.peso = None
                colmeia.data_ultima_leitura_sensor = None
                colmeia.save(update_fields=[
                    'sensor_iot_ativo',
                    'temperatura_atual',
                    'nivel_ruido',
                    'luminosidade',
                    'umidade',
                    'pressao',
                    'peso',
                    'data_ultima_leitura_sensor',
                ])
                continue

            quantidade_leituras = random.randint(24, 120)
            dispositivo_id = f"ESP32-{colmeia.identificador}"
            timestamp_base = agora - timedelta(days=random.randint(3, 30))
            ultima_leitura = None
            ultimo_payload = None

            for indice in range(quantidade_leituras):
                timestamp_leitura = timestamp_base + timedelta(minutes=30 * indice)

                temperatura = Decimal(str(round(random.uniform(18.0, 38.0), 2)))
                ruido = Decimal(str(round(random.uniform(38.0, 92.0), 2)))
                luminosidade = Decimal(str(round(random.uniform(15.0, 2800.0), 2)))
                umidade = Decimal(str(round(random.uniform(35.0, 92.0), 2)))
                pressao = Decimal(str(round(random.uniform(980.0, 1035.0), 2)))
                peso = Decimal(str(round(random.uniform(18.0, 55.0), 2)))
                bateria_nivel = random.randint(25, 100)
                sinal_rssi = random.randint(-92, -45)

                leitura = LeituraSensor.objects.create(
                    colmeia=colmeia,
                    temperatura=temperatura,
                    nivel_ruido=ruido,
                    luminosidade=luminosidade,
                    umidade=umidade,
                    pressao=pressao,
                    peso=peso,
                    dispositivo_id=dispositivo_id,
                    bateria_nivel=bateria_nivel,
                    sinal_rssi=sinal_rssi,
                )
                LeituraSensor.objects.filter(id=leitura.id).update(timestamp=timestamp_leitura)
                leituras_criadas += 1

                ultima_leitura = timestamp_leitura
                ultimo_payload = {
                    'temperatura': temperatura,
                    'nivel_ruido': ruido,
                    'luminosidade': luminosidade,
                    'umidade': umidade,
                    'pressao': pressao,
                    'peso': peso,
                }

            colmeia.sensor_iot_ativo = True
            colmeia.temperatura_atual = ultimo_payload['temperatura']
            colmeia.nivel_ruido = ultimo_payload['nivel_ruido']
            colmeia.luminosidade = ultimo_payload['luminosidade']
            colmeia.umidade = ultimo_payload['umidade']
            colmeia.pressao = ultimo_payload['pressao']
            colmeia.peso = ultimo_payload['peso']
            colmeia.data_ultima_leitura_sensor = ultima_leitura
            colmeia.save(update_fields=[
                'sensor_iot_ativo',
                'temperatura_atual',
                'nivel_ruido',
                'luminosidade',
                'umidade',
                'pressao',
                'peso',
                'data_ultima_leitura_sensor',
            ])

        for apiario in apiarios:
            colmeias_com_sensor = [
                c for c in colmeias
                if c.apiario_id == apiario.id and c.sensor_iot_ativo and c.temperatura_atual is not None
            ]

            if not colmeias_com_sensor:
                apiario.sensor_iot_ativo = False
                apiario.temperatura_atual = None
                apiario.data_ultima_leitura_sensor = None
            else:
                temperatura_media = sum(c.temperatura_atual for c in colmeias_com_sensor) / Decimal(len(colmeias_com_sensor))
                ultima_leitura_apiario = max(c.data_ultima_leitura_sensor for c in colmeias_com_sensor if c.data_ultima_leitura_sensor)

                apiario.sensor_iot_ativo = True
                apiario.temperatura_atual = Decimal(str(round(float(temperatura_media), 2)))
                apiario.data_ultima_leitura_sensor = ultima_leitura_apiario

            apiario.save(update_fields=['sensor_iot_ativo', 'temperatura_atual', 'data_ultima_leitura_sensor'])

        self.stdout.write(f'  [OK] {leituras_criadas} leituras IoT criadas')

        # Criar Inspecoes
        self.stdout.write('Criando inspecoes...')
        condicao_choices = ['excelente', 'boa', 'boa', 'regular', 'ruim']
        quantidade_choices = ['abundante', 'moderada', 'moderada', 'baixa']
        inspetores = ['Joao Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa']
        
        inspecoes_criadas = 0
        for colmeia in colmeias:
            num_inspecoes = random.randint(2, 6)
            for i in range(num_inspecoes):
                data_insp = datetime.now() - timedelta(days=random.randint(1, 180))
                condicao = random.choice(condicao_choices)
                tem_problemas = condicao in ['regular', 'ruim']
                
                Inspecao.objects.create(
                    colmeia=colmeia,
                    data=data_insp,
                    inspetor=random.choice(inspetores),
                    condicao_geral=condicao,
                    presenca_rainha=random.random() > 0.1,
                    rainha_marcada=random.random() > 0.6,
                    quantidade_crias=random.choice(quantidade_choices),
                    quantidade_mel=random.choice(quantidade_choices),
                    quantidade_polen=random.choice(quantidade_choices),
                    presenca_pragas=tem_problemas and random.random() > 0.5,
                    tipo_pragas='Varroa' if tem_problemas and random.random() > 0.5 else '',
                    presenca_doencas=tem_problemas and random.random() > 0.7,
                    tipo_doencas='Nosemose' if tem_problemas and random.random() > 0.7 else '',
                    alimentacao_artificial=random.random() > 0.7,
                    tipo_alimentacao='Xarope de acucar 1:1' if random.random() > 0.7 else '',
                    temperatura_ambiente=Decimal(str(random.randint(18, 35))),
                    umidade_ambiente=random.randint(40, 80),
                    observacoes='Colmeia em boas condicoes.' if condicao in ['excelente', 'boa'] else 'Necessario acompanhamento.',
                    proxima_inspecao=date.today() + timedelta(days=random.randint(7, 30)) if random.random() > 0.3 else None
                )
                inspecoes_criadas += 1
        
        self.stdout.write(f'  [OK] {inspecoes_criadas} inspecoes criadas')

        # Criar Producoes de Mel
        self.stdout.write('Criando registros de producao...')
        tipo_mel_choices = ['florada_silvestre', 'laranjeira', 'eucalipto', 'multifloral', 'assa_peixe']
        qualidade_choices = ['extra', 'primeira', 'primeira', 'segunda']
        
        producoes_criadas = 0
        for colmeia in [c for c in colmeias if c.status == 'ativa']:
            num_producoes = random.randint(2, 8)
            for i in range(num_producoes):
                data_colheita = date.today() - timedelta(days=random.randint(30, 365))
                
                ProducaoMel.objects.create(
                    colmeia=colmeia,
                    data_colheita=data_colheita,
                    quantidade_kg=Decimal(str(round(random.uniform(1.5, 12.0), 2))),
                    tipo_mel=random.choice(tipo_mel_choices),
                    qualidade=random.choice(qualidade_choices),
                    numero_quadros_colhidos=random.randint(2, 8),
                    umidade_mel=Decimal(str(round(random.uniform(17.0, 20.0), 1))),
                    observacoes='Mel de excelente qualidade.' if random.random() > 0.5 else ''
                )
                producoes_criadas += 1
        
        self.stdout.write(f'  [OK] {producoes_criadas} producoes criadas')

        # Criar Tratamentos
        self.stdout.write('Criando tratamentos...')
        tipo_tratamento_choices = ['preventivo', 'curativo', 'alimentacao', 'controle_pragas']
        medicamentos = ['Acido Oxalico', 'Acido Formico', 'Timol', 'ApiLife VAR', 'Apistan']
        
        tratamentos_criados = 0
        for colmeia in random.sample(colmeias, min(20, len(colmeias))):
            num_tratamentos = random.randint(1, 3)
            for i in range(num_tratamentos):
                data_inicio = date.today() - timedelta(days=random.randint(10, 120))
                finalizado = random.random() > 0.3
                
                Tratamento.objects.create(
                    colmeia=colmeia,
                    tipo_tratamento=random.choice(tipo_tratamento_choices),
                    data_inicio=data_inicio,
                    data_fim=data_inicio + timedelta(days=random.randint(7, 21)) if finalizado else None,
                    medicamento=random.choice(medicamentos),
                    dosagem='Conforme bula',
                    frequencia_aplicacao='Semanal',
                    motivo='Tratamento preventivo contra Varroa' if random.random() > 0.5 else 'Controle de pragas identificadas',
                    status='concluido' if finalizado else 'em_andamento',
                    resultado='Tratamento eficaz, colmeia recuperada.' if finalizado else '',
                    custo=Decimal(str(round(random.uniform(15.0, 80.0), 2))),
                    observacoes='Seguir protocolo padrao.'
                )
                tratamentos_criados += 1
        
        self.stdout.write(f'  [OK] {tratamentos_criados} tratamentos criados')
        
        # Criar Fornecedores
        self.stdout.write('Criando fornecedores...')
        fornecedores = [
            Fornecedor.objects.create(
                nome='Apicultura Brasil Ltda',
                tipo_fornecedor='equipamento',
                cnpj='12.345.678/0001-90',
                telefone='(11) 3333-1111',
                email='contato@apicultbrasil.com.br',
                endereco='Rua das Abelhas, 123 - São Paulo/SP',
                contato='Carlos Mendes',
                ativo=True
            ),
            Fornecedor.objects.create(
                nome='Mel & Cia',
                tipo_fornecedor='medicamento',
                cnpj='98.765.432/0001-10',
                telefone='(11) 3333-2222',
                email='vendas@melcia.com.br',
                endereco='Av. Apicultura, 456 - Campinas/SP',
                contato='Ana Paula',
                ativo=True
            ),
            Fornecedor.objects.create(
                nome='Equipamentos Apícolas Silva',
                tipo_fornecedor='equipamento',
                telefone='(11) 3333-3333',
                email='silva@equipapi.com.br',
                endereco='Rodovia dos Apiários, Km 5 - Piracicaba/SP',
                contato='José Silva',
                ativo=True
            ),
        ]
        self.stdout.write(f'  [OK] {len(fornecedores)} fornecedores criados')
        
        # Criar Equipamentos
        self.stdout.write('Criando equipamentos...')
        equipamentos = []
        tipos_equip = ['fumegador', 'extrator', 'vestimenta', 'ferramenta', 'caixa']
        status_equip = ['disponivel', 'disponivel', 'em_uso', 'manutencao']
        marcas = ['Apisul', 'Mondragon', 'Ferrari', 'Mann Lake']
        
        for i, apiario in enumerate(apiarios[:3]):
            for j in range(random.randint(3, 6)):
                equip = Equipamento.objects.create(
                    nome=f'Equipamento {i*5+j+1}',
                    tipo_equipamento=random.choice(tipos_equip),
                    marca=random.choice(marcas),
                    modelo=f'Modelo {random.randint(100, 999)}',
                    data_compra=date.today() - timedelta(days=random.randint(30, 730)),
                    valor_compra=Decimal(str(round(random.uniform(50.0, 500.0), 2))),
                    fornecedor=random.choice(fornecedores),
                    status=random.choice(status_equip),
                    apiario=apiario if random.random() > 0.3 else None,
                    observacoes='Equipamento em bom estado.'
                )
                equipamentos.append(equip)
        self.stdout.write(f'  [OK] {len(equipamentos)} equipamentos criados')
        
        # Criar Custos
        self.stdout.write('Criando custos...')
        tipos_custo = ['equipamento', 'medicamento', 'alimentacao', 'manutencao', 'transporte']
        custos_criados = 0
        for i in range(30):
            apiario_custo = random.choice(apiarios[:4]) if random.random() > 0.3 else None
            colmeia_custo = random.choice([c for c in colmeias if c.apiario == apiario_custo]) if apiario_custo and random.random() > 0.5 else None
            
            Custo.objects.create(
                descricao=f'Custo {tipos_custo[random.randint(0, len(tipos_custo)-1)]} - {i+1}',
                tipo_custo=random.choice(tipos_custo),
                valor=Decimal(str(round(random.uniform(20.0, 300.0), 2))),
                data=date.today() - timedelta(days=random.randint(1, 180)),
                apiario=apiario_custo,
                colmeia=colmeia_custo,
                fornecedor=random.choice(fornecedores).nome if random.random() > 0.5 else '',
                nota_fiscal=f'NF-{random.randint(1000, 9999)}' if random.random() > 0.3 else '',
                created_by=random.choice([dono, gestor, apicultor]),
                observacoes='Custo operacional normal.'
            )
            custos_criados += 1
        self.stdout.write(f'  [OK] {custos_criados} custos criados')
        
        # Criar Receitas
        self.stdout.write('Criando receitas...')
        tipos_receita = ['venda_mel', 'venda_propolis', 'venda_cera', 'servico_polinizacao']
        clientes = ['Mercado Central', 'Loja do Mel Premium', 'Distribuidora ABC', 'Cliente Final']
        receitas_criadas = 0
        
        for producao in ProducaoMel.objects.all()[:20]:
            if random.random() > 0.4:  # 60% das produções geram receita
                preco_kg = Decimal(str(round(random.uniform(25.0, 80.0), 2)))
                quantidade = producao.quantidade_kg
                valor_total = preco_kg * quantidade
                
                Receita.objects.create(
                    descricao=f'Venda de {producao.get_tipo_mel_display()}',
                    tipo_receita='venda_mel',
                    valor=valor_total,
                    data=producao.data_colheita + timedelta(days=random.randint(1, 30)),
                    cliente=random.choice(clientes),
                    quantidade_kg=quantidade,
                    preco_unitario=preco_kg,
                    producao=producao,
                    created_by=random.choice([dono, gestor]),
                    observacoes='Venda realizada com sucesso.'
                )
                receitas_criadas += 1
        
        # Receitas adicionais
        for i in range(10):
            Receita.objects.create(
                descricao=f'Receita adicional {i+1}',
                tipo_receita=random.choice(tipos_receita),
                valor=Decimal(str(round(random.uniform(100.0, 2000.0), 2))),
                data=date.today() - timedelta(days=random.randint(1, 90)),
                cliente=random.choice(clientes),
                created_by=random.choice([dono, gestor]),
                observacoes='Receita registrada.'
            )
            receitas_criadas += 1
        self.stdout.write(f'  [OK] {receitas_criadas} receitas criadas')
        
        # Criar Notificações
        self.stdout.write('Criando notificacoes...')
        usuarios_notif = [dono, gestor, apicultor]
        tipos_notif = ['inspecao', 'tratamento', 'producao', 'alerta_saude', 'manutencao']
        prioridades = ['baixa', 'media', 'media', 'alta']
        
        notificacoes_criadas = 0
        for usuario in usuarios_notif:
            for i in range(random.randint(3, 8)):
                colmeia_notif = random.choice(colmeias) if random.random() > 0.3 else None
                apiario_notif = colmeia_notif.apiario if colmeia_notif else random.choice(apiarios[:4])
                
                Notificacao.objects.create(
                    titulo=f'Notificação {tipos_notif[random.randint(0, len(tipos_notif)-1)]} - {i+1}',
                    mensagem='Ação necessária para esta colmeia/apiário.',
                    tipo=random.choice(tipos_notif),
                    prioridade=random.choice(prioridades),
                    usuario=usuario,
                    lida=random.random() > 0.4,
                    colmeia=colmeia_notif,
                    apiario=apiario_notif
                )
                notificacoes_criadas += 1
        self.stdout.write(f'  [OK] {notificacoes_criadas} notificacoes criadas')

        # Resumo
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS('Dados de demonstracao criados com sucesso!'))
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(f'  Usuarios: 3 (dono/admin123, gestor/admin123, apicultor/admin123)')
        self.stdout.write(f'  Apiarios: {len(apiarios)}')
        self.stdout.write(f'  Especies: {len(especies)}')
        self.stdout.write(f'  Colmeias: {len(colmeias)}')
        self.stdout.write(f'  Inspecoes: {inspecoes_criadas}')
        self.stdout.write(f'  Producoes: {producoes_criadas}')
        self.stdout.write(f'  Leituras IoT: {leituras_criadas}')
        self.stdout.write(f'  Tratamentos: {tratamentos_criados}')
        self.stdout.write(f'  Fornecedores: {len(fornecedores)}')
        self.stdout.write(f'  Equipamentos: {len(equipamentos)}')
        self.stdout.write(f'  Custos: {custos_criados}')
        self.stdout.write(f'  Receitas: {receitas_criadas}')
        self.stdout.write(f'  Notificacoes: {notificacoes_criadas}')
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('Para acessar: http://localhost:5173'))
        self.stdout.write(self.style.WARNING('Usuários de teste: dono/admin123, gestor/admin123, apicultor/admin123'))
