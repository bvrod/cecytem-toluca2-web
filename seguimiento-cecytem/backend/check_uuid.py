import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','core.settings')
import django
django.setup()
from autenticacion.models import Usuario
for u in Usuario.objects.all()[:20]:
    s = str(u.id)
    print(repr(s), len(s), u.username, u.rol, u.is_staff, u.is_superuser)
