import django_filters
from django.db import models

from .models import Task


class TaskFilter(django_filters.FilterSet):
    """
    Available query params:
        ?project=1           — tasks in project 1
        ?status=todo         — tasks with status 'todo'
        ?priority=high       — tasks with priority 'high'
        ?assignee=3          — tasks assigned to user 3
        ?assignee_isnull=true— unassigned tasks
        ?created_by=2        — tasks created by user 2
        ?due_date_before=2026-06-01  — tasks due before this date
        ?due_date_after=2026-05-01   — tasks due after this date
    """
    due_date_before = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')
    due_date_after = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')

    class Meta:
        model = Task
        fields = {
            'project': ['exact'],
            'status': ['exact'],
            'priority': ['exact'],
            'assignee': ['exact', 'isnull'],
            'created_by': ['exact'],
        }
