from rest_framework import serializers
from .models import AsignacionDocente, Actividad, Cumplimiento
from academico.models import Grupo, Materia
from academico.serializers import AlumnoSerializer
from django.contrib.auth import get_user_model

Usuario = get_user_model()

class DocenteSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class MateriaSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        fields = ['id', 'nombre', 'clave', 'creditos']

class GrupoSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grupo
        fields = ['id', 'semestre', 'grupo_letra', 'carrera', 'turno']

class AsignacionDocenteSerializer(serializers.ModelSerializer):
    docente_detalle = DocenteSimpleSerializer(source='docente', read_only=True)
    materia_detalle = MateriaSimpleSerializer(source='materia', read_only=True)
    grupo_detalle = GrupoSimpleSerializer(source='grupo', read_only=True)
    nombre_docente = serializers.CharField(source='docente.get_full_name', read_only=True)
    nombre_materia = serializers.CharField(source='materia.nombre', read_only=True)
    nombre_grupo = serializers.SerializerMethodField(read_only=True)
    detalle_grupo = serializers.CharField(source='grupo.__str__', read_only=True)

    class Meta:
        model = AsignacionDocente
        fields = [
            'id', 
            'docente', 'nombre_docente', 'docente_detalle',
            'materia', 'nombre_materia', 'materia_detalle',
            'grupo', 'nombre_grupo', 'detalle_grupo', 'grupo_detalle',
            'fecha_asignacion'
        ]
    
    def get_nombre_grupo(self, obj):
        """Retorna un nombre legible del grupo: ej. '202 Logística' o '401'"""
        grupo = obj.grupo
        return f"{grupo.semestre}° {grupo.grupo_letra} - {grupo.get_carrera_display()}"


class ActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Actividad
        fields = '__all__'


class CumplimientoSerializer(serializers.ModelSerializer):
    alumno_detalle = AlumnoSerializer(source='alumno', read_only=True)

    class Meta:
        model = Cumplimiento
        fields = ['id', 'actividad', 'alumno', 'alumno_detalle', 'entregado', 'fecha_registro']