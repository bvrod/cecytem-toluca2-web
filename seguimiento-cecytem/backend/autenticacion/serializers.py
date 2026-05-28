from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

Usuario = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        
        # Determinación exacta del rol en el JWT
        if user.is_superuser:
            token['rol'] = 'ADMIN'
        elif user.is_staff:
            token['rol'] = 'DOCENTE'
        else:
            token['rol'] = 'ALUMNO'
            
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        
        if user.is_superuser:
            user_role = 'ADMIN'
        elif user.is_staff:
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


class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    rol = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Usuario
        # Asegúrate de incluir 'is_staff' para que Django lo maneje de forma nativa si es necesario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'rol', 'is_staff']

    def create(self, validated_data):
        # 1. Extraemos el rol virtual sin alterar los campos nativos de Django
        rol = validated_data.pop('rol', None)
        password = validated_data.pop('password', None)
        
        # 2. Si viene explícitamente como 'DOCENTE', marcamos su propiedad nativa de Django
        if rol == 'DOCENTE':
            validated_data['is_staff'] = True
            
        # 3. Creamos la instancia usando el manager nativo (esto evita que el usuario se corrompa)
        user = Usuario.objects.create(**validated_data)
        
        # 4. Encriptamos la contraseña con el algoritmo seguro de Django
        if password:
            user.set_password(password)
            user.save()
            
        return user