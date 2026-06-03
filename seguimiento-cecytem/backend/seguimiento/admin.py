from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import AsignacionDocente, Actividad, Cumplimiento

Usuario = get_user_model()

class AsignacionDocenteAdmin(admin.ModelAdmin):
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "docente":
            kwargs["queryset"] = Usuario.objects.filter(rol='DOCENTE')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

admin.site.register(AsignacionDocente, AsignacionDocenteAdmin)
admin.site.register(Actividad)
admin.site.register(Cumplimiento)