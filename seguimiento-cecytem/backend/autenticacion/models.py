from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class Usuario(AbstractUser):
    # Usamos un identificador único seguro (UUID) en lugar de un ID secuencial numérico
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Definimos los roles del sistema según los requerimientos
    ROLES_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('DOCENTE', 'Docente'),
        ('ALUMNO', 'Alumno'),
    ]
    rol = models.CharField(max_length=10, choices=ROLES_CHOICES, default='ALUMNO')
    
    # Hacemos que el correo electrónico sea obligatorio y único
    email = models.EmailField(unique=True)

    # Nota: El campo nativo 'username' de Django lo usaremos para almacenar 
    # la matrícula o el número de empleado de forma única.

    def __str__(self):
        return f"{self.username} - {self.get_full_name()} ({self.rol})"