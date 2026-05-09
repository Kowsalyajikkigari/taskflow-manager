"""
Management command to ensure a superuser exists in production.

Runs idempotently — safe to call on every server start.
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

        self.stdout.write(f"[ensure_superuser] Checking env vars...")

        if not username:
            self.stdout.write(self.style.ERROR("  DJANGO_SUPERUSER_USERNAME is not set"))
        if not email:
            self.stdout.write(self.style.ERROR("  DJANGO_SUPERUSER_EMAIL is not set"))
        if not password:
            self.stdout.write(self.style.ERROR("  DJANGO_SUPERUSER_PASSWORD is not set"))

        if not all([username, email, password]):
            self.stdout.write(
                self.style.WARNING("Skipping: all three env vars must be set.")
            )
            return

        self.stdout.write(f"  Username : {username}")
        self.stdout.write(f"  Email    : {email}")
        self.stdout.write(f"  Password : {'*' * len(password)}")

        user, created = UserModel.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
            },
        )

        # Always ensure staff and superuser flags are set
        needs_save = False
        if not user.is_staff:
            user.is_staff = True
            needs_save = True
        if not user.is_superuser:
            user.is_superuser = True
            needs_save = True

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' created."))
        elif not user.check_password(password):
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Password updated for '{username}'."))
        elif needs_save:
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Staff flags updated for '{username}'."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' already exists."))
