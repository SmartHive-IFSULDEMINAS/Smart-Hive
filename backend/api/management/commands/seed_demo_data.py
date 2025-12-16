"""
Comando Django para popular o banco com dados de demonstracao
"""
import random
from datetime import date, timedelta, datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from api.models import EspecieAbelha, Apiario, Colmeia, Inspecao, ProducaoMel, Tratamento


class Command(BaseCommand):
    help = 'Popula o banco de dados com dados de demonstracao'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('[SEED] Iniciando populacao de dados de demonstracao...'))
        
        # Limpar dados existentes (opcional)
        self.stdout.write('Limpando dados existentes...')
        Tratamento.objects.all().delete()
        ProducaoMel.objects.all().delete()
        Inspecao.objects.all().delete()
        Colmeia.objects.all().delete()
        Apiario.objects.all().delete()
        EspecieAbelha.objects.all().delete()
        
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
                responsavel='Joao Silva',
                telefone_contato='(11) 99999-1234',
                data_criacao=date(2020, 3, 15),
                ativo=True,
                observacoes='Acesso pela estrada principal, porteira verde.'
            ),
            Apiario.objects.create(
                nome='Apiario do Vale',
                localizacao='Vale das Flores - Setor B',
                latitude=Decimal('-23.5600'),
                longitude=Decimal('-46.6400'),
                descricao='Apiario em area de florada silvestre, excelente para mel multifloral.',
                responsavel='Maria Santos',
                telefone_contato='(11) 99999-5678',
                data_criacao=date(2021, 6, 20),
                ativo=True,
                observacoes='Area com sombra natural. Levar agua extra.'
            ),
            Apiario.objects.create(
                nome='Apiario do Eucalipto',
                localizacao='Reflorestamento Norte - Km 12',
                latitude=Decimal('-23.5300'),
                longitude=Decimal('-46.6100'),
                descricao='Proximo a plantacao de eucaliptos. Mel monofloral.',
                responsavel='Pedro Oliveira',
                telefone_contato='(11) 99999-9012',
                data_criacao=date(2022, 1, 10),
                ativo=True,
                observacoes='Melhor producao entre julho e setembro.'
            ),
            Apiario.objects.create(
                nome='Apiario das Nascentes',
                localizacao='Area de Preservacao - Nascente 3',
                latitude=Decimal('-23.5700'),
                longitude=Decimal('-46.6500'),
                descricao='Area de mata nativa com abelhas sem ferrao.',
                responsavel='Ana Costa',
                telefone_contato='(11) 99999-3456',
                data_criacao=date(2023, 4, 5),
                ativo=True,
                observacoes='Apenas meliponineos. Area sensivel.'
            ),
            Apiario.objects.create(
                nome='Apiario Experimental',
                localizacao='Centro de Pesquisa - Galpao 2',
                latitude=Decimal('-23.5400'),
                longitude=Decimal('-46.6200'),
                descricao='Apiario para testes e reproducao de rainhas.',
                responsavel='Dr. Carlos Mendes',
                telefone_contato='(11) 99999-7890',
                data_criacao=date(2019, 8, 1),
                ativo=False,
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

        # Resumo
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS('Dados de demonstracao criados com sucesso!'))
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(f'  Apiarios: {len(apiarios)}')
        self.stdout.write(f'  Especies: {len(especies)}')
        self.stdout.write(f'  Colmeias: {len(colmeias)}')
        self.stdout.write(f'  Inspecoes: {inspecoes_criadas}')
        self.stdout.write(f'  Producoes: {producoes_criadas}')
        self.stdout.write(f'  Tratamentos: {tratamentos_criados}')
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('Para acessar: http://localhost:5173'))
