from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.contrib.auth import get_user_model
from .models import Grupo, Materia, Alumno
from .serializers import GrupoSerializer, MateriaSerializer, AlumnoSerializer
from seguimiento.models import AsignacionDocente
from seguimiento.serializers import AsignacionDocenteSerializer

Usuario = get_user_model()

class GrupoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD de Grupos con validación de reglas de negocio y asignación atómica:
    RN1: Semestre 1 solo para Logística y Ciencia de Datos
    RN2: Animación Digital solo en semestres 4 y 6
    
    Al crear un grupo, puede incluir docente_id y materia_id para crear
    automáticamente la AsignacionDocente correspondiente.
    """
    queryset = Grupo.objects.all()
    serializer_class = GrupoSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """
        Crear grupo con validación de reglas de negocio y asignación atómica.
        
        Payload esperado:
        {
            "grupo_letra": "A",
            "semestre": 1,
            "carrera": "LOGISTICA",
            "turno": "Matutino",
            "docente_id": 5,      # Optional pero recomendado
            "materia_id": 3       # Optional pero recomendado
        }
        """
        # Extraemos los IDs de docente y materia si vienen en el payload
        docente_id = request.data.get('docente_id')
        materia_id = request.data.get('materia_id')
        
        # Preparamos los datos para el serializer (sin docente_id ni materia_id)
        grupo_data = {
            'grupo_letra': request.data.get('grupo_letra'),
            'semestre': request.data.get('semestre'),
            'carrera': request.data.get('carrera'),
            'turno': request.data.get('turno', 'Matutino')
        }
        
        serializer = self.get_serializer(data=grupo_data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response(
                {"error": f"Validación fallida: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Usar transacción para garantizar atomicidad
        try:
            with transaction.atomic():
                # Guardar el grupo
                grupo_instancia = serializer.save()
                
                # Si se proporcionaron docente_id y materia_id, crear la asignación
                if docente_id and materia_id:
                    try:
                        docente = Usuario.objects.get(id=docente_id)
                        # Validar que el docente sea staff o superuser
                        if not (docente.is_staff or docente.is_superuser):
                            return Response(
                                {"error": "El usuario especificado no es un docente válido."}, 
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        
                        materia = Materia.objects.get(id=materia_id)
                        
                        # Crear la asignación
                        AsignacionDocente.objects.create(
                            docente=docente,
                            grupo=grupo_instancia,
                            materia=materia
                        )
                    except Usuario.DoesNotExist:
                        return Response(
                            {"error": "El docente especificado no existe."}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    except Materia.DoesNotExist:
                        return Response(
                            {"error": "La materia especificada no existe."}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    except Exception as e:
                        return Response(
                            {"error": f"Error al crear la asignación: {str(e)}"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {"error": f"Error guardando grupo: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        """Actualizar grupo con validación de reglas de negocio"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class MateriaViewSet(viewsets.ModelViewSet):
    """ViewSet para CRUD de Materias"""
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Crear materia"""
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class AlumnoViewSet(viewsets.ModelViewSet):
    """ViewSet para CRUD de Alumnos con filtrado por grupo"""
    queryset = Alumno.objects.all()
    serializer_class = AlumnoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar alumnos por grupo si se especifica en query params"""
        queryset = Alumno.objects.all()
        grupo_id = self.request.query_params.get('grupo', None)
        asignacion_id = self.request.query_params.get('asignacion', None)
        
        # Si viene el ID de la asignación, obtener el grupo de esa asignación
        if asignacion_id:
            try:
                asignacion = AsignacionDocente.objects.get(id=asignacion_id)
                queryset = queryset.filter(grupo=asignacion.grupo)
            except AsignacionDocente.DoesNotExist:
                pass
        # Si viene directamente el ID del grupo, filtrar por ese
        elif grupo_id:
            queryset = queryset.filter(grupo_id=grupo_id)
        
        return queryset


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def docente_dashboard(request):
    """Retorna las asignaciones del docente autenticado para el dashboard."""
    docente = request.user
    asignaciones = AsignacionDocente.objects.filter(docente=docente)
    serializer = AsignacionDocenteSerializer(asignaciones, many=True)
    return Response(serializer.data)
