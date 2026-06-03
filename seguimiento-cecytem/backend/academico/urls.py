# academico/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GrupoViewSet, MateriaViewSet, AlumnoViewSet, docente_dashboard

router = DefaultRouter()
router.register(r'grupos',   GrupoViewSet,   basename='grupo')
router.register(r'materias', MateriaViewSet, basename='materia')
router.register(r'alumnos',  AlumnoViewSet,  basename='alumno')

urlpatterns = [
    path('docentes/dashboard/', docente_dashboard, name='docente-dashboard'),
    path('', include(router.urls)),
]