from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EspecieAbelhaViewSet,
    ApiarioViewSet,
    ColmeiaViewSet,
    InspecaoViewSet,
    ProducaoMelViewSet,
    TratamentoViewSet,
    DashboardView
)

router = DefaultRouter()
router.register(r'especies', EspecieAbelhaViewSet, basename='especies')
router.register(r'apiarios', ApiarioViewSet, basename='apiarios')
router.register(r'colmeias', ColmeiaViewSet, basename='colmeias')
router.register(r'inspecoes', InspecaoViewSet, basename='inspecoes')
router.register(r'producoes', ProducaoMelViewSet, basename='producoes')
router.register(r'tratamentos', TratamentoViewSet, basename='tratamentos')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
