"""
Views para log de atividade: navegação entre telas (evento explícito do
frontend, disparado a cada troca de rota) e consulta dos logs de auditoria
(navegação + mutações de API, capturadas por audit_middleware.py).
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .audit_models import AuditLog
from .serializers import AuditLogSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_navegacao(request):
    """
    Registra que o usuário logado acessou uma tela do sistema.
    Chamado pelo frontend a cada troca de rota (não em cada chamada de API,
    para não confundir navegação real com polling de atualização automática).
    """
    pagina = (request.data.get('pagina') or '').strip()
    titulo = (request.data.get('titulo') or pagina).strip()

    if not pagina:
        return Response({'error': 'pagina é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

    AuditLog.log_action(
        user=request.user,
        action='VIEW',
        model_name=pagina,
        description=f'Acessou a tela: {titulo}',
        severity='LOW',
        ip_address=AuditLog.get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
    )

    return Response({'success': True}, status=status.HTTP_201_CREATED)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Consulta de logs de atividade (navegação + mutações de API). Restrito a Dono/Gestor."""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        if not self.request.user.can_manage_users():
            return AuditLog.objects.none()

        queryset = AuditLog.objects.select_related('user').all()

        usuario_id = self.request.query_params.get('usuario')
        action = self.request.query_params.get('action')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')

        if usuario_id:
            queryset = queryset.filter(user_id=usuario_id)
        if action:
            queryset = queryset.filter(action=action)
        if data_inicio:
            queryset = queryset.filter(timestamp__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(timestamp__lte=data_fim)

        return queryset
