import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from academico.models import Alumno, Grupo

User = get_user_model()

# Crear o actualizar usuario alumno de prueba
usuario_test, created = User.objects.get_or_create(
    username='alumno_test',
    defaults={
        'email': 'alumno@test.com',
        'first_name': 'Alumno',
        'last_name': 'Test',
        'is_staff': False,
        'is_active': True
    }
)

# Establecer contraseña
usuario_test.set_password('123456')
usuario_test.save()

# Obtener el grupo (si existe, sino crear uno)
grupo, grupo_created = Grupo.objects.get_or_create(
    semestre=2,
    grupo_letra='2',
    carrera='LOGISTICA',
    turno='Matutino'
)

# Crear o actualizar el perfil Alumno
alumno, alumno_created = Alumno.objects.get_or_create(
    user=usuario_test,
    defaults={'grupo': grupo}
)

print(f"✅ Usuario: {usuario_test.username}")
print(f"✅ Contraseña: 123456")
print(f"✅ Nombre: {usuario_test.get_full_name()}")
print(f"✅ Grupo: {alumno.grupo}")
print(f"✅ Es alumno: {not usuario_test.is_staff}")
