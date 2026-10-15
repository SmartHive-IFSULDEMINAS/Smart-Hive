"""
Câmera ao vivo sob demanda (Raspberry Pi 5 + MediaMTX).

Fluxo:
  1. A aba do frontend chama `ligar/`, que cria um `EspectadorCamera` (uma
     sessão por aba) e devolve o id da sessão. A aba renova com `renovar/` a
     cada 30s e encerra com `desligar/` ao sair.
  2. O Pi, atrás de NAT, consulta `pi/estado/` a cada poucos segundos e só
     transmite (RTSP -> MediaMTX) enquanto houver alguma sessão não expirada.
  3. O MediaMTX pergunta a `mediamtx-auth/` se cada conexão pode publicar
     (Pi, pela senha = token da câmera) ou assistir (usuário, pelo JWT).

Sessões têm duração máxima (CAMERA_SESSAO_MAX_MINUTOS) para que uma aba
esquecida aberta não deixe a câmera transmitindo indefinidamente.
"""
import hashlib
import hmac
import logging
import uuid
from datetime import timedelta
from urllib.parse import parse_qs

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import Camera, EspectadorCamera

logger = logging.getLogger(__name__)

# A aba renova a cada 30s; com 90s de folga, perder um heartbeat não derruba o stream
DURACAO_SESSAO = timedelta(seconds=90)
# O Pi consulta a cada ~3s, mas só gravamos o contato a cada 10s (poupa
# escritas no SQLite); acima de 30s sem contato consideramos offline
INTERVALO_GRAVAR_CONTATO = timedelta(seconds=10)
PI_ONLINE_JANELA = timedelta(seconds=30)
# Sessões expiradas há mais que isso são apagadas quando alguém liga a câmera
LIMPAR_SESSOES_APOS = timedelta(hours=1)
# O MediaMTX chama o webhook a cada requisição HLS (várias por segundo por
# espectador com LL-HLS). Autorizações de leitura positivas ficam em cache
# por alguns segundos para não martelar o Django/SQLite; o custo é que um
# espectador que perdeu o acesso ainda pode ver até esse tempo a mais.
CACHE_LEITURA_S = 10


def _sessao_max():
    return timedelta(minutes=getattr(settings, 'CAMERA_SESSAO_MAX_MINUTOS', 30))


def _iguais(a, b):
    """Comparação em tempo constante (evita timing attack em tokens/segredos)."""
    return bool(a) and bool(b) and hmac.compare_digest(str(a), str(b))


def _camera():
    return Camera.objects.first()


def _serializar(camera, espectador=None):
    agora = timezone.now()
    dados = {
        'id': camera.id,
        'nome': camera.nome,
        'ativa': camera.ativa,
        'espectadores': camera.espectadores_ativos().count(),
        'pi_online': bool(
            camera.ultimo_contato_pi and agora - camera.ultimo_contato_pi < PI_ONLINE_JANELA
        ),
        'ultimo_contato_pi': camera.ultimo_contato_pi,
        'hls_url': f'/camera/{camera.caminho_stream}/index.m3u8',
        'sessao_max_minutos': int(_sessao_max().total_seconds() // 60),
    }
    if espectador:
        dados['sessao'] = str(espectador.sessao)
        dados['sessao_termina_em'] = espectador.iniciada_em + _sessao_max()
    return dados


def _sem_camera():
    return Response(
        {'error': 'Nenhuma câmera cadastrada. Cadastre uma no Django Admin.'},
        status=status.HTTP_404_NOT_FOUND,
    )


def _sessao_do_request(request):
    """UUID da sessão enviado no corpo, ou None se ausente/inválido."""
    try:
        return uuid.UUID(str(request.data.get('sessao', '')))
    except ValueError:
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status_camera(request):
    camera = _camera()
    if not camera:
        return _sem_camera()
    return Response(_serializar(camera))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ligar_camera(request):
    """Abre uma sessão de espectador para esta aba."""
    camera = _camera()
    if not camera:
        return _sem_camera()

    agora = timezone.now()
    EspectadorCamera.objects.filter(expira_em__lt=agora - LIMPAR_SESSOES_APOS).delete()
    espectador = EspectadorCamera.objects.create(
        camera=camera,
        usuario=request.user,
        iniciada_em=agora,
        expira_em=agora + DURACAO_SESSAO,
    )
    return Response(_serializar(camera, espectador))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def renovar_camera(request):
    """
    Heartbeat da aba. Responde 409 com `motivo` quando a sessão não pode ser
    renovada: `sessao_inexistente` (expirou ou foi encerrada; a aba pode
    chamar `ligar/` de novo) ou `tempo_esgotado` (atingiu a duração máxima;
    a aba deve pedir uma ação explícita do usuário para continuar).
    """
    sessao = _sessao_do_request(request)
    if not sessao:
        return Response({'error': 'sessao inválida'}, status=status.HTTP_400_BAD_REQUEST)

    agora = timezone.now()
    espectador = EspectadorCamera.objects.filter(
        sessao=sessao, usuario=request.user, expira_em__gt=agora,
    ).select_related('camera').first()
    if not espectador:
        return Response({'motivo': 'sessao_inexistente'}, status=status.HTTP_409_CONFLICT)

    if agora - espectador.iniciada_em >= _sessao_max():
        espectador.delete()
        return Response({'motivo': 'tempo_esgotado'}, status=status.HTTP_409_CONFLICT)

    EspectadorCamera.objects.filter(pk=espectador.pk).update(expira_em=agora + DURACAO_SESSAO)
    return Response(_serializar(espectador.camera, espectador))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def desligar_camera(request):
    """Encerra só a sessão desta aba; outros espectadores continuam assistindo."""
    sessao = _sessao_do_request(request)
    if not sessao:
        return Response({'error': 'sessao inválida'}, status=status.HTTP_400_BAD_REQUEST)

    apagados, _ = EspectadorCamera.objects.filter(sessao=sessao, usuario=request.user).delete()
    if not apagados:
        return Response({'error': 'Sessão não encontrada'}, status=status.HTTP_404_NOT_FOUND)

    camera = _camera()
    return Response(_serializar(camera) if camera else {})


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def estado_pi(request):
    """Consultado pelo Pi. Autentica pelo header X-Camera-Token."""
    token = request.headers.get('X-Camera-Token', '')
    camera = Camera.objects.filter(token=token).first() if token else None
    if not camera or not _iguais(camera.token, token):
        return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

    agora = timezone.now()
    if not camera.ultimo_contato_pi or agora - camera.ultimo_contato_pi >= INTERVALO_GRAVAR_CONTATO:
        Camera.objects.filter(pk=camera.pk).update(ultimo_contato_pi=agora)

    return Response({
        'transmitir': camera.ativa,
        'caminho_stream': camera.caminho_stream,
    })


def _usuario_do_jwt(raw):
    """Usuário ativo dono do JWT, ou None."""
    if not raw:
        return None
    auth = JWTAuthentication()
    try:
        usuario = auth.get_user(auth.get_validated_token(raw))
    except (InvalidToken, TokenError, AuthenticationFailed):
        return None
    if not usuario.is_active or not getattr(usuario, 'ativo', True):
        return None
    return usuario


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def mediamtx_auth(request):
    """
    Webhook de autenticação do MediaMTX (authMethod: http). Responde 200 para
    liberar e 401 para negar. O MediaMTX não manda headers customizados, então
    o segredo compartilhado vai na query string (MTX_AUTHHTTPADDRESS). O nginx
    também bloqueia este endpoint para acesso externo.
    """
    negado = Response(status=status.HTTP_401_UNAUTHORIZED)
    liberado = Response(status=status.HTTP_200_OK)

    segredo = getattr(settings, 'MEDIAMTX_AUTH_SECRET', '')
    if not segredo:
        logger.warning('MEDIAMTX_AUTH_SECRET não configurado: câmera ao vivo bloqueada')
        return negado
    if not _iguais(request.query_params.get('segredo'), segredo):
        return negado

    camera = Camera.objects.filter(caminho_stream=request.data.get('path', '')).first()
    # Sem ninguém assistindo, nada é liberado (nem o Pi publicar)
    if not camera or not camera.ativa:
        return negado

    acao = request.data.get('action')

    if acao == 'publish':
        if request.data.get('user') == 'camera' and _iguais(request.data.get('password'), camera.token):
            return liberado
        logger.warning('Publicação negada no caminho %s (credenciais inválidas)', camera.caminho_stream)
        return negado

    if acao == 'read':
        # JWT vem do header Authorization: Bearer (campo `token`) ou, como
        # alternativa, da query string `?jwt=` repassada pelo MediaMTX
        jwt = request.data.get('token') or parse_qs(request.data.get('query') or '').get('jwt', [''])[0]
        if not jwt:
            return negado
        chave = 'camera-leitura:' + hashlib.sha256(f'{camera.pk}:{jwt}'.encode()).hexdigest()
        if cache.get(chave):
            return liberado
        if not _usuario_do_jwt(jwt):
            return negado
        cache.set(chave, True, CACHE_LEITURA_S)
        return liberado

    return negado
