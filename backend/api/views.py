from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import EspecieAbelha, Apiario, Colmeia, Inspecao, ProducaoMel, Tratamento
from .serializers import (
    EspecieAbelhaSerializer,
    ApiarioSerializer, ApiarioListSerializer,
    ColmeiaSerializer, ColmeiaListSerializer,
    InspecaoSerializer, InspecaoListSerializer,
    ProducaoMelSerializer, ProducaoMelListSerializer,
    TratamentoSerializer, TratamentoListSerializer,
    DashboardStatsSerializer
)


class EspecieAbelhaViewSet(viewsets.ModelViewSet):
    """ViewSet para espécies de abelhas"""
    queryset = EspecieAbelha.objects.all()
    serializer_class = EspecieAbelhaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome', 'nome_cientifico']
    ordering_fields = ['nome', 'nivel_agressividade', 'producao_media_anual_kg']
    ordering = ['nome']


class ApiarioViewSet(viewsets.ModelViewSet):
    """ViewSet para apiários"""
    queryset = Apiario.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome', 'localizacao', 'responsavel']
    ordering_fields = ['nome', 'data_criacao', 'ativo']
    ordering = ['nome']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ApiarioListSerializer
        return ApiarioSerializer
    
    def get_queryset(self):
        queryset = Apiario.objects.all()
        ativo = self.request.query_params.get('ativo', None)
        if ativo is not None:
            queryset = queryset.filter(ativo=ativo.lower() == 'true')
        return queryset
    
    @action(detail=True, methods=['get'])
    def colmeias(self, request, pk=None):
        """Lista colmeias de um apiário específico"""
        apiario = self.get_object()
        colmeias = apiario.colmeias.all()
        serializer = ColmeiaListSerializer(colmeias, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def estatisticas(self, request, pk=None):
        """Estatísticas do apiário"""
        apiario = self.get_object()
        hoje = timezone.now().date()
        inicio_mes = hoje.replace(day=1)
        inicio_ano = hoje.replace(month=1, day=1)
        
        colmeias = apiario.colmeias.all()
        producao_mes = ProducaoMel.objects.filter(
            colmeia__apiario=apiario,
            data_colheita__gte=inicio_mes
        ).aggregate(total=Sum('quantidade_kg'))['total'] or 0
        
        producao_ano = ProducaoMel.objects.filter(
            colmeia__apiario=apiario,
            data_colheita__gte=inicio_ano
        ).aggregate(total=Sum('quantidade_kg'))['total'] or 0
        
        stats = {
            'total_colmeias': colmeias.count(),
            'colmeias_ativas': colmeias.filter(status='ativa').count(),
            'colmeias_quarentena': colmeias.filter(status='quarentena').count(),
            'producao_mes_kg': producao_mes,
            'producao_ano_kg': producao_ano,
            'tratamentos_ativos': Tratamento.objects.filter(
                colmeia__apiario=apiario,
                status='em_andamento'
            ).count()
        }
        return Response(stats)


class ColmeiaViewSet(viewsets.ModelViewSet):
    """ViewSet para colmeias"""
    queryset = Colmeia.objects.select_related('apiario', 'especie').all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['identificador', 'nome', 'apiario__nome']
    ordering_fields = ['identificador', 'status', 'data_instalacao', 'quantidade_abelhas_estimada']
    ordering = ['apiario', 'identificador']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ColmeiaListSerializer
        return ColmeiaSerializer
    
    def get_queryset(self):
        queryset = Colmeia.objects.select_related('apiario', 'especie').all()
        
        # Filtros
        apiario_id = self.request.query_params.get('apiario', None)
        status_param = self.request.query_params.get('status', None)
        especie_id = self.request.query_params.get('especie', None)
        
        if apiario_id:
            queryset = queryset.filter(apiario_id=apiario_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if especie_id:
            queryset = queryset.filter(especie_id=especie_id)
            
        return queryset
    
    @action(detail=True, methods=['get'])
    def inspecoes(self, request, pk=None):
        """Lista inspeções de uma colmeia específica"""
        colmeia = self.get_object()
        inspecoes = colmeia.inspecoes.all()[:10]
        serializer = InspecaoListSerializer(inspecoes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def producoes(self, request, pk=None):
        """Lista produções de uma colmeia específica"""
        colmeia = self.get_object()
        producoes = colmeia.producoes.all()[:10]
        serializer = ProducaoMelListSerializer(producoes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def tratamentos(self, request, pk=None):
        """Lista tratamentos de uma colmeia específica"""
        colmeia = self.get_object()
        tratamentos = colmeia.tratamentos.all()[:10]
        serializer = TratamentoListSerializer(tratamentos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def historico(self, request, pk=None):
        """Histórico completo da colmeia"""
        colmeia = self.get_object()
        
        historico = {
            'colmeia': ColmeiaSerializer(colmeia).data,
            'inspecoes': InspecaoListSerializer(colmeia.inspecoes.all()[:20], many=True).data,
            'producoes': ProducaoMelListSerializer(colmeia.producoes.all()[:20], many=True).data,
            'tratamentos': TratamentoListSerializer(colmeia.tratamentos.all()[:20], many=True).data,
            'estatisticas': {
                'total_inspecoes': colmeia.inspecoes.count(),
                'total_producoes': colmeia.producoes.count(),
                'producao_total_kg': colmeia.producao_total,
                'total_tratamentos': colmeia.tratamentos.count(),
            }
        }
        return Response(historico)


class InspecaoViewSet(viewsets.ModelViewSet):
    """ViewSet para inspeções"""
    queryset = Inspecao.objects.select_related('colmeia', 'colmeia__apiario').all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['colmeia__identificador', 'inspetor', 'observacoes']
    ordering_fields = ['data', 'condicao_geral']
    ordering = ['-data']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InspecaoListSerializer
        return InspecaoSerializer
    
    def get_queryset(self):
        queryset = Inspecao.objects.select_related('colmeia', 'colmeia__apiario').all()
        
        # Filtros
        colmeia_id = self.request.query_params.get('colmeia', None)
        apiario_id = self.request.query_params.get('apiario', None)
        condicao = self.request.query_params.get('condicao', None)
        data_inicio = self.request.query_params.get('data_inicio', None)
        data_fim = self.request.query_params.get('data_fim', None)
        
        if colmeia_id:
            queryset = queryset.filter(colmeia_id=colmeia_id)
        if apiario_id:
            queryset = queryset.filter(colmeia__apiario_id=apiario_id)
        if condicao:
            queryset = queryset.filter(condicao_geral=condicao)
        if data_inicio:
            queryset = queryset.filter(data__date__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data__date__lte=data_fim)
            
        return queryset


class ProducaoMelViewSet(viewsets.ModelViewSet):
    """ViewSet para produções de mel"""
    queryset = ProducaoMel.objects.select_related('colmeia', 'colmeia__apiario').all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['colmeia__identificador']
    ordering_fields = ['data_colheita', 'quantidade_kg', 'qualidade']
    ordering = ['-data_colheita']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProducaoMelListSerializer
        return ProducaoMelSerializer
    
    def get_queryset(self):
        queryset = ProducaoMel.objects.select_related('colmeia', 'colmeia__apiario').all()
        
        # Filtros
        colmeia_id = self.request.query_params.get('colmeia', None)
        apiario_id = self.request.query_params.get('apiario', None)
        tipo_mel = self.request.query_params.get('tipo_mel', None)
        qualidade = self.request.query_params.get('qualidade', None)
        data_inicio = self.request.query_params.get('data_inicio', None)
        data_fim = self.request.query_params.get('data_fim', None)
        
        if colmeia_id:
            queryset = queryset.filter(colmeia_id=colmeia_id)
        if apiario_id:
            queryset = queryset.filter(colmeia__apiario_id=apiario_id)
        if tipo_mel:
            queryset = queryset.filter(tipo_mel=tipo_mel)
        if qualidade:
            queryset = queryset.filter(qualidade=qualidade)
        if data_inicio:
            queryset = queryset.filter(data_colheita__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_colheita__lte=data_fim)
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def relatorio(self, request):
        """Relatório de produção"""
        queryset = self.get_queryset()
        
        total = queryset.aggregate(
            total_kg=Sum('quantidade_kg'),
            total_registros=Count('id')
        )
        
        por_tipo = queryset.values('tipo_mel').annotate(
            total_kg=Sum('quantidade_kg'),
            quantidade=Count('id')
        ).order_by('-total_kg')
        
        por_qualidade = queryset.values('qualidade').annotate(
            total_kg=Sum('quantidade_kg'),
            quantidade=Count('id')
        ).order_by('-total_kg')
        
        por_apiario = queryset.values('colmeia__apiario__nome').annotate(
            total_kg=Sum('quantidade_kg'),
            quantidade=Count('id')
        ).order_by('-total_kg')
        
        return Response({
            'total': total,
            'por_tipo': por_tipo,
            'por_qualidade': por_qualidade,
            'por_apiario': por_apiario
        })


class TratamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para tratamentos"""
    queryset = Tratamento.objects.select_related('colmeia', 'colmeia__apiario').all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['colmeia__identificador', 'medicamento', 'motivo']
    ordering_fields = ['data_inicio', 'status', 'tipo_tratamento']
    ordering = ['-data_inicio']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TratamentoListSerializer
        return TratamentoSerializer
    
    def get_queryset(self):
        queryset = Tratamento.objects.select_related('colmeia', 'colmeia__apiario').all()
        
        # Filtros
        colmeia_id = self.request.query_params.get('colmeia', None)
        apiario_id = self.request.query_params.get('apiario', None)
        tipo = self.request.query_params.get('tipo', None)
        status_param = self.request.query_params.get('status', None)
        
        if colmeia_id:
            queryset = queryset.filter(colmeia_id=colmeia_id)
        if apiario_id:
            queryset = queryset.filter(colmeia__apiario_id=apiario_id)
        if tipo:
            queryset = queryset.filter(tipo_tratamento=tipo)
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """Finaliza um tratamento"""
        tratamento = self.get_object()
        tratamento.status = 'concluido'
        tratamento.data_fim = timezone.now().date()
        tratamento.resultado = request.data.get('resultado', '')
        tratamento.save()
        
        serializer = TratamentoSerializer(tratamento)
        return Response(serializer.data)


class DashboardView(APIView):
    """View para dashboard com estatísticas gerais"""
    
    def get(self, request):
        hoje = timezone.now().date()
        inicio_mes = hoje.replace(day=1)
        inicio_ano = hoje.replace(month=1, day=1)
        proximos_7_dias = hoje + timedelta(days=7)
        
        # Estatísticas gerais
        stats = {
            'total_apiarios': Apiario.objects.count(),
            'apiarios_ativos': Apiario.objects.filter(ativo=True).count(),
            'total_colmeias': Colmeia.objects.count(),
            'colmeias_ativas': Colmeia.objects.filter(status='ativa').count(),
            'colmeias_em_quarentena': Colmeia.objects.filter(status='quarentena').count(),
            'total_inspecoes': Inspecao.objects.count(),
            'inspecoes_mes': Inspecao.objects.filter(data__date__gte=inicio_mes).count(),
            'producao_total_kg': ProducaoMel.objects.aggregate(total=Sum('quantidade_kg'))['total'] or 0,
            'producao_mes_kg': ProducaoMel.objects.filter(
                data_colheita__gte=inicio_mes
            ).aggregate(total=Sum('quantidade_kg'))['total'] or 0,
            'producao_ano_kg': ProducaoMel.objects.filter(
                data_colheita__gte=inicio_ano
            ).aggregate(total=Sum('quantidade_kg'))['total'] or 0,
            'tratamentos_em_andamento': Tratamento.objects.filter(status='em_andamento').count(),
            'colmeias_com_problemas': Colmeia.objects.filter(
                Q(status='quarentena') | 
                Q(inspecoes__presenca_pragas=True) | 
                Q(inspecoes__presenca_doencas=True)
            ).distinct().count(),
        }
        
        # Próximas inspeções agendadas
        proximas_inspecoes = Inspecao.objects.filter(
            proxima_inspecao__gte=hoje,
            proxima_inspecao__lte=proximos_7_dias
        ).select_related('colmeia', 'colmeia__apiario').order_by('proxima_inspecao')[:5]
        
        stats['proximas_inspecoes'] = InspecaoListSerializer(proximas_inspecoes, many=True).data
        
        # Últimas produções
        ultimas_producoes = ProducaoMel.objects.select_related(
            'colmeia', 'colmeia__apiario'
        ).order_by('-data_colheita')[:5]
        
        stats['ultimas_producoes'] = ProducaoMelListSerializer(ultimas_producoes, many=True).data
        
        # Produção por mês (últimos 12 meses)
        producao_por_mes = []
        for i in range(11, -1, -1):
            mes_atual = hoje.replace(day=1) - timedelta(days=i*30)
            mes_inicio = mes_atual.replace(day=1)
            if mes_atual.month == 12:
                mes_fim = mes_atual.replace(year=mes_atual.year+1, month=1, day=1)
            else:
                mes_fim = mes_atual.replace(month=mes_atual.month+1, day=1)
            
            producao = ProducaoMel.objects.filter(
                data_colheita__gte=mes_inicio,
                data_colheita__lt=mes_fim
            ).aggregate(total=Sum('quantidade_kg'))['total'] or 0
            
            producao_por_mes.append({
                'mes': mes_inicio.strftime('%b/%Y'),
                'producao_kg': float(producao)
            })
        
        stats['producao_por_mes'] = producao_por_mes
        
        # Colmeias por status
        stats['colmeias_por_status'] = list(
            Colmeia.objects.values('status').annotate(total=Count('id'))
        )
        
        # Colmeias por apiário
        stats['colmeias_por_apiario'] = list(
            Colmeia.objects.values('apiario__nome').annotate(total=Count('id')).order_by('-total')[:5]
        )
        
        return Response(stats)
