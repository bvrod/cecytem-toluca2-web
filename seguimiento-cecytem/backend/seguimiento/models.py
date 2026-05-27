import uuid
from django.db import models 
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from academico.models import Grupo, Materia, Alumno

class AsignacionDocente(models.Model):
    # Relacionamos con el Usuario, asegurando que solo los que tengan rol 'DOCENTE' puedan asignarse
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='asignaciones'
    )
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE, related_name='asignaciones')
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name='asignaciones')
    fecha_asignacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Esto cumple con la regla de negocio: no duplicar la terna Docente-Materia-Grupo
        unique_together = ('docente', 'materia', 'grupo')
        ordering = ['-fecha_asignacion']

    def clean(self):
        # RN3: Solo docentes pueden tener asignaciones
        if not (self.docente.is_staff or self.docente.is_superuser):
            raise ValidationError(
                "Solo usuarios con rol de Docente pueden ser asignados a materias."
            )
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.docente.get_full_name()} -> {self.materia.nombre} [{self.grupo}]"


class Actividad(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False) if 'uuid' in dir() else models.AutoField(primary_key=True)
    # Si prefieres UUID importa 'import uuid' arriba. Para mantenerlo simple usaremos AutoField por ahora:
    asignacion = models.ForeignKey(AsignacionDocente, on_delete=models.CASCADE, related_name='actividades')
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    semana = models.IntegerField()  # 1 a 16
    mes = models.IntegerField()     # 1 a 4
    fecha_limite = models.DateTimeField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Semana {self.semana} - {self.titulo} ({self.asignacion.materia.nombre})"


class Cumplimiento(models.Model):
    actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE, related_name='cumplimientos')
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='cumplimientos')
    entregado = models.BooleanField(default=False)
    fecha_registro = models.DateTimeField(auto_now=True)

    class Meta:
        # Un alumno solo puede tener un registro de cumplimiento por actividad
        unique_together = ('actividad', 'alumno')

    def clean(self):
        # RN15: Bloqueo de modificaciones pasados los 7 días naturales del vencimiento
        if self.actividad.fecha_limite + timedelta(days=7) < timezone.now():
            raise ValidationError(
                "Regla de Negocio Violada (RN15): El periodo de 7 días para modificar el cumplimiento de esta actividad ha expirado."
            )

    def save(self, *args, **kwargs):
        # Forzar la ejecución de la validación clean antes de guardar en la BD
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        estado = "CUMPLIÓ" if self.entregado else "NO CUMPLIÓ"
        return f"{self.alumno.user.username} - {self.actividad.titulo}: {estado}"