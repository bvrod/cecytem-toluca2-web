from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.contrib.auth import get_user_model

from .models import Grupo, Materia, Alumno
from .serializers import GrupoSerializer, MateriaSerializer, AlumnoSerializer
from seguimiento.models import AsignacionDocente
from seguimiento.serializers import AsignacionDocenteSerializer

Usuario = get_user_model()

class GrupoViewSet(viewsets.ModelViewSet):
    queryset = Grupo.objects.all()
    serializer_class = GrupoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        docente_id = request.data.get('docente_id')
        materia_id = request.data.get('materia_id')
        
        grupo_data = {
            'grupo_letra': request.data.get('grupo_letra'),
            'semestre': request.data.get('semestre'),
            'carrera': request.data.get('carrera'),
            'turno': request.data.get('turno', 'Matutino')
        }
        
        serializer = self.get_serializer(data=grupo_data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                grupo_instancia = serializer.save()
                
                if docente_id and materia_id:
                    docente = Usuario.objects.get(id=docente_id)
                    materia = Materia.objects.get(id=materia_id)
                    
                    AsignacionDocente.objects.create(
                        docente=docente,
                        grupo=grupo_instancia,
                        materia=materia
                    )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class MateriaViewSet(viewsets.ModelViewSet):
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer
    permission_classes = [IsAuthenticated]

class AlumnoViewSet(viewsets.ModelViewSet):
    queryset = Alumno.objects.all()
    serializer_class = AlumnoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Alumno.objects.all()
        grupo_id = self.request.query_params.get('grupo')
        asignacion_id = self.request.query_params.get('asignacion')
        
        if asignacion_id:
            try:
                asignacion = AsignacionDocente.objects.get(id=asignacion_id)
                queryset = queryset.filter(grupo=asignacion.grupo)
            except AsignacionDocente.DoesNotExist:
                return queryset.none()
        elif grupo_id:
            queryset = queryset.filter(grupo_id=grupo_id)
        return queryset

    @action(detail=False, methods=['get'], url_path='resumen')
    def resumen(self, request):
        try:
            alumno = Alumno.objects.get(user=request.user)
            serializer = self.get_serializer(alumno)
            return Response({
                'status': 'success',
                'alumno': serializer.data
            })
        except Alumno.DoesNotExist:
            return Response({'error': 'No registrado como alumno'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='materias')
    def materias(self, request):
        try:
            alumno = Alumno.objects.get(user=request.user)
            materias = Materia.objects.filter(asignaciones__grupo=alumno.grupo).distinct()
            serializer = MateriaSerializer(materias, many=True)
            return Response({'status': 'success', 'materias': serializer.data})
        except Alumno.DoesNotExist:
            return Response({'error': 'No registrado como alumno'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def docente_dashboard(request):
    asignaciones = AsignacionDocente.objects.filter(docente=request.user)
    serializer = AsignacionDocenteSerializer(asignaciones, many=True)
    return Response(serializer.data)

class MisAsignacionesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        asignaciones = AsignacionDocente.objects.filter(docente=request.user)
        serializer = AsignacionDocenteSerializer(asignaciones, many=True)
        return Response(serializer.data)