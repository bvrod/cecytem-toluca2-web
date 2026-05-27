# academico/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GrupoViewSet, MateriaViewSet, AlumnoViewSet

router = DefaultRouter()
router.register(r'grupos', GrupoViewSet)
router.register(r'materias', MateriaViewSet)
router.register(r'alumnos', AlumnoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]