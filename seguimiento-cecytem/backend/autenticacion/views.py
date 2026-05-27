from rest_framework import viewsets, status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import CustomTokenObtainPairSerializer

Usuario = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet para listar usuarios (docentes, alumnos, etc)"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Usuario.objects.all()
        rol = self.request.query_params.get('rol', None)
        
        # Filtrar por rol si se proporciona
        if rol == 'DOCENTE':
            queryset = queryset.filter(is_staff=True) | queryset.filter(is_superuser=True)
        elif rol == 'ALUMNO':
            queryset = queryset.filter(is_staff=False, is_superuser=False)
        
        return queryset.values('id', 'username', 'email', 'first_name', 'last_name')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        return Response(list(queryset))