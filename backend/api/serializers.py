from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    EspecieAbelha, Apiario, Colmeia, Inspecao, ProducaoMel, Tratamento,
    Custo, Receita, Fornecedor, Equipamento, Notificacao, LeituraSensor,
    ClassificacaoPolen,
)

User = get_user_model()


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
            # Campos IoT
            'sensor_iot_ativo', 'temperatura_atual', 'data_ultima_leitura_sensor',
            'created_at', 'updated_at'
        ]


class ApiarioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagens"""
    total_colmeias = serializers.IntegerField(read_only=True)
    colmeias_ativas = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Apiario
        fields = [
            'id', 'nome', 'localizacao', 'latitude', 'longitude',
            'ativo', 'total_colmeias', 'colmeias_ativas',
            # Campos IoT
            'sensor_iot_ativo', 'temperatura_atual', 'data_ultima_leitura_sensor'
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
            # Campos IoT
            'sensor_iot_ativo', 'temperatura_atual', 'nivel_ruido', 'luminosidade',
            'umidade', 'pressao', 'peso',
            'data_ultima_leitura_sensor', 'token_iot',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['token_iot', 'data_ultima_leitura_sensor']


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
            'quantidade_abelhas_estimada', 'data_ultima_inspecao',
            # Campos IoT
            'sensor_iot_ativo', 'temperatura_atual', 'nivel_ruido', 
            'luminosidade', 'umidade', 'pressao', 'peso',
            'data_ultima_leitura_sensor'
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


# User Serializers
class UsuarioSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'telefone', 'cpf', 'data_nascimento',
            'endereco', 'foto', 'ativo', 'is_staff', 'is_superuser',
            'data_cadastro', 'ultimo_acesso'
        ]
        read_only_fields = ['id', 'data_cadastro', 'ultimo_acesso']


class UsuarioListSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'role_display', 'ativo']


# New Model Serializers
class CustoSerializer(serializers.ModelSerializer):
    tipo_custo_display = serializers.CharField(source='get_tipo_custo_display', read_only=True)
    apiario_nome = serializers.CharField(source='apiario.nome', read_only=True, allow_null=True)
    colmeia_identificador = serializers.CharField(source='colmeia.identificador', read_only=True, allow_null=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = Custo
        fields = [
            'id', 'descricao', 'tipo_custo', 'tipo_custo_display', 'valor', 'data',
            'apiario', 'apiario_nome', 'colmeia', 'colmeia_identificador',
            'fornecedor', 'nota_fiscal', 'observacoes', 'created_by', 'created_by_username',
            'created_at', 'updated_at'
        ]


class CustoListSerializer(serializers.ModelSerializer):
    tipo_custo_display = serializers.CharField(source='get_tipo_custo_display', read_only=True)
    
    class Meta:
        model = Custo
        fields = ['id', 'descricao', 'tipo_custo', 'tipo_custo_display', 'valor', 'data', 'apiario', 'colmeia']


class ReceitaSerializer(serializers.ModelSerializer):
    tipo_receita_display = serializers.CharField(source='get_tipo_receita_display', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = Receita
        fields = [
            'id', 'descricao', 'tipo_receita', 'tipo_receita_display', 'valor', 'data',
            'cliente', 'quantidade_kg', 'preco_unitario', 'producao', 'observacoes',
            'created_by', 'created_by_username', 'created_at', 'updated_at'
        ]


class ReceitaListSerializer(serializers.ModelSerializer):
    tipo_receita_display = serializers.CharField(source='get_tipo_receita_display', read_only=True)
    
    class Meta:
        model = Receita
        fields = ['id', 'descricao', 'tipo_receita', 'tipo_receita_display', 'valor', 'data', 'cliente']


class FornecedorSerializer(serializers.ModelSerializer):
    tipo_fornecedor_display = serializers.CharField(source='get_tipo_fornecedor_display', read_only=True)
    
    class Meta:
        model = Fornecedor
        fields = [
            'id', 'nome', 'tipo_fornecedor', 'tipo_fornecedor_display',
            'cnpj', 'telefone', 'email', 'endereco', 'contato', 'observacoes',
            'ativo', 'created_at', 'updated_at'
        ]


class EquipamentoSerializer(serializers.ModelSerializer):
    tipo_equipamento_display = serializers.CharField(source='get_tipo_equipamento_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    apiario_nome = serializers.CharField(source='apiario.nome', read_only=True, allow_null=True)
    
    class Meta:
        model = Equipamento
        fields = [
            'id', 'nome', 'tipo_equipamento', 'tipo_equipamento_display',
            'marca', 'modelo', 'numero_serie', 'data_compra', 'valor_compra',
            'fornecedor', 'status', 'status_display', 'apiario', 'apiario_nome',
            'observacoes', 'created_at', 'updated_at'
        ]


class NotificacaoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    prioridade_display = serializers.CharField(source='get_prioridade_display', read_only=True)
    colmeia_identificador = serializers.CharField(source='colmeia.identificador', read_only=True, allow_null=True)
    apiario_nome = serializers.CharField(source='apiario.nome', read_only=True, allow_null=True)
    
    class Meta:
        model = Notificacao
        fields = [
            'id', 'titulo', 'mensagem', 'tipo', 'tipo_display',
            'prioridade', 'prioridade_display', 'usuario', 'lida', 'data_leitura',
            'colmeia', 'colmeia_identificador', 'apiario', 'apiario_nome', 'created_at'
        ]


class LeituraSensorSerializer(serializers.ModelSerializer):
    colmeia_identificador = serializers.CharField(source='colmeia.identificador', read_only=True)
    apiario_nome = serializers.CharField(source='colmeia.apiario.nome', read_only=True)
    
    class Meta:
        model = LeituraSensor
        fields = [
            'id', 'colmeia', 'colmeia_identificador', 'apiario_nome',
            'temperatura', 'nivel_ruido', 'luminosidade',
            'umidade', 'pressao', 'peso',
            'timestamp', 'dispositivo_id', 'bateria_nivel', 'sinal_rssi'
        ]
        read_only_fields = ['timestamp']


class LeituraSensorListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagens"""
    colmeia_identificador = serializers.CharField(source='colmeia.identificador', read_only=True)
    
    class Meta:
        model = LeituraSensor
        fields = [
            'id', 'colmeia_identificador', 'temperatura', 'nivel_ruido',
            'luminosidade', 'umidade', 'pressao', 'peso',
            'timestamp', 'dispositivo_id'
        ]


class ClassificacaoPolenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassificacaoPolen
        fields = [
            'id',
            'canal_f1', 'canal_f2', 'canal_f3', 'canal_f4', 'canal_f5',
            'canal_f6', 'canal_f7', 'canal_f8', 'canal_nir', 'canal_clear',
            'knn_classe', 'kmeans_cluster',
            'dispositivo_id', 'notas', 'timestamp',
        ]
        read_only_fields = ['timestamp']

