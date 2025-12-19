from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Usuario, EspecieAbelha, Apiario, Colmeia, Inspecao, 
    ProducaoMel, Tratamento, Custo, Receita, Fornecedor, 
    Equipamento, Notificacao
)


@admin.register(EspecieAbelha)
class EspecieAbelhaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'nome_cientifico', 'nivel_agressividade', 'producao_media_anual_kg']
    list_filter = ['nivel_agressividade']
    search_fields = ['nome', 'nome_cientifico']
    ordering = ['nome']


@admin.register(Apiario)
class ApiarioAdmin(admin.ModelAdmin):
    list_display = ['nome', 'localizacao', 'responsavel', 'ativo', 'data_criacao', 'total_colmeias', 'colmeias_ativas']
    list_filter = ['ativo', 'data_criacao']
    search_fields = ['nome', 'localizacao', 'responsavel']
    ordering = ['nome']
    date_hierarchy = 'data_criacao'
    
    def total_colmeias(self, obj):
        return obj.total_colmeias
    total_colmeias.short_description = 'Total Colmeias'
    
    def colmeias_ativas(self, obj):
        return obj.colmeias_ativas
    colmeias_ativas.short_description = 'Colmeias Ativas'


@admin.register(Colmeia)
class ColmeiaAdmin(admin.ModelAdmin):
    list_display = ['identificador', 'nome', 'apiario', 'especie', 'status', 'tipo_caixa', 'quantidade_abelhas_estimada', 'data_instalacao']
    list_filter = ['status', 'tipo_caixa', 'apiario', 'especie']
    search_fields = ['identificador', 'nome', 'apiario__nome']
    ordering = ['apiario', 'identificador']
    date_hierarchy = 'data_instalacao'
    raw_id_fields = ['apiario', 'especie']


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
