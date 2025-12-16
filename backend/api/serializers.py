from rest_framework import serializers
from .models import EspecieAbelha, Apiario, Colmeia, Inspecao, ProducaoMel, Tratamento


class EspecieAbelhaSerializer(serializers.ModelSerializer):
    nivel_agressividade_display = serializers.CharField(
        source='get_nivel_agressividade_display', 
        read_only=True
    )
    
    class Meta:
        model = EspecieAbelha
        fields = [
            'id', 'nome', 'nome_cientifico', 'descricao', 'caracteristicas',
            'nivel_agressividade', 'nivel_agressividade_display',
            'producao_media_anual_kg', 'cor_identificacao',
            'created_at', 'updated_at'
        ]


class ApiarioSerializer(serializers.ModelSerializer):
    total_colmeias = serializers.IntegerField(read_only=True)
    colmeias_ativas = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Apiario
        fields = [
            'id', 'nome', 'localizacao', 'latitude', 'longitude',
            'descricao', 'responsavel', 'telefone_contato',
            'data_criacao', 'ativo', 'foto', 'observacoes',
            'total_colmeias', 'colmeias_ativas',
            'created_at', 'updated_at'
        ]


class ApiarioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagens"""
    total_colmeias = serializers.IntegerField(read_only=True)
    colmeias_ativas = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Apiario
        fields = [
            'id', 'nome', 'localizacao', 'ativo',
            'total_colmeias', 'colmeias_ativas'
        ]


class ColmeiaSerializer(serializers.ModelSerializer):
    apiario_nome = serializers.CharField(source='apiario.nome', read_only=True)
    especie_nome = serializers.CharField(source='especie.nome', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tipo_caixa_display = serializers.CharField(source='get_tipo_caixa_display', read_only=True)
    producao_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Colmeia
        fields = [
            'id', 'apiario', 'apiario_nome', 'especie', 'especie_nome',
            'identificador', 'nome', 'tipo_caixa', 'tipo_caixa_display',
            'quantidade_abelhas_estimada', 'status', 'status_display',
            'data_instalacao', 'idade_rainha_meses', 'data_ultima_troca_rainha',
            'numero_quadros', 'peso_estimado_kg', 'observacoes', 'foto',
            'data_ultima_inspecao', 'producao_total',
            'created_at', 'updated_at'
        ]


class ColmeiaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagens"""
    apiario_nome = serializers.CharField(source='apiario.nome', read_only=True)
    especie_nome = serializers.CharField(source='especie.nome', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Colmeia
        fields = [
            'id', 'identificador', 'nome', 'apiario', 'apiario_nome',
            'especie_nome', 'status', 'status_display',
            'quantidade_abelhas_estimada', 'data_ultima_inspecao'
        ]


class InspecaoSerializer(serializers.ModelSerializer):
    colmeia_identificador = serializers.CharField(source='colmeia.identificador', read_only=True)
    apiario_nome = serializers.CharField(source='colmeia.apiario.nome', read_only=True)
    condicao_geral_display = serializers.CharField(source='get_condicao_geral_display', read_only=True)
    quantidade_crias_display = serializers.CharField(source='get_quantidade_crias_display', read_only=True)
    quantidade_mel_display = serializers.CharField(source='get_quantidade_mel_display', read_only=True)
    quantidade_polen_display = serializers.CharField(source='get_quantidade_polen_display', read_only=True)
    
    class Meta:
        model = Inspecao
        fields = [
            'id', 'colmeia', 'colmeia_identificador', 'apiario_nome',
            'data', 'inspetor', 'condicao_geral', 'condicao_geral_display',
            'presenca_rainha', 'rainha_marcada',
            'quantidade_crias', 'quantidade_crias_display',
            'quantidade_mel', 'quantidade_mel_display',
            'quantidade_polen', 'quantidade_polen_display',
            'presenca_pragas', 'tipo_pragas',
            'presenca_doencas', 'tipo_doencas',
            'alimentacao_artificial', 'tipo_alimentacao',
            'temperatura_ambiente', 'umidade_ambiente',
            'observacoes', 'acoes_realizadas', 'proxima_inspecao', 'foto',
            'created_at', 'updated_at'
        ]


class InspecaoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagens"""
    colmeia_identificador = serializers.CharField(source='colmeia.identificador', read_only=True)
    apiario_nome = serializers.CharField(source='colmeia.apiario.nome', read_only=True)
    condicao_geral_display = serializers.CharField(source='get_condicao_geral_display', read_only=True)
    
    class Meta:
        model = Inspecao
        fields = [
            'id', 'colmeia', 'colmeia_identificador', 'apiario_nome',
            'data', 'inspetor', 'condicao_geral', 'condicao_geral_display',
            'presenca_rainha', 'presenca_pragas', 'presenca_doencas'
        ]


class ProducaoMelSerializer(serializers.ModelSerializer):
    colmeia_identificador = serializers.CharField(source='colmeia.identificador', read_only=True)
    apiario_nome = serializers.CharField(source='colmeia.apiario.nome', read_only=True)
    tipo_mel_display = serializers.CharField(source='get_tipo_mel_display', read_only=True)
    qualidade_display = serializers.CharField(source='get_qualidade_display', read_only=True)
    
    class Meta:
        model = ProducaoMel
        fields = [
            'id', 'colmeia', 'colmeia_identificador', 'apiario_nome',
            'data_colheita', 'quantidade_kg', 'tipo_mel', 'tipo_mel_display',
            'qualidade', 'qualidade_display', 'numero_quadros_colhidos',
            'umidade_mel', 'observacoes',
            'created_at', 'updated_at'
        ]


class ProducaoMelListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagens"""
    colmeia_identificador = serializers.CharField(source='colmeia.identificador', read_only=True)
    apiario_nome = serializers.CharField(source='colmeia.apiario.nome', read_only=True)
    
    class Meta:
        model = ProducaoMel
        fields = [
            'id', 'colmeia', 'colmeia_identificador', 'apiario_nome',
            'data_colheita', 'quantidade_kg', 'tipo_mel', 'qualidade'
        ]


class TratamentoSerializer(serializers.ModelSerializer):
    colmeia_identificador = serializers.CharField(source='colmeia.identificador', read_only=True)
    apiario_nome = serializers.CharField(source='colmeia.apiario.nome', read_only=True)
    tipo_tratamento_display = serializers.CharField(source='get_tipo_tratamento_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duracao_dias = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Tratamento
        fields = [
            'id', 'colmeia', 'colmeia_identificador', 'apiario_nome',
            'tipo_tratamento', 'tipo_tratamento_display',
            'data_inicio', 'data_fim', 'medicamento', 'dosagem',
            'frequencia_aplicacao', 'motivo', 'status', 'status_display',
            'resultado', 'custo', 'observacoes', 'duracao_dias',
            'created_at', 'updated_at'
        ]


class TratamentoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagens"""
    colmeia_identificador = serializers.CharField(source='colmeia.identificador', read_only=True)
    apiario_nome = serializers.CharField(source='colmeia.apiario.nome', read_only=True)
    tipo_tratamento_display = serializers.CharField(source='get_tipo_tratamento_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Tratamento
        fields = [
            'id', 'colmeia', 'colmeia_identificador', 'apiario_nome',
            'tipo_tratamento', 'tipo_tratamento_display',
            'data_inicio', 'status', 'status_display', 'medicamento'
        ]


# Dashboard Serializer
class DashboardStatsSerializer(serializers.Serializer):
    total_apiarios = serializers.IntegerField()
    apiarios_ativos = serializers.IntegerField()
    total_colmeias = serializers.IntegerField()
    colmeias_ativas = serializers.IntegerField()
    colmeias_em_quarentena = serializers.IntegerField()
    total_inspecoes = serializers.IntegerField()
    inspecoes_mes = serializers.IntegerField()
    producao_total_kg = serializers.DecimalField(max_digits=12, decimal_places=2)
    producao_mes_kg = serializers.DecimalField(max_digits=12, decimal_places=2)
    producao_ano_kg = serializers.DecimalField(max_digits=12, decimal_places=2)
    tratamentos_em_andamento = serializers.IntegerField()
    colmeias_com_problemas = serializers.IntegerField()
    proximas_inspecoes = InspecaoListSerializer(many=True)
    ultimas_producoes = ProducaoMelListSerializer(many=True)
