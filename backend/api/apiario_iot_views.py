"""
Views para receber dados IoT dos apiários
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction

from .models import Apiario


@api_view(['POST'])
@permission_classes([AllowAny])
def receber_dados_iot_apiario(request):
    """
    Endpoint simplificado para receber dados dos sensores IoT do apiário
    
    Exemplo de requisição JSON:
    {
        "apiario_id": 1,
        "temperatura": 28.5,
        "latitude": -23.5505,
        "longitude": -46.6333
    }
    """
    apiario_id = request.data.get('apiario_id')
    apiario_nome = request.data.get('apiario_nome')  # Alternativa: buscar por nome
    
    if not apiario_id and not apiario_nome:
        return Response(
            {
                'success': False,
                'error': 'apiario_id ou apiario_nome é obrigatório'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        if apiario_id:
            apiario = Apiario.objects.get(id=apiario_id)
        else:
            apiario = Apiario.objects.get(nome=apiario_nome)
    except Apiario.DoesNotExist:
        return Response(
            {
                'success': False,
                'error': f'Apiário não encontrado'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Extrair dados dos sensores
    temperatura = request.data.get('temperatura')
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    
    # Validar que pelo menos um dado foi enviado
    if temperatura is None and latitude is None and longitude is None:
        return Response(
            {
                'success': False,
                'error': 'Pelo menos um dado (temperatura, latitude ou longitude) deve ser enviado'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Atualizar dados do apiário
    with transaction.atomic():
        if temperatura is not None:
            apiario.temperatura_atual = temperatura
        if latitude is not None:
            apiario.latitude = latitude
        if longitude is not None:
            apiario.longitude = longitude
        
        apiario.data_ultima_leitura_sensor = timezone.now()
        apiario.sensor_iot_ativo = True  # Ativa automaticamente se receber dados
        apiario.save(update_fields=[
            'temperatura_atual', 'latitude', 'longitude',
            'data_ultima_leitura_sensor', 'sensor_iot_ativo'
        ])
    
    return Response(
        {
            'success': True,
            'message': 'Dados do apiário recebidos e salvos com sucesso',
            'apiario': apiario.nome,
            'apiario_id': apiario.id,
            'timestamp': timezone.now().isoformat(),
        },
        status=status.HTTP_200_OK
    )

