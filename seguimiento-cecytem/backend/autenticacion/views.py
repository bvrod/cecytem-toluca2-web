from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .serializers import UsuarioSerializer, CustomTokenObtainPairSerializer

Usuario = get_user_model()

# 💡 ESTA ES LA VISTA QUE FALTABA Y HACÍA TRUENAR EL SERVIDOR
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        rol_filtro = self.request.query_params.get('rol', None)
        
        if rol_filtro == 'DOCENTE':
            # Filtro flexible para que tus maestros viejos y nuevos aparezcan juntos
            return queryset.filter(is_superuser=False).exclude(username__contains='alumno')
        elif rol_filtro == 'ADMIN':
            return queryset.filter(is_superuser=True)
        elif rol_filtro == 'ALUMNO':
            return queryset.filter(is_staff=False, is_superuser=False)
            
        return queryset

    def create(self, request, *args, **kwargs):
        # Clonamos los datos para meter el seguro anti-admin
        data = request.data.copy()
        
        # 🚨 SEGURO: Forzamos que cualquier registro por este formulario no sea superusuario
        data['is_superuser'] = False
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)