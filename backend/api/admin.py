from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Usuario, EspecieAbelha, Apiario, Colmeia, Inspecao,
    ProducaoMel, Tratamento, Custo, Receita, Fornecedor,
    Equipamento, Notificacao, LeituraSensor, ClassificacaoPolen,
    AlertaRuidoConfig, ContagemAbelha, Camera, EspectadorCamera,
    AgendamentoMonitoramento,
)


@admin.register(EspecieAbelha)
class EspecieAbelhaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'nome_cientifico', 'nivel_agressividade', 'producao_media_anual_kg']
    list_filter = ['nivel_agressividade']
    search_fields = ['nome', 'nome_cientifico']
    ordering = ['nome']


@admin.register(Apiario)
class ApiarioAdmin(admin.ModelAdmin):
    list_display = [
        'nome', 'localizacao', 'responsavel', 'ativo', 'sensor_iot_ativo', 
        'temperatura_atual', 'data_criacao', 'total_colmeias', 'colmeias_ativas'
    ]
    list_filter = ['ativo', 'data_criacao', 'sensor_iot_ativo']
    search_fields = ['nome', 'localizacao', 'responsavel']
    ordering = ['nome']
    date_hierarchy = 'data_criacao'
    readonly_fields = ['data_ultima_leitura_sensor']
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('nome', 'localizacao', 'latitude', 'longitude', 'descricao', 'ativo')
        }),
        ('Responsáveis', {
            'fields': ('proprietario', 'responsavel', 'responsavel_nome', 'telefone_contato')
        }),
        ('Sensores IoT', {
            'fields': ('sensor_iot_ativo', 'temperatura_atual', 'data_ultima_leitura_sensor'),
            'classes': ('collapse',)
        }),
        ('Outros', {
            'fields': ('foto', 'observacoes', 'data_criacao')
        }),
    )
    
    def total_colmeias(self, obj):
        return obj.total_colmeias
    total_colmeias.short_description = 'Total Colmeias'
    
    def colmeias_ativas(self, obj):
        return obj.colmeias_ativas
    colmeias_ativas.short_description = 'Colmeias Ativas'


@admin.register(Colmeia)
class ColmeiaAdmin(admin.ModelAdmin):
    list_display = [
        'identificador', 'nome', 'apiario', 'especie', 'status', 'tipo_caixa', 
        'quantidade_abelhas_estimada', 'sensor_iot_ativo', 'temperatura_atual',
        'data_instalacao'
    ]
    list_filter = ['status', 'tipo_caixa', 'apiario', 'especie', 'sensor_iot_ativo']
    search_fields = ['identificador', 'nome', 'apiario__nome', 'token_iot']
    ordering = ['apiario', 'identificador']
    date_hierarchy = 'data_instalacao'
    raw_id_fields = ['apiario', 'especie']
    readonly_fields = ['token_iot', 'data_ultima_leitura_sensor']
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('apiario', 'especie', 'identificador', 'nome', 'tipo_caixa', 'status')
        }),
        ('Características', {
            'fields': ('quantidade_abelhas_estimada', 'numero_quadros', 'peso_estimado_kg', 
                      'idade_rainha_meses', 'data_ultima_troca_rainha', 'data_instalacao')
        }),
        ('Sensores IoT', {
            'fields': ('sensor_iot_ativo', 'token_iot', 'temperatura_atual', 'nivel_ruido', 
                      'luminosidade', 'umidade', 'pressao', 'peso', 'data_ultima_leitura_sensor'),
            'classes': ('collapse',)
        }),
        ('Outros', {
            'fields': ('observacoes', 'foto', 'data_ultima_inspecao')
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not obj.token_iot and obj.sensor_iot_ativo:
            obj.gerar_token_iot()
        super().save_model(request, obj, form, change)


@admin.register(LeituraSensor)
class LeituraSensorAdmin(admin.ModelAdmin):
    list_display = ['colmeia', 'temperatura', 'nivel_ruido', 'luminosidade', 'timestamp', 'dispositivo_id']
    list_filter = ['timestamp', 'colmeia', 'colmeia__apiario']
    search_fields = ['colmeia__identificador', 'dispositivo_id']
    ordering = ['-timestamp']
    date_hierarchy = 'timestamp'
    raw_id_fields = ['colmeia']
    readonly_fields = ['timestamp']


@admin.register(ContagemAbelha)
class ContagemAbelhaAdmin(admin.ModelAdmin):
    list_display = ['colmeia', 'bee_count', 'pollen_count', 'captured_at', 'timestamp']
    list_filter = ['captured_at', 'colmeia', 'colmeia__apiario']
    search_fields = ['colmeia__identificador']
    ordering = ['-captured_at']
    date_hierarchy = 'captured_at'
    raw_id_fields = ['colmeia']
    readonly_fields = ['timestamp']


@admin.register(Inspecao)
class InspecaoAdmin(admin.ModelAdmin):
    list_display = ['colmeia', 'data', 'inspetor', 'condicao_geral', 'presenca_rainha', 'presenca_pragas', 'presenca_doencas']
    list_filter = ['condicao_geral', 'presenca_rainha', 'presenca_pragas', 'presenca_doencas', 'data']
    search_fields = ['colmeia__identificador', 'inspetor', 'observacoes']
    ordering = ['-data']
    date_hierarchy = 'data'
    raw_id_fields = ['colmeia']


@admin.register(ProducaoMel)
class ProducaoMelAdmin(admin.ModelAdmin):
    list_display = ['colmeia', 'data_colheita', 'quantidade_kg', 'tipo_mel', 'qualidade']
    list_filter = ['tipo_mel', 'qualidade', 'data_colheita']
    search_fields = ['colmeia__identificador']
    ordering = ['-data_colheita']
    date_hierarchy = 'data_colheita'
    raw_id_fields = ['colmeia']


@admin.register(Tratamento)
class TratamentoAdmin(admin.ModelAdmin):
    list_display = ['colmeia', 'tipo_tratamento', 'data_inicio', 'data_fim', 'status', 'medicamento']
    list_filter = ['tipo_tratamento', 'status', 'data_inicio']
    search_fields = ['colmeia__identificador', 'medicamento', 'motivo']
    ordering = ['-data_inicio']
    date_hierarchy = 'data_inicio'
    raw_id_fields = ['colmeia']


@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'ativo', 'is_staff', 'data_cadastro']
    list_filter = ['role', 'ativo', 'is_staff', 'is_superuser']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informações Adicionais', {
            'fields': ('role', 'telefone', 'cpf', 'data_nascimento', 'endereco', 'foto', 'ativo', 'ultimo_acesso')
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informações Adicionais', {
            'fields': ('role', 'telefone', 'email', 'first_name', 'last_name')
        }),
    )


@admin.register(Custo)
class CustoAdmin(admin.ModelAdmin):
    list_display = ['descricao', 'tipo_custo', 'valor', 'data', 'apiario', 'colmeia', 'created_by']
    list_filter = ['tipo_custo', 'data']
    search_fields = ['descricao', 'fornecedor']
    ordering = ['-data']
    date_hierarchy = 'data'
    raw_id_fields = ['apiario', 'colmeia', 'created_by']


@admin.register(Receita)
class ReceitaAdmin(admin.ModelAdmin):
    list_display = ['descricao', 'tipo_receita', 'valor', 'data', 'cliente', 'created_by']
    list_filter = ['tipo_receita', 'data']
    search_fields = ['descricao', 'cliente']
    ordering = ['-data']
    date_hierarchy = 'data'
    raw_id_fields = ['producao', 'created_by']


@admin.register(Fornecedor)
class FornecedorAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo_fornecedor', 'telefone', 'email', 'ativo']
    list_filter = ['tipo_fornecedor', 'ativo']
    search_fields = ['nome', 'cnpj', 'email']


@admin.register(Equipamento)
class EquipamentoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo_equipamento', 'marca', 'status', 'apiario', 'data_compra']
    list_filter = ['tipo_equipamento', 'status', 'data_compra']
    search_fields = ['nome', 'marca', 'modelo', 'numero_serie']
    raw_id_fields = ['fornecedor', 'apiario']


@admin.register(Notificacao)
class NotificacaoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'tipo', 'prioridade', 'usuario', 'lida', 'created_at']
    list_filter = ['tipo', 'prioridade', 'lida', 'created_at']
    search_fields = ['titulo', 'mensagem', 'usuario__username']
    ordering = ['-created_at']
    raw_id_fields = ['usuario', 'colmeia', 'apiario']


@admin.register(AlertaRuidoConfig)
class AlertaRuidoConfigAdmin(admin.ModelAdmin):
    list_display = [
        'usuario', 'ativo', 'destino_alerta', 'usuario_destino', 'janela_media', 'percentual_desvio',
        'alertar_temperatura', 'alertar_luminosidade', 'alertar_umidade',
        'alertar_pressao', 'alertar_peso', 'alertar_producao',
        'cooldown_minutos', 'updated_at'
    ]
    list_filter = [
        'ativo', 'destino_alerta', 'janela_media', 'alertar_temperatura', 'alertar_luminosidade',
        'alertar_umidade', 'alertar_pressao', 'alertar_peso', 'alertar_producao'
    ]
    search_fields = ['usuario__username', 'usuario__email']
    ordering = ['-updated_at']
    raw_id_fields = ['usuario']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Vínculo', {
            'fields': ('usuario', 'ativo', 'destino_alerta', 'usuario_destino')
        }),
        ('Parâmetros Gerais', {
            'fields': ('janela_media', 'cooldown_minutos')
        }),
        ('Ruído', {
            'fields': ('percentual_desvio',)
        }),
        ('Sensores IoT', {
            'fields': (
                'alertar_temperatura', 'desvio_temperatura',
                'alertar_luminosidade', 'desvio_luminosidade',
                'alertar_umidade', 'desvio_umidade',
                'alertar_pressao', 'desvio_pressao',
                'alertar_peso', 'desvio_peso',
            )
        }),
        ('Produção', {
            'fields': ('alertar_producao', 'desvio_producao')
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(ClassificacaoPolen)
class ClassificacaoPolenAdmin(admin.ModelAdmin):
    list_display = ['id', 'knn_classe', 'kmeans_cluster', 'dispositivo_id', 'timestamp']
    list_filter = ['knn_classe', 'kmeans_cluster', 'timestamp']
    search_fields = ['dispositivo_id', 'notas']
    ordering = ['-timestamp']
    date_hierarchy = 'timestamp'
    readonly_fields = ['timestamp']


@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    list_display = ['nome', 'caminho_stream', 'transmitindo', 'ultimo_contato_pi']
    readonly_fields = ['token', 'ultimo_contato_pi']

    @admin.display(boolean=True, description='Transmitindo')
    def transmitindo(self, obj):
        return obj.ativa


@admin.register(EspectadorCamera)
class EspectadorCameraAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'camera', 'iniciada_em', 'expira_em']
    list_filter = ['camera']
    readonly_fields = ['camera', 'usuario', 'sessao', 'iniciada_em', 'expira_em']


@admin.register(AgendamentoMonitoramento)
class AgendamentoMonitoramentoAdmin(admin.ModelAdmin):
    list_display = ['camera', 'habilitado', 'hora_inicio', 'hora_fim', 'estado_processo', 'ultimo_relato']
    readonly_fields = [
        'versao', 'configurado_em', 'configurado_por', 'estado_processo', 'deve_executar_pi',
        'mensagem_pi', 'versao_aplicada', 'ultimo_inicio', 'ultimo_encerramento', 'ultimo_relato',
    ]
