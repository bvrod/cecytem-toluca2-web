from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import (
    AsignacionDocente, Actividad, Cumplimiento,
    ComputadoraSala, RegistroAccesoSala, Incidencia,
)
from .serializers import (
    AsignacionDocenteSerializer, ActividadSerializer, CumplimientoSerializer,
    ComputadoraSalaSerializer, RegistroAccesoSalaSerializer, IncidenciaSerializer,
)


class AsignacionDocenteViewSet(viewsets.ModelViewSet):
    queryset = AsignacionDocente.objects.all()
    serializer_class = AsignacionDocenteSerializer
    permission_classes = [IsAuthenticated]


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
    @action(detail=False, methods=['post'], url_path='registrar_lote')
    def registrar_lote(self, request):
        actividad_id = request.data.get('actividad_id')
        evaluaciones = request.data.get('evaluaciones', [])  # Arreglo de {alumno_id, entregado}

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

        registros_actualizados = 0
        for item in evaluaciones:
            alumno_id = item.get('alumno_id')
            entregado = item.get('entregado', False)

            Cumplimiento.objects.update_or_create(
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
    @action(detail=False, methods=['post'], url_path='guardar_asistencia')
    def guardar_asistencia(self, request):
        actividad_id = request.data.get('actividad_id')
        asistencias = request.data.get('asistencias', {})

        if not actividad_id:
            return Response({"error": "Falta actividad_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            actividad = Actividad.objects.get(id=actividad_id)
        except Actividad.DoesNotExist:
            return Response({"error": "Actividad no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        if actividad.fecha_limite + timedelta(days=7) < timezone.now():
            return Response({"error": "Periodo de 7 días pasado"}, status=status.HTTP_400_BAD_REQUEST)

        registros_guardados = 0
        errores = []

        for alumno_id_str, presente in asistencias.items():
            try:
                alumno_id = int(alumno_id_str)
                Cumplimiento.objects.update_or_create(
                    actividad=actividad,
                    alumno_id=alumno_id,
                    defaults={'entregado': presente}
                )
                registros_guardados += 1
            except (ValueError, Exception) as e:
                errores.append(f"Alumno {alumno_id_str}: {str(e)}")

        return Response({
            "status": "success",
            "registros_guardados": registros_guardados,
            "errores": errores,
            "timestamp": timezone.now()
        }, status=status.HTTP_200_OK)


class ComputadoraSalaViewSet(viewsets.ModelViewSet):
    queryset = ComputadoraSala.objects.all()
    serializer_class = ComputadoraSalaSerializer
    # CAMBIO: antes usaba get_permissions() para exigir IsAuthenticated en
    # escritura (PATCH/POST/DELETE) y solo dejaba GET libre. El encargado
    # todavía no tiene un login que autentique de verdad contra este backend,
    # así que esas escrituras fallaban con 401. Lo dejamos abierto por ahora
    # (ver nota de seguridad que te mandé en el mensaje anterior).
    permission_classes = [AllowAny]

    def perform_broadcast(self, action, instance):
        try:
            channel_layer = get_channel_layer()
            data = ComputadoraSalaSerializer(instance).data
            async_to_sync(channel_layer.group_send)(
                'sala',
                {'type': 'sala.update', 'payload': {'action': action, 'computadora': data}}
            )
        except Exception:
            pass

    def create(self, request, *args, **kwargs):
        resp = super().create(request, *args, **kwargs)
        try:
            instancia = self.get_queryset().get(pk=resp.data.get('id'))
            self.perform_broadcast('create', instancia)
        except Exception:
            pass
        return resp

    def update(self, request, *args, **kwargs):
        resp = super().update(request, *args, **kwargs)
        try:
            instancia = self.get_object()
            self.perform_broadcast('update', instancia)
        except Exception:
            pass
        return resp

    def partial_update(self, request, *args, **kwargs):
        resp = super().partial_update(request, *args, **kwargs)
        try:
            instancia = self.get_object()
            self.perform_broadcast('update', instancia)
        except Exception:
            pass
        return resp

    def destroy(self, request, *args, **kwargs):
        instancia = self.get_object()
        pk = instancia.pk
        resp = super().destroy(request, *args, **kwargs)
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)('sala', {'type': 'sala.update', 'payload': {'action': 'delete', 'computadora': {'id': pk}}})
        except Exception:
            pass
        return resp


class RegistroAccesoSalaViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = RegistroAccesoSala.objects.all().order_by('-fecha')
    serializer_class = RegistroAccesoSalaSerializer
    # CAMBIO: antes era IsAuthenticated (incluso para el GET, que es lo que
    # el PanelEncargado consulta cada 6 segundos) — por eso veías 401
    # repetidos en consola y el historial nunca cargaba.
    permission_classes = [AllowAny]


class IncidenciaViewSet(viewsets.ModelViewSet):
    queryset = Incidencia.objects.all()
    serializer_class = IncidenciaSerializer
    # Nuevo endpoint: los alumnos reportan desde el kiosko (a veces sin haber
    # iniciado sesión) y el encargado necesita leer/actualizar sin tener aún
    # un login real contra este backend — por eso AllowAny en las 4 acciones.
    permission_classes = [AllowAny]