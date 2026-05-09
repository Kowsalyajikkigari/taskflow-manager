from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with a role field for RBAC."""

    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        MEMBER = 'MEMBER', 'Member'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.MEMBER,
    )

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN
