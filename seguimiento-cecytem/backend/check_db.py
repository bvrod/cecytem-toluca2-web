import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from academico.models import Alumno, Grupo

User = get_user_model()

print("=== USUARIOS EN LA BD ===")
for u in User.objects.all():
    print(f"ID: {u.id}, Username: {u.username}, Nombre: {u.get_full_name()}, is_staff: {u.is_staff}")

print("\n=== ALUMNOS EN LA BD ===")
for a in Alumno.objects.all():
    print(f"Alumno: {a.user.username}, Grupo: {a.grupo}")

print("\n=== GRUPOS EN LA BD ===")
for g in Grupo.objects.all():
    print(f"Grupo: {g}")
