import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Create a superuser from environment variables without hardcoding credentials.'

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.getenv('DJANGO_SUPERUSER_USERNAME')
        email = os.getenv('DJANGO_SUPERUSER_EMAIL')
        password = os.getenv('DJANGO_SUPERUSER_PASSWORD')

        if not username or not email or not password:
            self.stdout.write(self.style.WARNING('No se encontraron variables de entorno para crear el superusuario.'))
            return

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': 'Administrador',
                'last_name': 'Sistema',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
                'rol': 'ADMIN',
            },
        )

        if not created:
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.email = email
            user.rol = 'ADMIN'
            user.save(update_fields=['is_staff', 'is_superuser', 'is_active', 'email', 'rol'])

        user.set_password(password)
        user.save(update_fields=['password'])

        self.stdout.write(self.style.SUCCESS(f'Superusuario listo: {user.username}'))
