# core/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('autenticacion.urls')),
    path('api/academico/', include('academico.urls')),
    path('api/seguimiento/', include('seguimiento.urls')),
    
    # ➕ AGREGA ESTA LÍNEA (O como se llame la app que maneja las vistas de los alumnos)
    path('api/alumno/', include('academico.urls')), 
]