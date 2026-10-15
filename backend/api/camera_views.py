"""
Câmera ao vivo sob demanda (Raspberry Pi 5 + MediaMTX).

Fluxo:
  1. A aba do frontend chama `ligar/` (e repete como heartbeat), o que empurra
     `Camera.ativa_ate` para o futuro.
  2. O Pi, atrás de NAT, consulta `pi/estado/` a cada poucos segundos e só
     transmite (RTSP -> MediaMTX) enquanto a sessão estiver ativa.
  3. O MediaMTX pergunta a `mediamtx-auth/` se cada conexão pode publicar
     (Pi, pela senha = token da câmera) ou assistir (usuário, pelo JWT).
"""
from datetime import timedelta
from urllib.parse import parse_qs

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import Camera

# A aba renova a cada 30s; com 90s de folga, perder um heartbeat não derruba o stream
DURACAO_SESSAO = timedelta(seconds=90)
# O Pi consulta a cada ~3s; acima disso consideramos offline
PI_ONLINE_JANELA = timedelta(seconds=15)


def _camera():
    return Camera.objects.first()


def _serializar(camera):
    agora = timezone.now()
    return {
        'id': camera.id,
        'nome': camera.nome,
        'ativa': camera.ativa,
        'ativa_ate': camera.ativa_ate,
        'pi_online': bool(
            camera.ultimo_contato_pi and agora - camera.ultimo_contato_pi < PI_ONLINE_JANELA
        ),
        'ultimo_contato_pi': camera.ultimo_contato_pi,
        'hls_url': f'/camera/{camera.caminho_stream}/index.m3u8',
    }


def _sem_camera():
    return Response(
        {'error': 'Nenhuma câmera cadastrada. Cadastre uma no Django Admin.'},
        status=status.HTTP_404_NOT_FOUND,
    )


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
    """Liga a câmera ou renova a sessão (o frontend usa como heartbeat)."""
    camera = _camera()
    if not camera:
        return _sem_camera()
    camera.ativa_ate = timezone.now() + DURACAO_SESSAO
    camera.save(update_fields=['ativa_ate'])
    return Response(_serializar(camera))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def desligar_camera(request):
    camera = _camera()
    if not camera:
        return _sem_camera()
    camera.ativa_ate = None
    camera.save(update_fields=['ativa_ate'])
    return Response(_serializar(camera))


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def estado_pi(request):
    """Consultado pelo Pi. Autentica pelo header X-Camera-Token."""
    token = request.headers.get('X-Camera-Token', '')
    camera = Camera.objects.filter(token=token).first() if token else None
    if not camera:
        return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

    camera.ultimo_contato_pi = timezone.now()
    camera.save(update_fields=['ultimo_contato_pi'])
    return Response({
        'transmitir': camera.ativa,
        'caminho_stream': camera.caminho_stream,
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def mediamtx_auth(request):
    """
    Webhook de autenticação do MediaMTX (authMethod: http). Responde 200 para
    liberar e 401 para negar. O MediaMTX não manda headers customizados, então
    o segredo compartilhado vai na query string configurada em mediamtx.yml.
    """
    negado = Response(status=status.HTTP_401_UNAUTHORIZED)

    segredo = getattr(settings, 'MEDIAMTX_AUTH_SECRET', '')
    if not segredo or request.query_params.get('segredo') != segredo:
        return negado

    acao = request.data.get('action')
    camera = Camera.objects.filter(caminho_stream=request.data.get('path', '')).first()
    if not camera:
        return negado

    if acao == 'publish':
        if request.data.get('user') == 'camera' and request.data.get('password') == camera.token:
            return Response(status=status.HTTP_200_OK)
        return negado

    if acao == 'read':
        if not camera.ativa:
            return negado
        # JWT vem do header Authorization: Bearer (campo `token`) ou, como
        # alternativa, da query string `?jwt=` repassada pelo MediaMTX
        jwt = request.data.get('token') or parse_qs(request.data.get('query', '')).get('jwt', [''])[0]
        try:
            JWTAuthentication().get_validated_token(jwt)
        except (InvalidToken, TokenError):
            return negado
        return Response(status=status.HTTP_200_OK)

    return negado
