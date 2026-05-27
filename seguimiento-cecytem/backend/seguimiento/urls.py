# seguimiento/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AsignacionDocenteViewSet, ActividadViewSet, CumplimientoViewSet

router = DefaultRouter()
router.register(r'asignaciones', AsignacionDocenteViewSet)
router.register(r'actividades', ActividadViewSet)
router.register(r'cumplimiento', CumplimientoViewSet)

# REVISA QUE ESTA VARIABLE ESTÉ BIEN ESCRITA
urlpatterns = [
    path('', include(router.urls)),
]