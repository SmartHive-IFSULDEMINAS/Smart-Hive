"""
Views para integração com o pipeline de visão computacional (SmartHive,
repo separado em C:\\Users\\Gabriel\\Desktop\\abelhas\\hive): recebe, por
colmeia, a contagem de abelhas/pólen extraída de cada imagem processada.

Segue o mesmo formato dos endpoints de sensores IoT em iot_views.py
(colmeia identificada por `colmeia_identificador`, sem autenticação de
usuário), com uma diferença: aqui o `token_iot` da colmeia é conferido
quando estiver configurado, já que quem chama esse endpoint não é um
dispositivo de campo e sim outro serviço.
"""
from django.db import transaction
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Colmeia, ContagemAbelha
from .serializers import ContagemAbelhaSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def receber_deteccao_abelhas(request):
    """
    Recebe o resultado de uma imagem processada pelo pipeline de visão
    computacional.

    POST /api/iot/colmeia/deteccoes/
    {
        "colmeia_identificador": "COL-001",
        "token_iot": "...",            # opcional, conferido se a colmeia tiver um configurado
        "bee_count": 12,
        "pollen_count": 3,
        "captured_at": "2026-08-18T10:30:00"
    }
    """
    colmeia_identificador = request.data.get('colmeia_identificador')
    if not colmeia_identificador:
        return Response(
            {'success': False, 'error': 'colmeia_identificador é obrigatório'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        colmeia = Colmeia.objects.get(identificador=colmeia_identificador)
    except Colmeia.DoesNotExist:
        return Response(
            {
                'success': False,
                'error': f'Colmeia com identificador "{colmeia_identificador}" não encontrada',
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    if colmeia.token_iot and colmeia.token_iot != request.data.get('token_iot'):
        return Response(
            {'success': False, 'error': 'token_iot inválido para essa colmeia'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    bee_count = request.data.get('bee_count')
    pollen_count = request.data.get('pollen_count')
    if bee_count is None or pollen_count is None:
        return Response(
            {'success': False, 'error': 'bee_count e pollen_count são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        bee_count = int(bee_count)
        pollen_count = int(pollen_count)
    except (TypeError, ValueError):
        return Response(
            {'success': False, 'error': 'bee_count e pollen_count devem ser inteiros'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    captured_at = parse_datetime(str(request.data.get('captured_at') or ''))
    if captured_at is None:
        return Response(
            {'success': False, 'error': 'captured_at é obrigatório e deve ser um datetime ISO 8601 válido'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if timezone.is_naive(captured_at):
        captured_at = timezone.make_aware(captured_at, timezone.get_current_timezone())

    with transaction.atomic():
        deteccao = ContagemAbelha.objects.create(
            colmeia=colmeia,
            bee_count=bee_count,
            pollen_count=pollen_count,
            captured_at=captured_at,
        )

        colmeia.ultima_contagem_abelhas = bee_count
        colmeia.ultima_contagem_polen = pollen_count
        colmeia.data_ultima_deteccao = deteccao.timestamp
        colmeia.save(update_fields=[
            'ultima_contagem_abelhas', 'ultima_contagem_polen', 'data_ultima_deteccao',
        ])

    return Response(
        {
            'success': True,
            'message': 'Detecção recebida e salva com sucesso',
            'colmeia': colmeia.identificador,
            'deteccao': ContagemAbelhaSerializer(deteccao).data,
        },
        status=status.HTTP_201_CREATED,
    )
