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