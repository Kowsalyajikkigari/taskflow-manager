from django.db import models
from django.conf import settings


class Project(models.Model):
    """A workspace that groups tasks together."""

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_projects',
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='projects',
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.name
