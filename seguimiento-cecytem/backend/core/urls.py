from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/academico/', include('academico.urls')),
    path('api/seguimiento/', include('seguimiento.urls')),
    path('api/auth/', include('autenticacion.urls')),
]