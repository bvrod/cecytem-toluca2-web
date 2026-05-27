from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.url_patterns if hasattr(admin.site, 'url_patterns') else admin.site.urls),
    path('api/auth/', include('autenticacion.urls')),
    path('api/academico/', include('academico.urls')),
    path('api/seguimiento/', include('seguimiento.urls')),
]