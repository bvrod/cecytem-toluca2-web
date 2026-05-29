from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q

from .models import AsignacionDocente, Actividad, Cumplimiento
from .serializers import AsignacionDocenteSerializer, ActividadSerializer, CumplimientoSerializer

class AsignacionDocenteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar AsignacionDocente (Docente-Materia-Grupo)
    RN3: Solo docentes (is_staff=True o is_superuser=True) pueden asignarse
    """
    queryset = AsignacionDocente.objects.all()
    serializer_class = AsignacionDocenteSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Crear asignación con validación de reglas de negocio"""
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

    # detail=False indica ruta de lista: /asignaciones/mis-asignaciones/
    @action(detail=False, methods=['get'], url_path='mis-asignaciones')
    def mis_asignaciones(self, request):
        """Retorna las asignaciones del docente autenticado."""
        docente = request.user
        asignaciones = AsignacionDocente.objects.filter(docente=docente)
        serializer = self.get_serializer(asignaciones, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='stats-globales')
    def stats_globales(self, request):
        """Estadísticas globales simples basadas en asignaciones."""
        total_alumnos = AsignacionDocente.objects.aggregate(total=Count('grupo__alumnos'))['total'] or 0
        porcentaje_general = 0
        # Aquí se pueden expandir cálculos más complejos si es necesario
        return Response({"total_alumnos": total_alumnos, "porcentaje_general": porcentaje_general})


class ActividadViewSet(viewsets.ModelViewSet):
    queryset = Actividad.objects.all()
    serializer_class = ActividadSerializer
    permission_classes = [IsAuthenticated]

    # Endpoint dinámico para filtrar actividades por asignación (Docente-Grupo-Materia)
    def get_queryset(self):
        queryset = Actividad.objects.all()
        asignacion_id = self.request.query_params.get('asignacion', None)
        if asignacion_id is not None:
            queryset = queryset.filter(asignacion_id=asignacion_id)
        return queryset


class CumplimientoViewSet(viewsets.ModelViewSet):
    queryset = Cumplimiento.objects.all()
    serializer_class = CumplimientoSerializer
    permission_classes = [IsAuthenticated]

    # POST /api/seguimiento/cumplimiento/registrar_lote/
    @action(detail=False, methods=['post'])
    def registrar_lote(self, request):
        actividad_id = request.data.get('actividad_id')
        evaluaciones = request.data.get('evaluaciones', []) # Arreglo de {alumno_id, entregado}

        if not actividad_id or not evaluaciones:
            return Response({"error": "Faltan parámetros requeridos: actividad_id o evaluaciones."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            actividad = Actividad.objects.get(id=actividad_id)
        except Actividad.DoesNotExist:
            return Response({"error": "La actividad especificada no existe."}, status=status.HTTP_404_NOT_FOUND)

        # Validación RN15: Bloqueo de 7 días naturales pasados del vencimiento
        if actividad.fecha_limite + timedelta(days=7) < timezone.now():
            return Response({
                "error": "BusinessRuleViolation",
                "detail": "No se pueden registrar o modificar cumplimientos. Pasaron más de 7 días desde el vencimiento.",
                "code": "ERR_TIME_LOCK_ACTIVE"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Procesar los datos masivos en lote de forma transaccional o iterativa segura
        registros_actualizados = 0
        for item in evaluaciones:
            alumno_id = item.get('alumno_id')
            entregado = item.get('entregado', False)

            cumplimiento, created = Cumplimiento.objects.update_or_create(
                actividad=actividad,
                alumno_id=alumno_id,
                defaults={'entregado': entregado}
            )
            registros_actualizados += 1

        return Response({
            "status": "success",
            "registros_actualizados": registros_actualizados,
            "timestamp": timezone.now()
        }, status=status.HTTP_200_OK)

    # POST /api/seguimiento/cumplimiento/guardar_asistencia/
    @action(detail=False, methods=['post'])
    def guardar_asistencia(self, request):
        """Guardar asistencia y evaluaciones de un grupo para una actividad"""
        actividad_id = request.data.get('actividad_id')
        asistencias = request.data.get('asistencias', {})  # { alumno_id: true/false }
        evaluaciones = request.data.get('evaluaciones', {})  # { alumno_id: calificacion }

        if not actividad_id:
            return Response({"error": "Falta actividad_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            actividad = Actividad.objects.get(id=actividad_id)
        except Actividad.DoesNotExist:
            return Response({"error": "Actividad no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        # Validación RN15
        if actividad.fecha_limite + timedelta(days=7) < timezone.now():
            return Response({
                "error": "BusinessRuleViolation",
                "detail": "Periodo de 7 días pasado"
            }, status=status.HTTP_400_BAD_REQUEST)

        registros_guardados = 0
        errores = []

        # Guardar asistencias (como cumplimiento = entregado)
        for alumno_id_str, presente in asistencias.items():
            try:
                alumno_id = int(alumno_id_str)
                cumplimiento, _ = Cumplimiento.objects.update_or_create(
                    actividad=actividad,
                    alumno_id=alumno_id,
                    defaults={'entregado': presente}
                )
                registros_guardados += 1
            except (ValueError, Cumplimiento.DoesNotExist) as e:
                errores.append(f"Alumno {alumno_id_str}: {str(e)}")

        return Response({
            "status": "success",
            "registros_guardados": registros_guardados,
            "errores": errores,
            "timestamp": timezone.now()
        }, status=status.HTTP_200_OK)
