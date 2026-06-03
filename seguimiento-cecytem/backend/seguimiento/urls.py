# seguimiento/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AsignacionDocenteViewSet, ActividadViewSet, CumplimientoViewSet

router = DefaultRouter()
router.register(r'asignaciones', AsignacionDocenteViewSet, basename='asignacion')
router.register(r'actividades',  ActividadViewSet,          basename='actividad')
router.register(r'cumplimiento', CumplimientoViewSet,       basename='cumplimiento')

urlpatterns = [
    path('', include(router.urls)),
    # Las rutas @action (registrar_lote, guardar_asistencia) las genera
    # el router automáticamente — no hace falta declararlas aquí.
]