import os
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase


class CreatesuperuserFromEnvTest(TestCase):
    def test_create_superuser_from_environment_variables(self):
        User = get_user_model()
        username = 'admin_test'
        email = 'admin_test@example.com'
        password = 'StrongPassword123!'

        with patch.dict(
            os.environ,
            {
                'DJANGO_SUPERUSER_USERNAME': username,
                'DJANGO_SUPERUSER_EMAIL': email,
                'DJANGO_SUPERUSER_PASSWORD': password,
            },
            clear=False,
        ):
            call_command('createsuperuser_from_env')

        user = User.objects.get(username=username)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_active)
        self.assertEqual(user.email, email)
        self.assertEqual(user.rol, 'ADMIN')
        self.assertTrue(user.check_password(password))
