from django.contrib import admin
from .models import Alumno, Grupo, Materia  # Cambia los nombres si en tus models cambian

admin.site.register(Alumno)
admin.site.register(Grupo)
admin.site.register(Materia)