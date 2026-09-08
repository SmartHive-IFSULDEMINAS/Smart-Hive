"""
Views para exportação de dados
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from datetime import datetime

from .models import (
    Apiario, Colmeia, Inspecao, ProducaoMel, ColetaProduto,
    Tratamento, Custo, Receita
)
from .export_utils import export_to_excel, export_to_pdf


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_apiarios(request):
    """Exporta apiários para Excel ou PDF"""
    format_type = request.GET.get('format', 'excel')
    
    queryset = Apiario.objects.all()
    
    # Filtros opcionais
    if request.GET.get('ativo'):
        queryset = queryset.filter(ativo=request.GET.get('ativo') == 'true')
    
    columns = [
        ('nome', 'Nome'),
        ('localizacao', 'Localização'),
        ('responsavel.username', 'Responsável'),
        ('data_criacao', 'Data de Criação'),
        ('ativo', 'Ativo'),
    ]
    
    if format_type == 'pdf':
        data = [
            {
                'nome': a.nome,
                'localizacao': a.localizacao,
                'responsavel.username': a.responsavel.username if a.responsavel else '',
                'data_criacao': a.data_criacao.strftime('%d/%m/%Y'),
                'ativo': 'Sim' if a.ativo else 'Não',
            }
            for a in queryset
        ]
        return export_to_pdf(
            data=data,
            filename=f'apiarios_{datetime.now().strftime("%Y%m%d")}.pdf',
            title='Relatório de Apiários',
            columns=columns
        )
    
    return export_to_excel(
        queryset=queryset,
        filename=f'apiarios_{datetime.now().strftime("%Y%m%d")}.xlsx',
        columns=columns,
        sheet_name='Apiários'
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_colmeias(request):
    """Exporta colmeias para Excel ou PDF"""
    format_type = request.GET.get('format', 'excel')
    
    queryset = Colmeia.objects.select_related('apiario', 'especie').all()
    
    # Filtros opcionais
    if request.GET.get('apiario_id'):
        queryset = queryset.filter(apiario_id=request.GET.get('apiario_id'))
    if request.GET.get('status'):
        queryset = queryset.filter(status=request.GET.get('status'))
    
    columns = [
        ('codigo', 'Código'),
        ('apiario.nome', 'Apiário'),
        ('especie.nome', 'Espécie'),
        ('status', 'Status'),
        ('quantidade_abelhas', 'Qtd. Abelhas'),
        ('data_instalacao', 'Data Instalação'),
    ]
    
    if format_type == 'pdf':
        data = [
            {
                'codigo': c.codigo,
                'apiario.nome': c.apiario.nome,
                'especie.nome': c.especie.nome if c.especie else '',
                'status': c.get_status_display(),
                'quantidade_abelhas': c.quantidade_abelhas or 0,
                'data_instalacao': c.data_instalacao.strftime('%d/%m/%Y') if c.data_instalacao else '',
            }
            for c in queryset
        ]
        return export_to_pdf(
            data=data,
            filename=f'colmeias_{datetime.now().strftime("%Y%m%d")}.pdf',
            title='Relatório de Colmeias',
            columns=columns,
            orientation='landscape'
        )
    
    return export_to_excel(
        queryset=queryset,
        filename=f'colmeias_{datetime.now().strftime("%Y%m%d")}.xlsx',
        columns=columns,
        sheet_name='Colmeias'
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_producao(request):
    """Exporta produção de mel para Excel ou PDF"""
    format_type = request.GET.get('format', 'excel')
    
    queryset = ProducaoMel.objects.select_related('colmeia', 'colmeia__apiario').all()
    
    # Filtros opcionais
    if request.GET.get('data_inicio'):
        queryset = queryset.filter(data_colheita__gte=request.GET.get('data_inicio'))
    if request.GET.get('data_fim'):
        queryset = queryset.filter(data_colheita__lte=request.GET.get('data_fim'))
    
    columns = [
        ('colmeia.codigo', 'Colmeia'),
        ('colmeia.apiario.nome', 'Apiário'),
        ('data_colheita', 'Data Colheita'),
        ('quantidade_kg', 'Quantidade (kg)'),
        ('tipo_mel', 'Tipo de Mel'),
        ('qualidade', 'Qualidade'),
    ]
    
    if format_type == 'pdf':
        data = [
            {
                'colmeia.codigo': p.colmeia.codigo,
                'colmeia.apiario.nome': p.colmeia.apiario.nome,
                'data_colheita': p.data_colheita.strftime('%d/%m/%Y'),
                'quantidade_kg': f'{p.quantidade_kg:.2f}',
                'tipo_mel': p.tipo_mel,
                'qualidade': p.get_qualidade_display() if p.qualidade else '',
            }
            for p in queryset
        ]
        return export_to_pdf(
            data=data,
            filename=f'producao_{datetime.now().strftime("%Y%m%d")}.pdf',
            title='Relatório de Produção de Mel',
            columns=columns,
            orientation='landscape'
        )
    
    return export_to_excel(
        queryset=queryset,
        filename=f'producao_{datetime.now().strftime("%Y%m%d")}.xlsx',
        columns=columns,
        sheet_name='Produção'
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_coletas_produto(request):
    """Exporta coletas de pólen/própolis para Excel ou PDF"""
    format_type = request.GET.get('format', 'excel')
    tipo_produto = request.GET.get('tipo_produto')

    queryset = ColetaProduto.objects.select_related('colmeia', 'colmeia__apiario').all()

    if tipo_produto:
        queryset = queryset.filter(tipo_produto=tipo_produto)
    if request.GET.get('data_inicio'):
        queryset = queryset.filter(data_coleta__gte=request.GET.get('data_inicio'))
    if request.GET.get('data_fim'):
        queryset = queryset.filter(data_coleta__lte=request.GET.get('data_fim'))

    titulo_produto = dict(ColetaProduto.TIPO_PRODUTO_CHOICES).get(tipo_produto, 'Coletas')

    columns = [
        ('colmeia.identificador', 'Colmeia'),
        ('colmeia.apiario.nome', 'Apiário'),
        ('data_coleta', 'Data'),
        ('quantidade_g', 'Quantidade (g)'),
        ('observacoes', 'Observações'),
    ]

    if format_type == 'pdf':
        data = [
            {
                'colmeia.identificador': c.colmeia.identificador,
                'colmeia.apiario.nome': c.colmeia.apiario.nome,
                'data_coleta': c.data_coleta.strftime('%d/%m/%Y'),
                'quantidade_g': f'{c.quantidade_g:.2f}',
                'observacoes': c.observacoes,
            }
            for c in queryset
        ]
        return export_to_pdf(
            data=data,
            filename=f'coletas_{tipo_produto or "produto"}_{datetime.now().strftime("%Y%m%d")}.pdf',
            title=f'Relatório de Produção de {titulo_produto}',
            columns=columns,
            orientation='landscape'
        )

    return export_to_excel(
        queryset=queryset,
        filename=f'coletas_{tipo_produto or "produto"}_{datetime.now().strftime("%Y%m%d")}.xlsx',
        columns=columns,
        sheet_name=titulo_produto
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_financeiro(request):
    """Exporta relatório financeiro (custos e receitas) para Excel ou PDF"""
    format_type = request.GET.get('format', 'excel')
    
    # Busca custos e receitas
    custos = Custo.objects.all()
    receitas = Receita.objects.all()
    
    # Filtros de data
    if request.GET.get('data_inicio'):
        custos = custos.filter(data__gte=request.GET.get('data_inicio'))
        receitas = receitas.filter(data__gte=request.GET.get('data_inicio'))
    if request.GET.get('data_fim'):
        custos = custos.filter(data__lte=request.GET.get('data_fim'))
        receitas = receitas.filter(data__lte=request.GET.get('data_fim'))
    
    if format_type == 'pdf':
        # Dados consolidados
        data = []
        
        # Adiciona custos
        for c in custos:
            data.append({
                'tipo': 'Custo',
                'descricao': c.descricao,
                'data': c.data.strftime('%d/%m/%Y'),
                'categoria': c.get_tipo_display(),
                'valor': f'R$ -{c.valor:.2f}',
            })
        
        # Adiciona receitas
        for r in receitas:
            data.append({
                'tipo': 'Receita',
                'descricao': r.descricao,
                'data': r.data.strftime('%d/%m/%Y'),
                'categoria': r.get_tipo_display(),
                'valor': f'R$ {r.valor:.2f}',
            })
        
        # Ordena por data
        data.sort(key=lambda x: datetime.strptime(x['data'], '%d/%m/%Y'))
        
        columns = [
            ('tipo', 'Tipo'),
            ('descricao', 'Descrição'),
            ('data', 'Data'),
            ('categoria', 'Categoria'),
            ('valor', 'Valor'),
        ]
        
        return export_to_pdf(
            data=data,
            filename=f'financeiro_{datetime.now().strftime("%Y%m%d")}.pdf',
            title='Relatório Financeiro',
            columns=columns,
            orientation='landscape'
        )
    
    # Excel com múltiplas abas
    from openpyxl import Workbook
    from django.http import HttpResponse
    
    wb = Workbook()
    
    # Aba de custos
    ws_custos = wb.active
    ws_custos.title = 'Custos'
    # ... (implementação similar ao export_to_excel)
    
    # Aba de receitas
    ws_receitas = wb.create_sheet('Receitas')
    # ... (implementação similar ao export_to_excel)
    
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="financeiro_{datetime.now().strftime("%Y%m%d")}.xlsx"'
    wb.save(response)
    
    return response
