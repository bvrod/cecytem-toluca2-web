# academico/urls.py
from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from .views import GrupoViewSet, MateriaViewSet, AlumnoViewSet, docente_dashboard

router = DefaultRouter()
router.register(r'grupos', GrupoViewSet)
router.register(r'materias', MateriaViewSet)
router.register(r'alumnos', AlumnoViewSet)

urlpatterns = [
    re_path(r'^docentes/dashboard/?$', docente_dashboard, name='docentes-dashboard'),
    path('', include(router.urls)),
]