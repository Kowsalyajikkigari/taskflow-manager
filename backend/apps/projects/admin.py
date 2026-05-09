from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'member_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description')
    filter_horizontal = ('members',)

    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Members'
