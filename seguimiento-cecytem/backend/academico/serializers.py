from rest_framework import serializers
from .models import Grupo, Materia, Alumno
from django.contrib.auth import get_user_model

Usuario = get_user_model()

class GrupoSerializer(serializers.ModelSerializer):
    total_alumnos = serializers.SerializerMethodField()
    carrera_display = serializers.CharField(source='get_carrera_display', read_only=True)
    turno_display = serializers.CharField(source='get_turno_display', read_only=True)

    class Meta:
        model = Grupo
        fields = ['id', 'semestre', 'grupo_letra', 'carrera', 'carrera_display', 'turno', 'turno_display', 'total_alumnos']
    
    def get_total_alumnos(self, obj):
        return obj.alumnos.count()

class MateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        fields = ['id', 'nombre', 'clave', 'creditos', 'semestre', 'carrera']

# Serializer anidado para ver los datos del usuario junto con el alumno
class AlumnoSerializer(serializers.ModelSerializer):
    matricula = serializers.CharField(source='user.username', read_only=True)
    nombre_completo = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    grupo_detalle = serializers.CharField(source='grupo.__str__', read_only=True)

    class Meta:
        model = Alumno
        fields = ['id', 'user', 'matricula', 'nombre_completo', 'email', 'grupo', 'grupo_detalle']