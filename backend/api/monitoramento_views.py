"""
Agendamento diário do código de monitoramento que roda no Raspberry Pi.

Fluxo:
  1. A tela "Agendamento do Monitoramento" lê/grava a configuração em
     `agendamento/` (horário de início e de encerramento, todos os dias).
  2. O agendador do Pi (camera-pi/agendador_monitoramento.py, serviço
     systemd próprio) faz POST em `pi/` a cada poucos segundos: manda o
     estado real do processo e recebe a configuração vigente. Quem decide
     iniciar/encerrar é o Pi, pelo relógio dele, com a configuração guardada
     em disco: o agendamento continua valendo com o navegador fechado e até
     com o servidor fora do ar.

O intervalo é [início, fim) no mesmo dia; intervalos que passam da
meia-noite não são suportados nesta versão. Com o agendamento desabilitado o
monitoramento roda continuamente (o comportamento de antes do agendamento).
"""
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .alert_utils import _usuarios_alerta_ativos
from .camera_views import _camera, _iguais, _sem_camera
from .models import AgendamentoMonitoramento, Camera, Notificacao

logger = logging.getLogger(__name__)

# O agendador relata a cada ~10s; acima disso sem relato, consideramos o Pi offline
PI_ONLINE_JANELA = timedelta(seconds=45)
ESTADOS_FALHA = ('falha_inicio', 'falha_encerramento')
INTERVALO_NOTIFICACAO_FALHA = timedelta(hours=1)
FORMATO_HORA = '%H:%M'


def _fuso():
    return ZoneInfo(settings.TIME_ZONE)


def calcular_agenda(habilitado, hora_inicio, hora_fim, agora):
    """
    Estado esperado pelo agendamento em `agora` (datetime aware) e o próximo
    evento programado. Mesma regra do agendador do Pi.

    Retorna (codigo, proximo_evento), com codigo em desativado |
    aguardando_inicio | em_periodo | encerrado_hoje e proximo_evento
    {'tipo': 'inicio'|'encerramento', 'em': datetime} ou None.
    """
    if not habilitado:
        return 'desativado', None
    fuso = _fuso()
    local = agora.astimezone(fuso)
    hoje = local.date()

    def em(dia, hora):
        return datetime.combine(dia, hora, tzinfo=fuso)

    agora_hora = local.time()
    if agora_hora < hora_inicio:
        return 'aguardando_inicio', {'tipo': 'inicio', 'em': em(hoje, hora_inicio)}
    if agora_hora < hora_fim:
        return 'em_periodo', {'tipo': 'encerramento', 'em': em(hoje, hora_fim)}
    return 'encerrado_hoje', {'tipo': 'inicio', 'em': em(hoje + timedelta(days=1), hora_inicio)}


def _situacao(agendamento, agenda, pi_online):
    """Combina o estado esperado pela agenda com o estado real relatado pelo Pi."""
    if not agendamento.ultimo_relato:
        return 'pi_sem_relato'
    if not pi_online:
        return 'pi_offline'
    estado = agendamento.estado_processo
    if estado in ('executando', 'encerrando', 'sem_comando', *ESTADOS_FALHA):
        return estado
    # parado (ou desconhecido): explica o porquê pela agenda
    if agenda == 'aguardando_inicio':
        return 'aguardando_inicio'
    if agenda == 'encerrado_hoje':
        return 'encerrado_agendamento'
    return 'parado'


class AgendamentoSerializer(serializers.ModelSerializer):
    hora_inicio = serializers.TimeField(format=FORMATO_HORA, input_formats=['%H:%M', '%H:%M:%S'])
    hora_fim = serializers.TimeField(format=FORMATO_HORA, input_formats=['%H:%M', '%H:%M:%S'])
    habilitado = serializers.BooleanField()

    class Meta:
        model = AgendamentoMonitoramento
        fields = ['habilitado', 'hora_inicio', 'hora_fim']

    def validate(self, attrs):
        inicio, fim = attrs['hora_inicio'], attrs['hora_fim']
        if inicio == fim:
            raise serializers.ValidationError(
                {'hora_fim': 'O horário de encerramento deve ser diferente do horário de início.'}
            )
        if inicio > fim:
            raise serializers.ValidationError(
                {'hora_fim': 'O horário de encerramento deve ser depois do início, no mesmo dia '
                             '(intervalos que passam da meia-noite não são suportados).'}
            )
        return attrs


def _obter_agendamento(camera):
    agendamento, _ = AgendamentoMonitoramento.objects.get_or_create(camera=camera)
    return agendamento


def _serializar(agendamento):
    agora = timezone.now()
    agenda, proximo = calcular_agenda(
        agendamento.habilitado, agendamento.hora_inicio, agendamento.hora_fim, agora,
    )
    pi_online = bool(agendamento.ultimo_relato and agora - agendamento.ultimo_relato < PI_ONLINE_JANELA)
    return {
        'habilitado': agendamento.habilitado,
        'hora_inicio': agendamento.hora_inicio.strftime(FORMATO_HORA),
        'hora_fim': agendamento.hora_fim.strftime(FORMATO_HORA),
        'versao': agendamento.versao,
        'configurado_em': agendamento.configurado_em,
        'configurado_por': agendamento.configurado_por.username if agendamento.configurado_por else None,
        'fuso_horario': settings.TIME_ZONE,
        'agora': agora.astimezone(_fuso()),
        'agenda': agenda,
        'proximo_evento': proximo,
        'situacao': _situacao(agendamento, agenda, pi_online),
        'pi': {
            'online': pi_online,
            'ultimo_relato': agendamento.ultimo_relato,
            'estado_processo': agendamento.estado_processo,
            'deve_executar': agendamento.deve_executar_pi,
            'mensagem': agendamento.mensagem_pi,
            'ultimo_inicio': agendamento.ultimo_inicio,
            'ultimo_encerramento': agendamento.ultimo_encerramento,
            'versao_aplicada': agendamento.versao_aplicada,
            'configuracao_aplicada': agendamento.versao_aplicada == agendamento.versao,
        },
    }


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def agendamento_monitoramento(request):
    camera = _camera()
    if not camera:
        return _sem_camera()
    agendamento = _obter_agendamento(camera)

    if request.method == 'PUT':
        if not request.user.can_manage_apiarios():
            return Response(
                {'error': 'Apenas dono ou gestor podem alterar o agendamento do monitoramento.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = AgendamentoSerializer(agendamento, data=request.data)
        serializer.is_valid(raise_exception=True)
        dados = serializer.validated_data
        mudou = any(getattr(agendamento, campo) != valor for campo, valor in dados.items())
        if mudou:
            for campo, valor in dados.items():
                setattr(agendamento, campo, valor)
            agendamento.versao += 1
            agendamento.configurado_em = timezone.now()
            agendamento.configurado_por = request.user
            agendamento.save(update_fields=[
                'habilitado', 'hora_inicio', 'hora_fim', 'versao', 'configurado_em', 'configurado_por',
            ])
            logger.info('Agendamento do monitoramento alterado por %s: %s (versão %s)',
                        request.user.username, agendamento, agendamento.versao)

    return Response(_serializar(agendamento))


def _data_do_relato(valor):
    if not valor:
        return None
    data = parse_datetime(str(valor))
    if data is None:
        return None
    if timezone.is_naive(data):
        data = timezone.make_aware(data, _fuso())
    return data


def _notificar_falha(camera, estado, mensagem):
    rotulo = dict(AgendamentoMonitoramento.ESTADO_CHOICES)[estado]
    titulo = f'Monitoramento: {rotulo.lower()}'
    # O Pi tenta de novo com backoff; uma falha que se repete notifica no máximo uma vez por janela
    if Notificacao.objects.filter(
        titulo=titulo, tipo='manutencao', created_at__gte=timezone.now() - INTERVALO_NOTIFICACAO_FALHA,
    ).exists():
        return
    texto = f'{rotulo} no Raspberry Pi "{camera.nome}".'
    if mensagem:
        texto += f' Motivo: {mensagem}'
    Notificacao.objects.bulk_create([
        Notificacao(titulo=titulo, mensagem=texto,
                    tipo='manutencao', prioridade='alta', usuario=usuario)
        for usuario in _usuarios_alerta_ativos()
    ])


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def sincronizar_pi(request):
    """
    Chamado pelo agendador do Pi (header X-Camera-Token, mesmo token da
    câmera). Recebe o estado real do processo e devolve a configuração.

    POST /api/monitoramento/pi/
    {
        "estado": "executando",            # um de AgendamentoMonitoramento.ESTADO_CHOICES
        "deve_executar": true,
        "mensagem": "",
        "versao_aplicada": 3,
        "ultimo_inicio": "2026-10-19T07:00:02-03:00",
        "ultimo_encerramento": null
    }
    """
    token = request.headers.get('X-Camera-Token', '')
    camera = Camera.objects.filter(token=token).first() if token else None
    if not camera or not _iguais(camera.token, token):
        return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

    agendamento = _obter_agendamento(camera)
    dados = request.data if isinstance(request.data, dict) else {}
    estado_anterior = agendamento.estado_processo

    estado = dados.get('estado')
    if estado in dict(AgendamentoMonitoramento.ESTADO_CHOICES):
        agendamento.estado_processo = estado
    deve_executar = dados.get('deve_executar')
    if isinstance(deve_executar, bool):
        agendamento.deve_executar_pi = deve_executar
    agendamento.mensagem_pi = str(dados.get('mensagem') or '')[:500]
    try:
        agendamento.versao_aplicada = int(dados['versao_aplicada'])
    except (KeyError, TypeError, ValueError):
        pass
    # O Pi pode ter reiniciado e esquecido os horários: só sobrescreve o que vier
    for campo in ('ultimo_inicio', 'ultimo_encerramento'):
        data = _data_do_relato(dados.get(campo))
        if data:
            setattr(agendamento, campo, data)
    agendamento.ultimo_relato = timezone.now()
    agendamento.save(update_fields=[
        'estado_processo', 'deve_executar_pi', 'mensagem_pi', 'versao_aplicada',
        'ultimo_inicio', 'ultimo_encerramento', 'ultimo_relato',
    ])

    if agendamento.estado_processo != estado_anterior:
        logger.info('Monitoramento no Pi "%s": %s -> %s %s', camera.nome, estado_anterior,
                    agendamento.estado_processo, agendamento.mensagem_pi)
        if agendamento.estado_processo in ESTADOS_FALHA:
            _notificar_falha(camera, agendamento.estado_processo, agendamento.mensagem_pi)

    return Response({
        'habilitado': agendamento.habilitado,
        'hora_inicio': agendamento.hora_inicio.strftime(FORMATO_HORA),
        'hora_fim': agendamento.hora_fim.strftime(FORMATO_HORA),
        'versao': agendamento.versao,
        'fuso_horario': settings.TIME_ZONE,
    })
