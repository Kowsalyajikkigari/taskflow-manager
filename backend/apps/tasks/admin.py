from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'status', 'priority', 'assignee', 'created_by', 'due_date')
    list_filter = ('status', 'priority', 'project')
    search_fields = ('title', 'description')
    date_hierarchy = 'created_at'
