"""
Views para integração com dispositivos IoT
"""
"""
Views para integração com dispositivos IoT
"""
import json
from datetime import datetime, timezone as datetime_timezone

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .alert_utils import gerar_alertas_sensores
from .models import Colmeia, LeituraSensor
from .serializers import LeituraSensorSerializer


SENSOR_FIELD_MAP = {
    'temperatura': 'temperatura_atual',
    'nivel_ruido': 'nivel_ruido',
    'luminosidade': 'luminosidade',
    'umidade': 'umidade',
    'pressao': 'pressao',
    'peso': 'peso',
}


def _parse_timestamp(value):
    if value in (None, ''):
        return None

    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, tz=datetime_timezone.utc)

    parsed = parse_datetime(str(value))
    if parsed is not None and timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def _tem_dados_sensores(payload):
    return any(payload.get(field) is not None for field in SENSOR_FIELD_MAP)


def _registrar_leitura(colmeia, payload):
    dados_sensor = {}
    for source_field, target_field in SENSOR_FIELD_MAP.items():
        value = payload.get(source_field)
        if value is not None:
            dados_sensor[target_field] = value

    if not dados_sensor:
        raise ValueError('Pelo menos um dado de sensor deve ser enviado')

    timestamp = _parse_timestamp(payload.get('timestamp')) or timezone.now()
    dispositivo_id = payload.get('dispositivo_id', '') or ''
    bateria_nivel = payload.get('bateria_nivel')
    sinal_rssi = payload.get('sinal_rssi')

    with transaction.atomic():
        for field_name, value in dados_sensor.items():
            setattr(colmeia, field_name, value)

        colmeia.data_ultima_leitura_sensor = timestamp
        colmeia.sensor_iot_ativo = True
        colmeia.save(update_fields=[
            *dados_sensor.keys(),
            'data_ultima_leitura_sensor',
            'sensor_iot_ativo',
        ])

        leitura = LeituraSensor.objects.create(
            colmeia=colmeia,
            temperatura=payload.get('temperatura'),
            nivel_ruido=payload.get('nivel_ruido'),
            luminosidade=payload.get('luminosidade'),
            umidade=payload.get('umidade'),
            pressao=payload.get('pressao'),
            peso=payload.get('peso'),
            dispositivo_id=dispositivo_id,
            bateria_nivel=bateria_nivel,
            sinal_rssi=sinal_rssi,
        )

        if timestamp is not None:
            leitura.timestamp = timestamp
            leitura.save(update_fields=['timestamp'])

        gerar_alertas_sensores(colmeia, leitura)

    return leitura


def _normalizar_arquivo_json(payload):
    if isinstance(payload, list):
        return payload, None

    if not isinstance(payload, dict):
        raise ValueError('O arquivo JSON deve conter um objeto ou uma lista de objetos')

    colmeia_identificador = payload.get('colmeia_identificador')
    leituras = payload.get('leituras')

    if leituras is None:
        leituras = payload.get('dados')

    if leituras is None:
        return [payload], colmeia_identificador

    if isinstance(leituras, dict):
        leituras = [leituras]

    if not isinstance(leituras, list):
        raise ValueError('A chave leituras deve conter uma lista de leituras')

    return leituras, colmeia_identificador


@api_view(['POST'])
@permission_classes([AllowAny])
def receber_dados_iot(request):
    """
    Endpoint simplificado para receber dados dos sensores IoT.
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

    if not _tem_dados_sensores(request.data):
        return Response(
            {
                'success': False,
                'error': 'Pelo menos um dado de sensor deve ser enviado',
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    leitura = _registrar_leitura(colmeia, request.data)

    return Response(
        {
            'success': True,
            'message': 'Dados recebidos e salvos com sucesso',
            'colmeia': colmeia.identificador,
            'timestamp': leitura.timestamp.isoformat(),
            'leitura_id': leitura.id,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def importar_dados_iot_json(request):
    """
    Recebe um arquivo JSON com uma leitura ou um lote de leituras.
    """
    arquivo_json = request.FILES.get('arquivo_json')
    if arquivo_json is not None:
        try:
            payload = json.loads(arquivo_json.read().decode('utf-8'))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return Response(
                {
                    'success': False,
                    'error': 'Arquivo JSON invalido ou com codificacao incorreta',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        payload = request.data

    try:
        leituras_payload, colmeia_identificador_padrao = _normalizar_arquivo_json(payload)
    except ValueError as exc:
        return Response(
            {'success': False, 'error': str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not leituras_payload:
        return Response(
            {'success': False, 'error': 'Nenhuma leitura foi encontrada no arquivo'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    leituras_criadas = []
    colmeias_atualizadas = []

    for leitura_payload in leituras_payload:
        if not isinstance(leitura_payload, dict):
            return Response(
                {'success': False, 'error': 'Cada leitura deve ser um objeto JSON'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        colmeia_identificador = (
            leitura_payload.get('colmeia_identificador')
            or colmeia_identificador_padrao
            or request.data.get('colmeia_identificador')
        )

        if not colmeia_identificador:
            return Response(
                {
                    'success': False,
                    'error': 'colmeia_identificador é obrigatório em cada leitura ou no topo do arquivo',
                },
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

        if not _tem_dados_sensores(leitura_payload):
            return Response(
                {
                    'success': False,
                    'error': 'Cada leitura deve conter pelo menos um dado de sensor',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        leitura = _registrar_leitura(colmeia, leitura_payload)
        leituras_criadas.append(leitura.id)
        colmeias_atualizadas.append(colmeia.identificador)

    return Response(
        {
            'success': True,
            'message': 'Arquivo JSON processado com sucesso',
            'total_recebido': len(leituras_payload),
            'total_processado': len(leituras_criadas),
            'leituras_criadas': leituras_criadas,
            'colmeias_atualizadas': sorted(set(colmeias_atualizadas)),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def historico_sensores(request, colmeia_identificador):
    """
    Endpoint para obter histórico de leituras de sensores de uma colmeia.
    """
    try:
        colmeia = Colmeia.objects.get(identificador=colmeia_identificador)
    except Colmeia.DoesNotExist:
        return Response(
            {'error': f'Colmeia com identificador "{colmeia_identificador}" não encontrada'},
            status=status.HTTP_404_NOT_FOUND,
        )

    limit = int(request.query_params.get('limit', 100))
    offset = int(request.query_params.get('offset', 0))

    leituras = colmeia.leituras_sensor.all()[offset:offset + limit]
    serializer = LeituraSensorSerializer(leituras, many=True)

    return Response(
        {
            'colmeia': colmeia.identificador,
            'total': colmeia.leituras_sensor.count(),
            'leituras': serializer.data,
        },
        status=status.HTTP_200_OK,
    )

