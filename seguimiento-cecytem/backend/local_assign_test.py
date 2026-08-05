import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()
from autenticacion.models import Usuario
from academico.models import Materia, Grupo
from seguimiento.models import AsignacionDocente
from seguimiento.serializers import AsignacionDocenteSerializer

# Pick an existing DOCENTE user and existing materia/grupo
usuario = Usuario.objects.filter(rol='DOCENTE').first()
print('docente', usuario and str(usuario.id), usuario and usuario.username)
mat = Materia.objects.first()
gp = Grupo.objects.first()
print('materia', mat and mat.id, 'grupo', gp and gp.id)

if usuario and mat and gp:
    data = {'docente': str(usuario.id), 'materia': mat.id, 'grupo': gp.id}
    serializer = AsignacionDocenteSerializer(data=data)
    print('serializer valid?', serializer.is_valid())
    print('errors', serializer.errors)
    if serializer.is_valid():
        asign = serializer.save()
        print('saved', asign.id)
        asign.delete()
