from django.apps import AppConfig


class SeguimientoConfig(AppConfig):
    name = 'seguimiento'
    def ready(self):
        # Importar handlers de signals para conectar señales al arrancar la app
        try:
            from . import signals  # noqa: F401
        except Exception:
            pass
