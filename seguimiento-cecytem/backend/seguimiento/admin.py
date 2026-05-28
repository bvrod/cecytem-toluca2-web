from django.contrib import admin
from .models import AsignacionDocente, Actividad, Cumplimiento  # Cambia por los nombres de tus modelos reales

admin.site.register(AsignacionDocente)
admin.site.register(Actividad)
admin.site.register(Cumplimiento)