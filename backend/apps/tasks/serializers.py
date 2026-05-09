from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Task

User = get_user_model()


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    assignee_name = serializers.CharField(
        source='assignee.username', read_only=True, default=None,
    )
    created_by_name = serializers.CharField(
        source='created_by.username', read_only=True,
    )

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'status', 'priority',
            'assignee', 'assignee_name', 'created_by_name',
            'due_date', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class TaskDetailSerializer(serializers.ModelSerializer):
    """Full serializer with all fields."""
    assignee_name = serializers.CharField(
        source='assignee.username', read_only=True, default=None,
    )
    created_by_name = serializers.CharField(
        source='created_by.username', read_only=True,
    )
    project_name = serializers.CharField(
        source='project.name', read_only=True,
    )

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'status', 'priority',
            'project', 'project_name', 'assignee', 'assignee_name',
            'created_by', 'created_by_name', 'due_date',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def validate(self, attrs):
        """Ensure assignee is a project member (works for both create & update)."""
        assignee = attrs.get('assignee')
        if assignee is None and self.instance:
            # assignee not being changed
            assignee = self.instance.assignee

        if assignee is not None:
            project = attrs.get('project') or (self.instance.project if self.instance else None)
            if project and not project.members.filter(id=assignee.id).exists():
                raise serializers.ValidationError(
                    {"assignee": "Assignee must be a member of the project."}
                )
        return attrs
