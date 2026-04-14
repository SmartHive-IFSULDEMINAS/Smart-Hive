from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, Avg, Max, Min
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from .models import (
    EspecieAbelha, Apiario, Colmeia, Inspecao, ProducaoMel, Tratamento,
    Custo, Receita, Fornecedor, Equipamento, Notificacao, LeituraSensor,
    ClassificacaoPolen, AlertaRuidoConfig,
)
from .serializers import (
    EspecieAbelhaSerializer,
    ApiarioSerializer, ApiarioListSerializer,
    ColmeiaSerializer, ColmeiaListSerializer,
    InspecaoSerializer, InspecaoListSerializer,
    ProducaoMelSerializer, ProducaoMelListSerializer,
    TratamentoSerializer, TratamentoListSerializer,
    DashboardStatsSerializer,
    CustoSerializer, CustoListSerializer,
    ReceitaSerializer, ReceitaListSerializer,
    FornecedorSerializer,
    EquipamentoSerializer,
    NotificacaoSerializer,
    AlertaRuidoConfigSerializer,
    LeituraSensorListSerializer,
    ClassificacaoPolenSerializer,
)
from .alert_utils import gerar_alerta_producao

User = get_user_model()


class EspecieAbelhaViewSet(viewsets.ModelViewSet):
    """ViewSet para espécies de abelhas"""
    queryset = EspecieAbelha.objects.all()
    serializer_class = EspecieAbelhaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome', 'nome_cientifico']
    ordering_fields = ['nome', 'nivel_agressividade', 'producao_media_anual_kg']
    ordering = ['nome']


class ApiarioViewSet(viewsets.ModelViewSet):
    """ViewSet para apiários"""
    queryset = Apiario.objects.all()
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]
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
    
    
    @action(detail=True, methods=['get'])
    def leituras_sensor(self, request, pk=None):
        """Lista leituras de sensores da colmeia"""
        colmeia = self.get_object()
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        
        leituras = colmeia.leituras_sensor.all()[offset:offset+limit]
        
        return Response({
            'total': colmeia.leituras_sensor.count(),
            'leituras': LeituraSensorListSerializer(leituras, many=True).data
        })


class InspecaoViewSet(viewsets.ModelViewSet):
    """ViewSet para inspeções"""
    queryset = Inspecao.objects.select_related('colmeia', 'colmeia__apiario').all()
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]
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

    def perform_create(self, serializer):
        producao = serializer.save()
        gerar_alerta_producao(producao)
    
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
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]
    
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
        
        # Colmeias com sensores IoT ativos
        colmeias_iot = Colmeia.objects.filter(
            sensor_iot_ativo=True
        ).select_related('apiario', 'especie').order_by('-data_ultima_leitura_sensor')[:10]
        
        stats['colmeias_iot'] = ColmeiaListSerializer(colmeias_iot, many=True).data

        colmeias_iot_map = {item['id']: item for item in stats['colmeias_iot']}
        for colmeia in colmeias_iot:
            pontos = list(
                LeituraSensor.objects.filter(colmeia=colmeia)
                .order_by('-timestamp')
                .values('timestamp', 'temperatura', 'nivel_ruido', 'luminosidade', 'umidade', 'pressao', 'peso')[:12]
            )
            pontos.reverse()

            colmeias_iot_map[colmeia.id]['sparklines'] = {
                'temperatura': [float(p['temperatura']) for p in pontos if p['temperatura'] is not None],
                'nivel_ruido': [float(p['nivel_ruido']) for p in pontos if p['nivel_ruido'] is not None],
                'luminosidade': [float(p['luminosidade']) for p in pontos if p['luminosidade'] is not None],
                'umidade': [float(p['umidade']) for p in pontos if p['umidade'] is not None],
                'pressao': [float(p['pressao']) for p in pontos if p['pressao'] is not None],
                'peso': [float(p['peso']) for p in pontos if p['peso'] is not None],
            }
        
        # Estatísticas de sensores
        stats['total_colmeias_iot'] = Colmeia.objects.filter(sensor_iot_ativo=True).count()
        stats['colmeias_iot_com_dados'] = Colmeia.objects.filter(
            sensor_iot_ativo=True,
            data_ultima_leitura_sensor__isnull=False
        ).count()
        
        return Response(stats)


class DashboardComparativoView(APIView):
    """Comparativo entre apiários por período"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period_days = int(request.query_params.get('periodo_dias', 30))
        hoje = timezone.now().date()
        data_inicio = hoje - timedelta(days=period_days)

        apiarios = Apiario.objects.all().order_by('nome')
        ranking = []

        for apiario in apiarios:
            producao_periodo = ProducaoMel.objects.filter(
                colmeia__apiario=apiario,
                data_colheita__gte=data_inicio,
                data_colheita__lte=hoje,
            ).aggregate(total=Sum('quantidade_kg'))['total'] or 0

            perdas = Colmeia.objects.filter(
                apiario=apiario,
                status__in=['inativa', 'morta'],
            ).count()

            tratamentos_periodo = Tratamento.objects.filter(
                colmeia__apiario=apiario,
                data_inicio__gte=data_inicio,
                data_inicio__lte=hoje,
            ).count()

            custos_periodo = Custo.objects.filter(
                Q(apiario=apiario) | Q(colmeia__apiario=apiario),
                data__gte=data_inicio,
                data__lte=hoje,
            ).aggregate(total=Sum('valor'))['total'] or 0

            colmeias_ativas = Colmeia.objects.filter(apiario=apiario, status='ativa').count()
            produtividade_por_colmeia = float(producao_periodo / colmeias_ativas) if colmeias_ativas > 0 else 0

            ranking.append({
                'apiario_id': apiario.id,
                'apiario_nome': apiario.nome,
                'produtividade_kg': float(producao_periodo),
                'perdas': perdas,
                'tratamentos': tratamentos_periodo,
                'custos': float(custos_periodo),
                'colmeias_ativas': colmeias_ativas,
                'produtividade_por_colmeia_kg': produtividade_por_colmeia,
            })

        ranking.sort(key=lambda item: item['produtividade_kg'], reverse=True)

        return Response({
            'periodo_dias': period_days,
            'data_inicio': str(data_inicio),
            'data_fim': str(hoje),
            'ranking': ranking,
        })


class DashboardPrevisaoView(APIView):
    """Previsão de produção por apiário e colmeia"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lookback_days = int(request.query_params.get('base_dias', 90))
        hoje = timezone.now().date()
        data_inicio = hoje - timedelta(days=lookback_days)
        horizontes = [7, 30, 90]

        apiarios_data = []
        colmeias_data = []

        for apiario in Apiario.objects.all().order_by('nome'):
            total_periodo = ProducaoMel.objects.filter(
                colmeia__apiario=apiario,
                data_colheita__gte=data_inicio,
                data_colheita__lte=hoje,
            ).aggregate(total=Sum('quantidade_kg'))['total'] or 0

            media_diaria = float(total_periodo) / max(lookback_days, 1)
            apiarios_data.append({
                'apiario_id': apiario.id,
                'apiario_nome': apiario.nome,
                'media_diaria_kg': round(media_diaria, 3),
                'projecoes': {str(dias): round(media_diaria * dias, 2) for dias in horizontes},
            })

        for colmeia in Colmeia.objects.select_related('apiario').all().order_by('identificador'):
            total_periodo = ProducaoMel.objects.filter(
                colmeia=colmeia,
                data_colheita__gte=data_inicio,
                data_colheita__lte=hoje,
            ).aggregate(total=Sum('quantidade_kg'))['total'] or 0

            media_diaria = float(total_periodo) / max(lookback_days, 1)
            colmeias_data.append({
                'colmeia_id': colmeia.id,
                'colmeia_identificador': colmeia.identificador,
                'apiario_nome': colmeia.apiario.nome,
                'media_diaria_kg': round(media_diaria, 3),
                'projecoes': {str(dias): round(media_diaria * dias, 2) for dias in horizontes},
            })

        apiarios_data.sort(key=lambda item: item['projecoes']['30'], reverse=True)
        colmeias_data.sort(key=lambda item: item['projecoes']['30'], reverse=True)

        resumo = {
            str(dias): round(sum(item['projecoes'][str(dias)] for item in apiarios_data), 2)
            for dias in horizontes
        }

        return Response({
            'base_dias': lookback_days,
            'data_inicio': str(data_inicio),
            'data_fim': str(hoje),
            'resumo_apiarios': resumo,
            'apiarios': apiarios_data,
            'colmeias': colmeias_data[:20],
        })


# New ViewSets
class CustoViewSet(viewsets.ModelViewSet):
    """ViewSet para custos"""
    queryset = Custo.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['descricao', 'fornecedor']
    ordering_fields = ['data', 'valor']
    ordering = ['-data']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CustoListSerializer
        return CustoSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def get_queryset(self):
        queryset = Custo.objects.all()
        apiario_id = self.request.query_params.get('apiario', None)
        colmeia_id = self.request.query_params.get('colmeia', None)
        tipo = self.request.query_params.get('tipo', None)
        data_inicio = self.request.query_params.get('data_inicio', None)
        data_fim = self.request.query_params.get('data_fim', None)
        
        if apiario_id:
            queryset = queryset.filter(apiario_id=apiario_id)
        if colmeia_id:
            queryset = queryset.filter(colmeia_id=colmeia_id)
        if tipo:
            queryset = queryset.filter(tipo_custo=tipo)
        if data_inicio:
            queryset = queryset.filter(data__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data__lte=data_fim)
        
        return queryset


class ReceitaViewSet(viewsets.ModelViewSet):
    """ViewSet para receitas"""
    queryset = Receita.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['descricao', 'cliente']
    ordering_fields = ['data', 'valor']
    ordering = ['-data']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ReceitaListSerializer
        return ReceitaSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def get_queryset(self):
        queryset = Receita.objects.all()
        tipo = self.request.query_params.get('tipo', None)
        data_inicio = self.request.query_params.get('data_inicio', None)
        data_fim = self.request.query_params.get('data_fim', None)
        
        if tipo:
            queryset = queryset.filter(tipo_receita=tipo)
        if data_inicio:
            queryset = queryset.filter(data__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data__lte=data_fim)
        
        return queryset


class FornecedorViewSet(viewsets.ModelViewSet):
    """ViewSet para fornecedores"""
    queryset = Fornecedor.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = FornecedorSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome', 'cnpj', 'email']
    ordering_fields = ['nome', 'tipo_fornecedor']
    ordering = ['nome']
    
    def get_queryset(self):
        queryset = Fornecedor.objects.all()
        ativo = self.request.query_params.get('ativo', None)
        tipo = self.request.query_params.get('tipo', None)
        
        if ativo is not None:
            queryset = queryset.filter(ativo=ativo.lower() == 'true')
        if tipo:
            queryset = queryset.filter(tipo_fornecedor=tipo)
        
        return queryset


class EquipamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para equipamentos"""
    queryset = Equipamento.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = EquipamentoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome', 'marca', 'modelo', 'numero_serie']
    ordering_fields = ['nome', 'status', 'data_compra']
    ordering = ['nome']
    
    def get_queryset(self):
        queryset = Equipamento.objects.all()
        apiario_id = self.request.query_params.get('apiario', None)
        status_param = self.request.query_params.get('status', None)
        tipo = self.request.query_params.get('tipo', None)
        
        if apiario_id:
            queryset = queryset.filter(apiario_id=apiario_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if tipo:
            queryset = queryset.filter(tipo_equipamento=tipo)
        
        return queryset


class NotificacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para notificações"""
    permission_classes = [IsAuthenticated]
    serializer_class = NotificacaoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo', 'mensagem']
    ordering_fields = ['created_at', 'prioridade']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Usuário só vê suas próprias notificações
        return Notificacao.objects.filter(usuario=self.request.user)
    
    @action(detail=True, methods=['post'])
    def marcar_lida(self, request, pk=None):
        """Marca notificação como lida"""
        notificacao = self.get_object()
        notificacao.lida = True
        notificacao.data_leitura = timezone.now()
        notificacao.save()
        return Response({'status': 'marcada como lida'})
    
    @action(detail=False, methods=['get'])
    def nao_lidas(self, request):
        """Retorna notificações não lidas"""
        notificacoes = self.get_queryset().filter(lida=False)
        serializer = self.get_serializer(notificacoes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def marcar_todas_lidas(self, request):
        """Marca todas notificações do usuário como lidas"""
        agora = timezone.now()
        atualizadas = self.get_queryset().filter(lida=False).update(
            lida=True,
            data_leitura=agora,
        )
        return Response({'status': 'ok', 'total_marcadas': atualizadas})

    @action(detail=False, methods=['get', 'patch'])
    def alerta_ruido_config(self, request):
        """Obtém/atualiza configuração de alerta de ruído do usuário"""
        config, _ = AlertaRuidoConfig.objects.get_or_create(usuario=request.user)

        if request.method == 'PATCH':
            serializer = AlertaRuidoConfigSerializer(config, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)

            destino_alerta = serializer.validated_data.get('destino_alerta', config.destino_alerta)
            usuario_destino = serializer.validated_data.get('usuario_destino', config.usuario_destino)
            if destino_alerta == 'usuario' and not usuario_destino:
                return Response(
                    {'error': 'Selecione um usuário destino para alertas específicos.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer.save()
            return Response(serializer.data)

        serializer = AlertaRuidoConfigSerializer(config)
        return Response(serializer.data)


# New Dashboard Views
class DashboardFinanceiroView(APIView):
    """Dashboard financeiro com custos, receitas e lucro"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if not user.can_view_reports():
            return Response(
                {'error': 'Você não tem permissão para visualizar relatórios financeiros'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        hoje = timezone.now().date()
        inicio_mes = hoje.replace(day=1)
        inicio_ano = hoje.replace(month=1, day=1)
        
        # Custos
        custos_total = Custo.objects.aggregate(total=Sum('valor'))['total'] or 0
        custos_mes = Custo.objects.filter(data__gte=inicio_mes).aggregate(total=Sum('valor'))['total'] or 0
        custos_ano = Custo.objects.filter(data__gte=inicio_ano).aggregate(total=Sum('valor'))['total'] or 0
        
        # Receitas
        receitas_total = Receita.objects.aggregate(total=Sum('valor'))['total'] or 0
        receitas_mes = Receita.objects.filter(data__gte=inicio_mes).aggregate(total=Sum('valor'))['total'] or 0
        receitas_ano = Receita.objects.filter(data__gte=inicio_ano).aggregate(total=Sum('valor'))['total'] or 0
        
        # Lucro
        lucro_total = receitas_total - custos_total
        lucro_mes = receitas_mes - custos_mes
        lucro_ano = receitas_ano - custos_ano
        
        # Custos por tipo
        custos_por_tipo = list(
            Custo.objects.values('tipo_custo').annotate(
                total=Sum('valor'),
                quantidade=Count('id')
            ).order_by('-total')
        )
        
        # Receitas por tipo
        receitas_por_tipo = list(
            Receita.objects.values('tipo_receita').annotate(
                total=Sum('valor'),
                quantidade=Count('id')
            ).order_by('-total')
        )
        
        # Evolução mensal (últimos 12 meses)
        evolucao_mensal = []
        for i in range(11, -1, -1):
            mes_atual = hoje.replace(day=1) - timedelta(days=i*30)
            mes_inicio = mes_atual.replace(day=1)
            if mes_atual.month == 12:
                mes_fim = mes_atual.replace(year=mes_atual.year+1, month=1, day=1)
            else:
                mes_fim = mes_atual.replace(month=mes_atual.month+1, day=1)
            
            custos_mes = Custo.objects.filter(
                data__gte=mes_inicio,
                data__lt=mes_fim
            ).aggregate(total=Sum('valor'))['total'] or 0
            
            receitas_mes = Receita.objects.filter(
                data__gte=mes_inicio,
                data__lt=mes_fim
            ).aggregate(total=Sum('valor'))['total'] or 0
            
            evolucao_mensal.append({
                'mes': mes_inicio.strftime('%b/%Y'),
                'custos': float(custos_mes),
                'receitas': float(receitas_mes),
                'lucro': float(receitas_mes - custos_mes)
            })
        
        stats = {
            'resumo': {
                'custos_total': float(custos_total),
                'custos_mes': float(custos_mes),
                'custos_ano': float(custos_ano),
                'receitas_total': float(receitas_total),
                'receitas_mes': float(receitas_mes),
                'receitas_ano': float(receitas_ano),
                'lucro_total': float(lucro_total),
                'lucro_mes': float(lucro_mes),
                'lucro_ano': float(lucro_ano),
            },
            'custos_por_tipo': custos_por_tipo,
            'receitas_por_tipo': receitas_por_tipo,
            'evolucao_mensal': evolucao_mensal,
        }
        
        return Response(stats)


class DashboardSaudeView(APIView):
    """Dashboard de saúde das colmeias"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        hoje = timezone.now().date()
        ultimos_30_dias = hoje - timedelta(days=30)
        
        # Estatísticas gerais
        total_colmeias = Colmeia.objects.count()
        colmeias_quarentena = Colmeia.objects.filter(status='quarentena').count()
        colmeias_mortas = Colmeia.objects.filter(status='morta').count()
        
        # Inspeções recentes
        inspecoes_recentes = Inspecao.objects.filter(data__date__gte=ultimos_30_dias)
        inspecoes_com_pragas = inspecoes_recentes.filter(presenca_pragas=True).count()
        inspecoes_com_doencas = inspecoes_recentes.filter(presenca_doencas=True).count()
        
        # Condição geral das colmeias
        condicoes = inspecoes_recentes.values('condicao_geral').annotate(
            total=Count('id')
        )
        
        # Tratamentos
        tratamentos_ativos = Tratamento.objects.filter(status='em_andamento').count()
        tratamentos_mes = Tratamento.objects.filter(
            data_inicio__gte=hoje.replace(day=1)
        ).count()
        
        # Tipos de pragas mais comuns
        pragas = {}
        for inspecao in inspecoes_recentes.filter(presenca_pragas=True):
            if inspecao.tipo_pragas:
                for praga in inspecao.tipo_pragas.split(','):
                    praga = praga.strip()
                    if praga:
                        pragas[praga] = pragas.get(praga, 0) + 1
        
        # Tipos de doenças mais comuns
        doencas = {}
        for inspecao in inspecoes_recentes.filter(presenca_doencas=True):
            if inspecao.tipo_doencas:
                for doenca in inspecao.tipo_doencas.split(','):
                    doenca = doenca.strip()
                    if doenca:
                        doencas[doenca] = doencas.get(doenca, 0) + 1
        
        # Colmeias que precisam de atenção
        colmeias_atencao = Colmeia.objects.filter(
            Q(status='quarentena') |
            Q(inspecoes__presenca_pragas=True) |
            Q(inspecoes__presenca_doencas=True) |
            Q(inspecoes__condicao_geral__in=['ruim', 'critica'])
        ).distinct()[:10]
        
        stats = {
            'resumo': {
                'total_colmeias': total_colmeias,
                'colmeias_quarentena': colmeias_quarentena,
                'colmeias_mortas': colmeias_mortas,
                'inspecoes_com_pragas': inspecoes_com_pragas,
                'inspecoes_com_doencas': inspecoes_com_doencas,
                'tratamentos_ativos': tratamentos_ativos,
                'tratamentos_mes': tratamentos_mes,
            },
            'condicoes_gerais': list(condicoes),
            'pragas_mais_comuns': sorted(pragas.items(), key=lambda x: x[1], reverse=True)[:5],
            'doencas_mais_comuns': sorted(doencas.items(), key=lambda x: x[1], reverse=True)[:5],
            'colmeias_atencao': ColmeiaListSerializer(colmeias_atencao, many=True).data,
        }
        
        return Response(stats)


class DashboardProdutividadeView(APIView):
    """Dashboard de produtividade comparando apiários e colmeias"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        hoje = timezone.now().date()
        inicio_ano = hoje.replace(month=1, day=1)
        
        # Produção por apiário
        producao_por_apiario = list(
            ProducaoMel.objects.filter(data_colheita__gte=inicio_ano)
            .values('colmeia__apiario__nome')
            .annotate(
                total_kg=Sum('quantidade_kg'),
                quantidade=Count('id'),
                media_kg=Avg('quantidade_kg')
            )
            .order_by('-total_kg')
        )
        
        # Produção por colmeia (top 10)
        producao_por_colmeia = list(
            ProducaoMel.objects.filter(data_colheita__gte=inicio_ano)
            .values('colmeia__identificador', 'colmeia__apiario__nome')
            .annotate(
                total_kg=Sum('quantidade_kg'),
                quantidade=Count('id'),
                media_kg=Avg('quantidade_kg')
            )
            .order_by('-total_kg')[:10]
        )
        
        # Produção por espécie
        producao_por_especie = list(
            ProducaoMel.objects.filter(data_colheita__gte=inicio_ano)
            .values('colmeia__especie__nome')
            .annotate(
                total_kg=Sum('quantidade_kg'),
                quantidade=Count('id'),
                media_kg=Avg('quantidade_kg')
            )
            .order_by('-total_kg')
        )
        
        # Média de produção por colmeia por apiário
        apiarios_com_media = []
        for apiario in Apiario.objects.filter(ativo=True):
            colmeias = apiario.colmeias.filter(status='ativa')
            if colmeias.exists():
                producao_total = ProducaoMel.objects.filter(
                    colmeia__apiario=apiario,
                    data_colheita__gte=inicio_ano
                ).aggregate(total=Sum('quantidade_kg'))['total'] or 0
                
                apiarios_com_media.append({
                    'apiario': apiario.nome,
                    'total_colmeias': colmeias.count(),
                    'producao_total_kg': float(producao_total),
                    'media_por_colmeia_kg': float(producao_total / colmeias.count()) if colmeias.count() > 0 else 0
                })
        
        stats = {
            'producao_por_apiario': producao_por_apiario,
            'producao_por_colmeia': producao_por_colmeia,
            'producao_por_especie': producao_por_especie,
            'media_por_apiario': apiarios_com_media,
        }

        return Response(stats)


class ClassificacaoPolenViewSet(viewsets.ModelViewSet):
    """ViewSet para histórico de classificações espectrais de pólen (IA)"""
    queryset = ClassificacaoPolen.objects.all()
    serializer_class = ClassificacaoPolenSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['dispositivo_id', 'notas']
    ordering_fields = ['timestamp', 'knn_classe', 'kmeans_cluster']
    ordering = ['-timestamp']
    http_method_names = ['get', 'delete', 'head', 'options']  # somente leitura + delete

    def get_queryset(self):
        queryset = ClassificacaoPolen.objects.all()
        knn = self.request.query_params.get('knn_classe')
        cluster = self.request.query_params.get('kmeans_cluster')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')

        if knn:
            queryset = queryset.filter(knn_classe=knn)
        if cluster:
            queryset = queryset.filter(kmeans_cluster=cluster)
        if data_inicio:
            queryset = queryset.filter(timestamp__date__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(timestamp__date__lte=data_fim)

        return queryset

    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Retorna distribuição de classes KNN e clusters KMeans"""
        qs = self.get_queryset()
        total = qs.count()

        knn_dist = (
            qs.values('knn_classe')
            .annotate(total=Count('id'))
            .order_by('knn_classe')
        )
        cluster_dist = (
            qs.values('kmeans_cluster')
            .annotate(total=Count('id'))
            .order_by('kmeans_cluster')
        )

        ultima = qs.first()

        return Response({
            'total': total,
            'distribuicao_knn': list(knn_dist),
            'distribuicao_clusters': list(cluster_dist),
            'ultima_classificacao': ClassificacaoPolenSerializer(ultima).data if ultima else None,
        })
