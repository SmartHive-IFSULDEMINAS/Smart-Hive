from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


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
    responsavel = models.CharField(max_length=100, blank=True, verbose_name='Responsável')
    telefone_contato = models.CharField(max_length=20, blank=True, verbose_name='Telefone de Contato')
    data_criacao = models.DateField(verbose_name='Data de Criação')
    ativo = models.BooleanField(default=True, verbose_name='Ativo')
    foto = models.ImageField(upload_to='apiarios/', blank=True, null=True, verbose_name='Foto')
    observacoes = models.TextField(blank=True, verbose_name='Observações')
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
