from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

Usuario = get_user_model()

# Personalizamos el Serializer del Token para que incluya los datos del usuario en la respuesta del Login
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Inyectamos datos de identidad básicos en el payload
        token['username'] = user.username
        token['email'] = user.email
        
        # ── DETERMINACIÓN DE ROL INSTITUCIONAL ──
        if user.is_superuser:
            token['rol'] = 'ADMIN'
        elif user.is_staff and not user.is_superuser:
            token['rol'] = 'DOCENTE'
        else:
            token['rol'] = 'ALUMNO'
            
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        
        # Estructura limpia para la respuesta directa de la petición HTTP
        # Esto evitará que el frontend asuma el rol de ALUMNO por defecto
        if user.is_superuser:
            user_role = 'ADMIN'
        elif user.is_staff and not user.is_superuser:
            user_role = 'DOCENTE'
        else:
            user_role = 'ALUMNO'

        data['usuario'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'nombre_completo': f"{user.first_name} {user.last_name}".strip(),
            'rol': user_role,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
        }
        return data

# Serializer estándar para mostrar o crear usuarios si es necesario
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol']