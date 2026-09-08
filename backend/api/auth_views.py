from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.contrib.auth import get_user_model

from .serializers import UsuarioSerializer, UsuarioListSerializer, UsuarioProfileSerializer, UsuarioCreateSerializer

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Registro de novo usuário"""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    role = request.data.get('role', 'apicultor')
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Usuário já existe'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'E-mail já cadastrado'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=role,
        first_name=request.data.get('first_name', ''),
        last_name=request.data.get('last_name', ''),
        telefone=request.data.get('telefone', ''),
    )
    
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UsuarioSerializer(user).data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login de usuário"""
    username = (request.data.get('username') or request.data.get('email') or '').strip()
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Usuário/e-mail e senha são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(request=request, username=username, password=password)

    if user is None:
        identifier = username.lower()
        normalized_user = None

        if '@' in identifier:
            normalized_user = User.objects.filter(email__iexact=username).first()
        else:
            normalized_user = User.objects.filter(username__iexact=username).first()

        if normalized_user:
            user = authenticate(
                request=request,
                username=normalized_user.get_username(),
                password=password,
            )
    
    if user is None or not user.is_active:
        return Response(
            {'error': 'Credenciais inválidas'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Atualiza último acesso
    user.ultimo_acesso = timezone.now()
    user.save(update_fields=['ultimo_acesso'])
    
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UsuarioSerializer(user).data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Retorna informações do usuário logado"""
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Atualiza perfil do usuário logado.

    Usa UsuarioProfileSerializer (não UsuarioSerializer) de propósito: só
    autoatendimento de dados pessoais é permitido aqui. role, ativo,
    is_staff e is_superuser não podem ser alterados por este endpoint --
    mesmo que venham no payload, são ignorados silenciosamente (não fazem
    parte dos fields do serializer, então nunca chegam em validated_data).
    """
    user = request.user
    serializer = UsuarioProfileSerializer(user, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        # Retorna a representação completa (papel, permissões etc.) para o
        # frontend manter o AuthContext consistente após o update.
        return Response(UsuarioSerializer(user).data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar usuários (apenas Dono e Gestor)"""
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        if user.can_manage_users():
            return User.objects.all()
        return User.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        if self.action == 'list':
            return UsuarioListSerializer
        return UsuarioSerializer

    def create(self, request, *args, **kwargs):
        # get_queryset() só protege list/retrieve/update/destroy (todos
        # passam por get_object(), que filtra pelo queryset). create() não
        # usa get_queryset() -- sem este check, qualquer usuário autenticado
        # poderia criar contas via POST /usuarios/, papel incluído.
        if not request.user.can_manage_users():
            return Response(
                {'error': 'Sem permissão para criar usuários'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)

