from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    EspecieAbelhaViewSet,
    ApiarioViewSet,
    ColmeiaViewSet,
    InspecaoViewSet,
    ProducaoMelViewSet,
    ColetaProdutoViewSet,
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
    DashboardComparativoView,
    DashboardPrevisaoView,
    ClassificacaoPolenViewSet,
    ContagemAbelhaViewSet,
)
from .auth_views import register, login, me, update_profile, UsuarioViewSet
from .iot_views import receber_dados_iot, importar_dados_iot_json, historico_sensores
from .apiario_iot_views import receber_dados_iot_apiario
from .deteccao_views import receber_deteccao_abelhas
from .log_views import registrar_navegacao, AuditLogViewSet
from .export_views import (
    export_apiarios,
    export_colmeias,
    export_producao,
    export_coletas_produto,
    export_financeiro,
)
from .ia_views import classificar_polen, status_modelos, importar_csv_polen

router = DefaultRouter()
router.register(r'especies', EspecieAbelhaViewSet, basename='especies')
router.register(r'apiarios', ApiarioViewSet, basename='apiarios')
router.register(r'colmeias', ColmeiaViewSet, basename='colmeias')
router.register(r'inspecoes', InspecaoViewSet, basename='inspecoes')
router.register(r'producoes', ProducaoMelViewSet, basename='producoes')
router.register(r'coletas-produto', ColetaProdutoViewSet, basename='coletas-produto')
router.register(r'logs', AuditLogViewSet, basename='logs')
router.register(r'tratamentos', TratamentoViewSet, basename='tratamentos')
router.register(r'custos', CustoViewSet, basename='custos')
router.register(r'receitas', ReceitaViewSet, basename='receitas')
router.register(r'fornecedores', FornecedorViewSet, basename='fornecedores')
router.register(r'equipamentos', EquipamentoViewSet, basename='equipamentos')
router.register(r'notificacoes', NotificacaoViewSet, basename='notificacoes')
router.register(r'usuarios', UsuarioViewSet, basename='usuarios')
router.register(r'ia/classificacoes', ClassificacaoPolenViewSet, basename='ia-classificacoes')
router.register(r'deteccoes-abelha', ContagemAbelhaViewSet, basename='deteccoes-abelha')

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
    path('dashboard/comparativo/', DashboardComparativoView.as_view(), name='dashboard_comparativo'),
    path('dashboard/previsao/', DashboardPrevisaoView.as_view(), name='dashboard_previsao'),
    # IoT endpoints - Colmeias
    path('iot/colmeia/dados/', receber_dados_iot, name='receber_dados_iot'),
    path('iot/colmeia/upload-json/', importar_dados_iot_json, name='importar_dados_iot_json'),
    path('iot/colmeia/historico/<str:colmeia_identificador>/', historico_sensores, name='historico_sensores'),
    # IoT endpoints - Apiários
    path('iot/apiario/dados/', receber_dados_iot_apiario, name='receber_dados_iot_apiario'),
    # Pipeline de visão computacional (SmartHive, repo separado) - contagem de abelhas/pólen
    path('iot/colmeia/deteccoes/', receber_deteccao_abelhas, name='receber_deteccao_abelhas'),
    # IA endpoints — classificação espectral de pólen
    path('ia/polen/classificar/', classificar_polen, name='ia_classificar_polen'),
    path('ia/polen/upload-csv/', importar_csv_polen, name='ia_importar_csv_polen'),
    path('ia/status/', status_modelos, name='ia_status_modelos'),
    # Export endpoints
    path('export/apiarios/', export_apiarios, name='export_apiarios'),
    path('export/colmeias/', export_colmeias, name='export_colmeias'),
    path('export/producao/', export_producao, name='export_producao'),
    path('export/coletas-produto/', export_coletas_produto, name='export_coletas_produto'),
    path('export/financeiro/', export_financeiro, name='export_financeiro'),
    # Log de navegação (evento explícito de troca de tela pelo frontend)
    path('log-navegacao/', registrar_navegacao, name='registrar_navegacao'),
]
