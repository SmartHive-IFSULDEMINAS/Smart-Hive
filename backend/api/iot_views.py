"""
Views para integração com dispositivos IoT
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from datetime import timedelta
from django.contrib.auth import get_user_model

from .models import Colmeia, LeituraSensor, Notificacao, AlertaRuidoConfig
from .serializers import LeituraSensorSerializer

User = get_user_model()


def _gerar_alertas_ruido(colmeia, leitura):
    """Gera notificações quando ruído atual foge da média das leituras anteriores"""
    if leitura.nivel_ruido is None:
        return

    usuarios_alerta = User.objects.filter(
        is_active=True,
        ativo=True,
    ).filter(
        Q(role__in=['dono', 'gestor']) | Q(is_superuser=True)
    ).distinct()

    if not usuarios_alerta.exists():
        return

    ruido_atual = float(leitura.nivel_ruido)

    for usuario in usuarios_alerta:
        config, _ = AlertaRuidoConfig.objects.get_or_create(usuario=usuario)

        if not config.ativo:
            continue

        leituras_anteriores = list(
            LeituraSensor.objects.filter(
                colmeia=colmeia,
                nivel_ruido__isnull=False,
            ).exclude(id=leitura.id).order_by('-timestamp')[:config.janela_media]
        )

        if len(leituras_anteriores) < config.janela_media:
            continue

        media_ruido = sum(float(item.nivel_ruido) for item in leituras_anteriores) / config.janela_media
        if media_ruido <= 0:
            continue

        limite_alerta = media_ruido * (1 + float(config.percentual_desvio) / 100)
        if ruido_atual <= limite_alerta:
            continue

        inicio_cooldown = timezone.now() - timedelta(minutes=config.cooldown_minutos)
        alerta_recente = Notificacao.objects.filter(
            usuario=usuario,
            colmeia=colmeia,
            tipo='alerta_ruido',
            created_at__gte=inicio_cooldown,
        ).exists()

        if alerta_recente:
            continue

        desvio_percentual = ((ruido_atual - media_ruido) / media_ruido) * 100
        if desvio_percentual >= 60:
            prioridade = 'critica'
        elif desvio_percentual >= 35:
            prioridade = 'alta'
        else:
            prioridade = 'media'

        Notificacao.objects.create(
            titulo=f'Ruído anormal na colmeia {colmeia.identificador}',
            mensagem=(
                f'Ruído atual: {ruido_atual:.1f} dB. '
                f'Média das últimas {config.janela_media} leituras: {media_ruido:.1f} dB '
                f'({desvio_percentual:.1f}% acima).'
            ),
            tipo='alerta_ruido',
            prioridade=prioridade,
            usuario=usuario,
            colmeia=colmeia,
            apiario=colmeia.apiario,
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def receber_dados_iot(request):
    """
    Endpoint simplificado para receber dados dos sensores IoT
    
    Exemplo de requisição JSON:
    {
        "colmeia_identificador": "CLM-001",
        "temperatura": 32.5,
        "nivel_ruido": 45.2,
        "luminosidade": 850.0,
        "dispositivo_id": "ESP32-001",
        "bateria_nivel": 85,
        "sinal_rssi": -65
    }
    """
    colmeia_identificador = request.data.get('colmeia_identificador')
    
    if not colmeia_identificador:
        return Response(
            {
                'success': False,
                'error': 'colmeia_identificador é obrigatório'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        colmeia = Colmeia.objects.get(identificador=colmeia_identificador)
    except Colmeia.DoesNotExist:
        return Response(
            {
                'success': False,
                'error': f'Colmeia com identificador "{colmeia_identificador}" não encontrada'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Extrair dados dos sensores
    temperatura = request.data.get('temperatura')
    nivel_ruido = request.data.get('nivel_ruido')
    luminosidade = request.data.get('luminosidade')
    umidade = request.data.get('umidade')
    pressao = request.data.get('pressao')
    peso = request.data.get('peso')
    dispositivo_id = request.data.get('dispositivo_id', '')
    bateria_nivel = request.data.get('bateria_nivel')
    sinal_rssi = request.data.get('sinal_rssi')
    
    # Validar que pelo menos um dado de sensor foi enviado
    if (temperatura is None and nivel_ruido is None and luminosidade is None and 
        umidade is None and pressao is None and peso is None):
        return Response(
            {
                'success': False,
                'error': 'Pelo menos um dado de sensor deve ser enviado'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Atualizar dados da colmeia e criar registro histórico
    with transaction.atomic():
        # Atualizar campos da colmeia
        if temperatura is not None:
            colmeia.temperatura_atual = temperatura
        if nivel_ruido is not None:
            colmeia.nivel_ruido = nivel_ruido
        if luminosidade is not None:
            colmeia.luminosidade = luminosidade
        if umidade is not None:
            colmeia.umidade = umidade
        if pressao is not None:
            colmeia.pressao = pressao
        if peso is not None:
            colmeia.peso = peso
        
        colmeia.data_ultima_leitura_sensor = timezone.now()
        colmeia.sensor_iot_ativo = True  # Ativa automaticamente se receber dados
        colmeia.save(update_fields=[
            'temperatura_atual', 'nivel_ruido', 'luminosidade', 
            'umidade', 'pressao', 'peso',
            'data_ultima_leitura_sensor', 'sensor_iot_ativo'
        ])
        
        # Criar registro histórico
        leitura = LeituraSensor.objects.create(
            colmeia=colmeia,
            temperatura=temperatura,
            nivel_ruido=nivel_ruido,
            luminosidade=luminosidade,
            umidade=umidade,
            pressao=pressao,
            peso=peso,
            dispositivo_id=dispositivo_id,
            bateria_nivel=bateria_nivel,
            sinal_rssi=sinal_rssi,
        )

        _gerar_alertas_ruido(colmeia, leitura)
    
    return Response(
        {
            'success': True,
            'message': 'Dados recebidos e salvos com sucesso',
            'colmeia': colmeia.identificador,
            'timestamp': timezone.now().isoformat(),
            'leitura_id': leitura.id
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def historico_sensores(request, colmeia_identificador):
    """
    Endpoint para obter histórico de leituras de sensores de uma colmeia
    """
    try:
        colmeia = Colmeia.objects.get(identificador=colmeia_identificador)
    except Colmeia.DoesNotExist:
        return Response(
            {'error': f'Colmeia com identificador "{colmeia_identificador}" não encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Parâmetros de filtro
    limit = int(request.query_params.get('limit', 100))
    offset = int(request.query_params.get('offset', 0))
    
    leituras = colmeia.leituras_sensor.all()[offset:offset+limit]
    
    serializer = LeituraSensorSerializer(leituras, many=True)
    
    return Response(
        {
            'colmeia': colmeia.identificador,
            'total': colmeia.leituras_sensor.count(),
            'leituras': serializer.data
        },
        status=status.HTTP_200_OK
    )

