"""
Management command to ensure a superuser exists in production.

Runs idempotently — safe to call on every deploy.
Reads credentials from environment variables.

Usage:
    DJANGO_SUPERUSER_USERNAME=admin \\
    DJANGO_SUPERUSER_EMAIL=admin@example.com \\
    DJANGO_SUPERUSER_PASSWORD=securepassword \\
    python manage.py ensure_superuser
"""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

UserModel = get_user_model()


class Command(BaseCommand):
    help = "Ensure a superuser exists (create if missing, update password if changed)"

    def handle(self, *args, **options):
        username = os.getenv("DJANGO_SUPERUSER_USERNAME")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

        if not all([username, email, password]):
            self.stdout.write(
                self.style.WARNING(
                    "Skipping: DJANGO_SUPERUSER_USERNAME, "
                    "DJANGO_SUPERUSER_EMAIL, and DJANGO_SUPERUSER_PASSWORD "
                    "must all be set as environment variables."
                )
            )
            return

        user, created = UserModel.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
            },
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' created."))
        elif not user.check_password(password):
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Password updated for '{username}'."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' already exists."))
