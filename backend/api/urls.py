from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    EspecieAbelhaViewSet,
    ApiarioViewSet,
    ColmeiaViewSet,
    InspecaoViewSet,
    ProducaoMelViewSet,
    TratamentoViewSet,
    DashboardView,
    CustoViewSet,
    ReceitaViewSet,
    FornecedorViewSet,
    EquipamentoViewSet,
    NotificacaoViewSet,
    DashboardFinanceiroView,
    DashboardSaudeView,
    DashboardProdutividadeView,
)
from .auth_views import register, login, me, update_profile, UsuarioViewSet
from .iot_views import receber_dados_iot, historico_sensores
from .apiario_iot_views import receber_dados_iot_apiario

router = DefaultRouter()
router.register(r'especies', EspecieAbelhaViewSet, basename='especies')
router.register(r'apiarios', ApiarioViewSet, basename='apiarios')
router.register(r'colmeias', ColmeiaViewSet, basename='colmeias')
router.register(r'inspecoes', InspecaoViewSet, basename='inspecoes')
router.register(r'producoes', ProducaoMelViewSet, basename='producoes')
router.register(r'tratamentos', TratamentoViewSet, basename='tratamentos')
router.register(r'custos', CustoViewSet, basename='custos')
router.register(r'receitas', ReceitaViewSet, basename='receitas')
router.register(r'fornecedores', FornecedorViewSet, basename='fornecedores')
router.register(r'equipamentos', EquipamentoViewSet, basename='equipamentos')
router.register(r'notificacoes', NotificacaoViewSet, basename='notificacoes')
router.register(r'usuarios', UsuarioViewSet, basename='usuarios')

urlpatterns = [
    path('', include(router.urls)),
    # Auth endpoints
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/me/', me, name='me'),
    path('auth/profile/', update_profile, name='update_profile'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Dashboard endpoints
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('dashboard/financeiro/', DashboardFinanceiroView.as_view(), name='dashboard_financeiro'),
    path('dashboard/saude/', DashboardSaudeView.as_view(), name='dashboard_saude'),
    path('dashboard/produtividade/', DashboardProdutividadeView.as_view(), name='dashboard_produtividade'),
    # IoT endpoints - Colmeias
    path('iot/colmeia/dados/', receber_dados_iot, name='receber_dados_iot'),
    path('iot/colmeia/historico/<str:colmeia_identificador>/', historico_sensores, name='historico_sensores'),
    # IoT endpoints - Apiários
    path('iot/apiario/dados/', receber_dados_iot_apiario, name='receber_dados_iot_apiario'),
]
