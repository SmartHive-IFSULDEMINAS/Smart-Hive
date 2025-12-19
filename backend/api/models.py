from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class Usuario(AbstractUser):
    """Modelo de usuário customizado com roles"""
    
    ROLE_CHOICES = [
        ('dono', 'Dono/Proprietário'),
        ('gestor', 'Gestor'),
        ('apicultor', 'Apicultor'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='apicultor',
        verbose_name='Papel/Função'
    )
    telefone = models.CharField(max_length=20, blank=True, verbose_name='Telefone')
    cpf = models.CharField(max_length=14, blank=True, verbose_name='CPF')
    data_nascimento = models.DateField(null=True, blank=True, verbose_name='Data de Nascimento')
    endereco = models.TextField(blank=True, verbose_name='Endereço')
    foto = models.ImageField(upload_to='usuarios/', blank=True, null=True, verbose_name='Foto')
    ativo = models.BooleanField(default=True, verbose_name='Ativo')
    data_cadastro = models.DateTimeField(auto_now_add=True, verbose_name='Data de Cadastro')
    ultimo_acesso = models.DateTimeField(null=True, blank=True, verbose_name='Último Acesso')
    
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        ordering = ['username']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_dono(self):
        return self.role == 'dono'
    
    @property
    def is_gestor(self):
        return self.role == 'gestor'
    
    @property
    def is_apicultor(self):
        return self.role == 'apicultor'
    
    def can_manage_users(self):
        """Pode gerenciar usuários"""
        return self.role in ['dono', 'gestor']
    
    def can_manage_apiarios(self):
        """Pode criar/editar/deletar apiários"""
        return self.role in ['dono', 'gestor']
    
    def can_view_reports(self):
        """Pode visualizar relatórios financeiros"""
        return self.role in ['dono', 'gestor']
    
    def can_edit_all(self):
        """Pode editar qualquer registro"""
        return self.role == 'dono'


class EspecieAbelha(models.Model):
    """Modelo para espécies de abelhas"""
    
    NIVEL_AGRESSIVIDADE_CHOICES = [
        (1, 'Muito Dócil'),
        (2, 'Dócil'),
        (3, 'Moderada'),
        (4, 'Agressiva'),
        (5, 'Muito Agressiva'),
    ]
    
    nome = models.CharField(max_length=100, verbose_name='Nome Popular')
    nome_cientifico = models.CharField(max_length=150, blank=True, verbose_name='Nome Científico')
    descricao = models.TextField(blank=True, verbose_name='Descrição')
    caracteristicas = models.TextField(blank=True, verbose_name='Características')
    nivel_agressividade = models.IntegerField(
        choices=NIVEL_AGRESSIVIDADE_CHOICES,
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Nível de Agressividade'
    )
    producao_media_anual_kg = models.DecimalField(
        max_digits=6, 
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Produção Média Anual (kg)'
    )
    cor_identificacao = models.CharField(max_length=7, default='#F4A100', verbose_name='Cor de Identificação')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Espécie de Abelha'
        verbose_name_plural = 'Espécies de Abelhas'
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} ({self.nome_cientifico})" if self.nome_cientifico else self.nome


class Apiario(models.Model):
    """Modelo para apiários (localizações)"""
    
    nome = models.CharField(max_length=100, verbose_name='Nome do Apiário')
    localizacao = models.CharField(max_length=255, verbose_name='Localização/Endereço')
    latitude = models.DecimalField(
        max_digits=10, 
        decimal_places=7, 
        null=True, 
        blank=True,
        verbose_name='Latitude'
    )
    longitude = models.DecimalField(
        max_digits=10, 
        decimal_places=7, 
        null=True, 
        blank=True,
        verbose_name='Longitude'
    )
    descricao = models.TextField(blank=True, verbose_name='Descrição')
    responsavel = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='apiarios_responsavel',
        verbose_name='Responsável'
    )
    responsavel_nome = models.CharField(max_length=100, blank=True, verbose_name='Nome do Responsável (Legado)')
    telefone_contato = models.CharField(max_length=20, blank=True, verbose_name='Telefone de Contato')
    data_criacao = models.DateField(verbose_name='Data de Criação')
    ativo = models.BooleanField(default=True, verbose_name='Ativo')
    foto = models.ImageField(upload_to='apiarios/', blank=True, null=True, verbose_name='Foto')
    observacoes = models.TextField(blank=True, verbose_name='Observações')
    proprietario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='apiarios_proprietario',
        verbose_name='Proprietário',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Apiário'
        verbose_name_plural = 'Apiários'
        ordering = ['nome']
    
    def __str__(self):
        return self.nome
    
    @property
    def total_colmeias(self):
        return self.colmeias.count()
    
    @property
    def colmeias_ativas(self):
        return self.colmeias.filter(status='ativa').count()


class Colmeia(models.Model):
    """Modelo para colmeias/caixas"""
    
    STATUS_CHOICES = [
        ('ativa', 'Ativa'),
        ('inativa', 'Inativa'),
        ('quarentena', 'Em Quarentena'),
        ('morta', 'Morta/Abandonada'),
    ]
    
    TIPO_CAIXA_CHOICES = [
        ('langstroth', 'Langstroth'),
        ('top_bar', 'Top Bar'),
        ('warre', 'Warré'),
        ('inpa', 'INPA'),
        ('af', 'AF (Africanizada)'),
        ('outro', 'Outro'),
    ]
    
    apiario = models.ForeignKey(
        Apiario, 
        on_delete=models.CASCADE, 
        related_name='colmeias',
        verbose_name='Apiário'
    )
    especie = models.ForeignKey(
        EspecieAbelha, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='colmeias',
        verbose_name='Espécie'
    )
    identificador = models.CharField(max_length=50, unique=True, verbose_name='Identificador/Código')
    nome = models.CharField(max_length=100, blank=True, verbose_name='Nome/Apelido')
    tipo_caixa = models.CharField(
        max_length=20, 
        choices=TIPO_CAIXA_CHOICES, 
        default='langstroth',
        verbose_name='Tipo de Caixa'
    )
    quantidade_abelhas_estimada = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Quantidade de Abelhas Estimada'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='ativa',
        verbose_name='Status'
    )
    data_instalacao = models.DateField(verbose_name='Data de Instalação')
    idade_rainha_meses = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='Idade da Rainha (meses)'
    )
    data_ultima_troca_rainha = models.DateField(null=True, blank=True, verbose_name='Data Última Troca de Rainha')
    numero_quadros = models.IntegerField(
        default=10,
        validators=[MinValueValidator(1)],
        verbose_name='Número de Quadros'
    )
    peso_estimado_kg = models.DecimalField(
        max_digits=6, 
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Peso Estimado (kg)'
    )
    observacoes = models.TextField(blank=True, verbose_name='Observações')
    foto = models.ImageField(upload_to='colmeias/', blank=True, null=True, verbose_name='Foto')
    data_ultima_inspecao = models.DateField(null=True, blank=True, verbose_name='Data Última Inspeção')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Colmeia'
        verbose_name_plural = 'Colmeias'
        ordering = ['apiario', 'identificador']
    
    def __str__(self):
        return f"{self.identificador} - {self.apiario.nome}"
    
    @property
    def producao_total(self):
        total = self.producoes.aggregate(total=models.Sum('quantidade_kg'))['total']
        return total or 0


class Inspecao(models.Model):
    """Modelo para inspeções de colmeias"""
    
    CONDICAO_CHOICES = [
        ('excelente', 'Excelente'),
        ('boa', 'Boa'),
        ('regular', 'Regular'),
        ('ruim', 'Ruim'),
        ('critica', 'Crítica'),
    ]
    
    QUANTIDADE_CHOICES = [
        ('abundante', 'Abundante'),
        ('moderada', 'Moderada'),
        ('baixa', 'Baixa'),
        ('ausente', 'Ausente'),
    ]
    
    colmeia = models.ForeignKey(
        Colmeia, 
        on_delete=models.CASCADE, 
        related_name='inspecoes',
        verbose_name='Colmeia'
    )
    data = models.DateTimeField(verbose_name='Data da Inspeção')
    inspetor = models.CharField(max_length=100, blank=True, verbose_name='Inspetor/Responsável')
    condicao_geral = models.CharField(
        max_length=20, 
        choices=CONDICAO_CHOICES,
        verbose_name='Condição Geral'
    )
    presenca_rainha = models.BooleanField(default=True, verbose_name='Presença da Rainha')
    rainha_marcada = models.BooleanField(default=False, verbose_name='Rainha Marcada')
    quantidade_crias = models.CharField(
        max_length=20, 
        choices=QUANTIDADE_CHOICES,
        default='moderada',
        verbose_name='Quantidade de Crias'
    )
    quantidade_mel = models.CharField(
        max_length=20, 
        choices=QUANTIDADE_CHOICES,
        default='moderada',
        verbose_name='Quantidade de Mel'
    )
    quantidade_polen = models.CharField(
        max_length=20, 
        choices=QUANTIDADE_CHOICES,
        default='moderada',
        verbose_name='Quantidade de Pólen'
    )
    presenca_pragas = models.BooleanField(default=False, verbose_name='Presença de Pragas')
    tipo_pragas = models.CharField(max_length=200, blank=True, verbose_name='Tipo de Pragas')
    presenca_doencas = models.BooleanField(default=False, verbose_name='Presença de Doenças')
    tipo_doencas = models.CharField(max_length=200, blank=True, verbose_name='Tipo de Doenças')
    alimentacao_artificial = models.BooleanField(default=False, verbose_name='Alimentação Artificial')
    tipo_alimentacao = models.CharField(max_length=100, blank=True, verbose_name='Tipo de Alimentação')
    temperatura_ambiente = models.DecimalField(
        max_digits=4, 
        decimal_places=1,
        null=True,
        blank=True,
        verbose_name='Temperatura Ambiente (°C)'
    )
    umidade_ambiente = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Umidade Ambiente (%)'
    )
    observacoes = models.TextField(blank=True, verbose_name='Observações')
    acoes_realizadas = models.TextField(blank=True, verbose_name='Ações Realizadas')
    proxima_inspecao = models.DateField(null=True, blank=True, verbose_name='Próxima Inspeção')
    foto = models.ImageField(upload_to='inspecoes/', blank=True, null=True, verbose_name='Foto')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Inspeção'
        verbose_name_plural = 'Inspeções'
        ordering = ['-data']
    
    def __str__(self):
        return f"Inspeção {self.colmeia.identificador} - {self.data.strftime('%d/%m/%Y')}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Atualiza a data da última inspeção na colmeia
        self.colmeia.data_ultima_inspecao = self.data.date()
        self.colmeia.save()


class ProducaoMel(models.Model):
    """Modelo para registro de produção de mel"""
    
    QUALIDADE_CHOICES = [
        ('extra', 'Extra'),
        ('primeira', 'Primeira'),
        ('segunda', 'Segunda'),
        ('industrial', 'Industrial'),
    ]
    
    TIPO_MEL_CHOICES = [
        ('florada_silvestre', 'Florada Silvestre'),
        ('laranjeira', 'Laranjeira'),
        ('eucalipto', 'Eucalipto'),
        ('assa_peixe', 'Assa-Peixe'),
        ('cipó_uva', 'Cipó-Uva'),
        ('multifloral', 'Multifloral'),
        ('outro', 'Outro'),
    ]
    
    colmeia = models.ForeignKey(
        Colmeia, 
        on_delete=models.CASCADE, 
        related_name='producoes',
        verbose_name='Colmeia'
    )
    data_colheita = models.DateField(verbose_name='Data da Colheita')
    quantidade_kg = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Quantidade (kg)'
    )
    tipo_mel = models.CharField(
        max_length=30, 
        choices=TIPO_MEL_CHOICES,
        default='multifloral',
        verbose_name='Tipo de Mel'
    )
    qualidade = models.CharField(
        max_length=20, 
        choices=QUALIDADE_CHOICES,
        default='primeira',
        verbose_name='Qualidade'
    )
    numero_quadros_colhidos = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        verbose_name='Número de Quadros Colhidos'
    )
    umidade_mel = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        verbose_name='Umidade do Mel (%)'
    )
    observacoes = models.TextField(blank=True, verbose_name='Observações')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Produção de Mel'
        verbose_name_plural = 'Produções de Mel'
        ordering = ['-data_colheita']
    
    def __str__(self):
        return f"{self.quantidade_kg}kg - {self.colmeia.identificador} - {self.data_colheita.strftime('%d/%m/%Y')}"


class Tratamento(models.Model):
    """Modelo para tratamentos e saúde das colmeias"""
    
    TIPO_TRATAMENTO_CHOICES = [
        ('preventivo', 'Preventivo'),
        ('curativo', 'Curativo'),
        ('alimentacao', 'Alimentação Suplementar'),
        ('controle_pragas', 'Controle de Pragas'),
        ('outro', 'Outro'),
    ]
    
    STATUS_CHOICES = [
        ('em_andamento', 'Em Andamento'),
        ('concluido', 'Concluído'),
        ('cancelado', 'Cancelado'),
    ]
    
    colmeia = models.ForeignKey(
        Colmeia, 
        on_delete=models.CASCADE, 
        related_name='tratamentos',
        verbose_name='Colmeia'
    )
    tipo_tratamento = models.CharField(
        max_length=30, 
        choices=TIPO_TRATAMENTO_CHOICES,
        verbose_name='Tipo de Tratamento'
    )
    data_inicio = models.DateField(verbose_name='Data de Início')
    data_fim = models.DateField(null=True, blank=True, verbose_name='Data de Término')
    medicamento = models.CharField(max_length=150, blank=True, verbose_name='Medicamento/Produto')
    dosagem = models.CharField(max_length=100, blank=True, verbose_name='Dosagem')
    frequencia_aplicacao = models.CharField(max_length=100, blank=True, verbose_name='Frequência de Aplicação')
    motivo = models.TextField(verbose_name='Motivo/Diagnóstico')
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES,
        default='em_andamento',
        verbose_name='Status'
    )
    resultado = models.TextField(blank=True, verbose_name='Resultado')
    custo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Custo (R$)'
    )
    observacoes = models.TextField(blank=True, verbose_name='Observações')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Tratamento'
        verbose_name_plural = 'Tratamentos'
        ordering = ['-data_inicio']
    
    def __str__(self):
        return f"{self.get_tipo_tratamento_display()} - {self.colmeia.identificador} - {self.data_inicio.strftime('%d/%m/%Y')}"
    
    @property
    def duracao_dias(self):
        if self.data_fim:
            return (self.data_fim - self.data_inicio).days
        return None


class Custo(models.Model):
    """Modelo para registro de custos"""
    
    TIPO_CUSTO_CHOICES = [
        ('equipamento', 'Equipamento'),
        ('medicamento', 'Medicamento'),
        ('alimentacao', 'Alimentação'),
        ('manutencao', 'Manutenção'),
        ('transporte', 'Transporte'),
        ('energia', 'Energia'),
        ('agua', 'Água'),
        ('outro', 'Outro'),
    ]
    
    descricao = models.CharField(max_length=200, verbose_name='Descrição')
    tipo_custo = models.CharField(
        max_length=30,
        choices=TIPO_CUSTO_CHOICES,
        verbose_name='Tipo de Custo'
    )
    valor = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Valor (R$)'
    )
    data = models.DateField(verbose_name='Data')
    apiario = models.ForeignKey(
        Apiario,
        on_delete=models.CASCADE,
        related_name='custos',
        null=True,
        blank=True,
        verbose_name='Apiário'
    )
    colmeia = models.ForeignKey(
        Colmeia,
        on_delete=models.CASCADE,
        related_name='custos',
        null=True,
        blank=True,
        verbose_name='Colmeia'
    )
    fornecedor = models.CharField(max_length=200, blank=True, verbose_name='Fornecedor')
    nota_fiscal = models.CharField(max_length=100, blank=True, verbose_name='Nota Fiscal')
    observacoes = models.TextField(blank=True, verbose_name='Observações')
    created_by = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='custos_criados',
        verbose_name='Criado por'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Custo'
        verbose_name_plural = 'Custos'
        ordering = ['-data']
    
    def __str__(self):
        return f"{self.descricao} - R$ {self.valor} - {self.data.strftime('%d/%m/%Y')}"


class Receita(models.Model):
    """Modelo para registro de receitas"""
    
    TIPO_RECEITA_CHOICES = [
        ('venda_mel', 'Venda de Mel'),
        ('venda_propolis', 'Venda de Própolis'),
        ('venda_cera', 'Venda de Cera'),
        ('venda_abelhas', 'Venda de Abelhas'),
        ('servico_polinizacao', 'Serviço de Polinização'),
        ('outro', 'Outro'),
    ]
    
    descricao = models.CharField(max_length=200, verbose_name='Descrição')
    tipo_receita = models.CharField(
        max_length=30,
        choices=TIPO_RECEITA_CHOICES,
        verbose_name='Tipo de Receita'
    )
    valor = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Valor (R$)'
    )
    data = models.DateField(verbose_name='Data')
    cliente = models.CharField(max_length=200, blank=True, verbose_name='Cliente')
    quantidade_kg = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='Quantidade (kg)'
    )
    preco_unitario = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='Preço Unitário (R$/kg)'
    )
    producao = models.ForeignKey(
        ProducaoMel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='receitas',
        verbose_name='Produção Relacionada'
    )
    observacoes = models.TextField(blank=True, verbose_name='Observações')
    created_by = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='receitas_criadas',
        verbose_name='Criado por'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Receita'
        verbose_name_plural = 'Receitas'
        ordering = ['-data']
    
    def __str__(self):
        return f"{self.descricao} - R$ {self.valor} - {self.data.strftime('%d/%m/%Y')}"


class Fornecedor(models.Model):
    """Modelo para fornecedores"""
    
    nome = models.CharField(max_length=200, verbose_name='Nome')
    tipo_fornecedor = models.CharField(
        max_length=50,
        choices=[
            ('equipamento', 'Equipamentos'),
            ('medicamento', 'Medicamentos'),
            ('alimentacao', 'Alimentação'),
            ('outro', 'Outro'),
        ],
        verbose_name='Tipo'
    )
    cnpj = models.CharField(max_length=18, blank=True, verbose_name='CNPJ')
    telefone = models.CharField(max_length=20, blank=True, verbose_name='Telefone')
    email = models.EmailField(blank=True, verbose_name='E-mail')
    endereco = models.TextField(blank=True, verbose_name='Endereço')
    contato = models.CharField(max_length=100, blank=True, verbose_name='Pessoa de Contato')
    observacoes = models.TextField(blank=True, verbose_name='Observações')
    ativo = models.BooleanField(default=True, verbose_name='Ativo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Fornecedor'
        verbose_name_plural = 'Fornecedores'
        ordering = ['nome']
    
    def __str__(self):
        return self.nome


class Equipamento(models.Model):
    """Modelo para equipamentos"""
    
    STATUS_CHOICES = [
        ('disponivel', 'Disponível'),
        ('em_uso', 'Em Uso'),
        ('manutencao', 'Em Manutenção'),
        ('danificado', 'Danificado'),
        ('descartado', 'Descartado'),
    ]
    
    nome = models.CharField(max_length=200, verbose_name='Nome/Descrição')
    tipo_equipamento = models.CharField(
        max_length=50,
        choices=[
            ('fumegador', 'Fumegador'),
            ('extrator', 'Extrator de Mel'),
            ('vestimenta', 'Vestimenta'),
            ('ferramenta', 'Ferramenta'),
            ('caixa', 'Caixa/Colmeia'),
            ('outro', 'Outro'),
        ],
        verbose_name='Tipo'
    )
    marca = models.CharField(max_length=100, blank=True, verbose_name='Marca')
    modelo = models.CharField(max_length=100, blank=True, verbose_name='Modelo')
    numero_serie = models.CharField(max_length=100, blank=True, verbose_name='Número de Série')
    data_compra = models.DateField(null=True, blank=True, verbose_name='Data de Compra')
    valor_compra = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='Valor de Compra (R$)'
    )
    fornecedor = models.ForeignKey(
        Fornecedor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='equipamentos',
        verbose_name='Fornecedor'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='disponivel',
        verbose_name='Status'
    )
    apiario = models.ForeignKey(
        Apiario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='equipamentos',
        verbose_name='Apiário'
    )
    observacoes = models.TextField(blank=True, verbose_name='Observações')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Equipamento'
        verbose_name_plural = 'Equipamentos'
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} - {self.get_status_display()}"


class Notificacao(models.Model):
    """Modelo para notificações e alertas"""
    
    TIPO_CHOICES = [
        ('inspecao', 'Inspeção Agendada'),
        ('tratamento', 'Tratamento Necessário'),
        ('producao', 'Colheita Disponível'),
        ('alerta_saude', 'Alerta de Saúde'),
        ('manutencao', 'Manutenção Necessária'),
        ('outro', 'Outro'),
    ]
    
    PRIORIDADE_CHOICES = [
        ('baixa', 'Baixa'),
        ('media', 'Média'),
        ('alta', 'Alta'),
        ('critica', 'Crítica'),
    ]
    
    titulo = models.CharField(max_length=200, verbose_name='Título')
    mensagem = models.TextField(verbose_name='Mensagem')
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        verbose_name='Tipo'
    )
    prioridade = models.CharField(
        max_length=20,
        choices=PRIORIDADE_CHOICES,
        default='media',
        verbose_name='Prioridade'
    )
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='notificacoes',
        verbose_name='Usuário'
    )
    lida = models.BooleanField(default=False, verbose_name='Lida')
    data_leitura = models.DateTimeField(null=True, blank=True, verbose_name='Data de Leitura')
    colmeia = models.ForeignKey(
        Colmeia,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notificacoes',
        verbose_name='Colmeia'
    )
    apiario = models.ForeignKey(
        Apiario,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notificacoes',
        verbose_name='Apiário'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Notificação'
        verbose_name_plural = 'Notificações'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.titulo} - {self.usuario.username}"
