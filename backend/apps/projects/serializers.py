from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Project

User = get_user_model()


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    member_count = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = (
            'id', 'name', 'description', 'created_by',
            'member_count', 'task_count', 'created_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at')


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Full serializer with member details."""
    members = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        required=False,
    )
    member_count = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = (
            'id', 'name', 'description', 'created_by',
            'members', 'member_count', 'task_count',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def create(self, validated_data):
        """Auto-add creator as a member on project creation."""
        members = validated_data.pop('members', [])
        project = Project.objects.create(**validated_data)
        project.members.add(project.created_by)  # creator is always a member
        project.members.add(*members)
        return project
