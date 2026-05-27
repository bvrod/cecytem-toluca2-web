from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class Grupo(models.Model):
    CARRERAS_CHOICES = [
        ('LOGISTICA', 'Logística'),
        ('CIENCIA_DATOS', 'Ciencia de Datos'),
        ('ANIMACION_DIGITAL', 'Animación Digital'),
    ]
    
    TURNOS_CHOICES = [
        ('Matutino', 'Matutino'),
        ('Vespertino', 'Vespertino'),
    ]
    
    semestre = models.IntegerField()  # Del 1 al 6
    grupo_letra = models.CharField(max_length=10)  # Ej: "A", "B", "TOL-II"
    carrera = models.CharField(max_length=20, choices=CARRERAS_CHOICES)
    turno = models.CharField(max_length=20, choices=TURNOS_CHOICES, default='Matutino')

    class Meta:
        ordering = ['semestre', 'carrera', 'grupo_letra']
        unique_together = ('semestre', 'grupo_letra', 'carrera', 'turno')

    def clean(self):
        # RN1: Semestre 1 solo para Logística y Ciencia de Datos
        if self.semestre == 1 and self.carrera not in ['LOGISTICA', 'CIENCIA_DATOS']:
            raise ValidationError(
                "El semestre 1 solo permite las carreras de Logística y Ciencia de Datos."
            )
        # RN2: Animación Digital solo en semestres 4 y 6
        if self.carrera == 'ANIMACION_DIGITAL' and self.semestre not in [4, 6]:
            raise ValidationError(
                "Animación Digital solo está disponible en 4to y 6to semestre."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.semestre}° '{self.grupo_letra}' - {self.get_carrera_display()} ({self.turno})"


class Materia(models.Model):
    nombre = models.CharField(max_length=150)
    clave = models.CharField(max_length=50, unique=True)
    creditos = models.IntegerField(default=0)  # Créditos de la materia

    class Meta:
        ordering = ['clave']

    def __str__(self):
        return f"{self.clave} - {self.nombre} ({self.creditos} cr)"


class Alumno(models.Model):
    # Vincula al Alumno de forma directa uno a uno con sus credenciales de usuario (autenticacion)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='perfil_alumno')
    # Si se borra un grupo, se protege para no borrar en cascada a los alumnos inscritos
    grupo = models.ForeignKey(Grupo, on_delete=models.PROTECT, related_name='alumnos')
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['grupo', 'user__last_name']

    def __str__(self):
        return f"{self.user.username} - {self.user.get_full_name()} [{self.grupo}]"