from django.contrib import admin
from .models import EspecieAbelha, Apiario, Colmeia, Inspecao, ProducaoMel, Tratamento


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
