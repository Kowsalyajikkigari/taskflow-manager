from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count

from .models import Project
from .serializers import ProjectListSerializer, ProjectDetailSerializer
from apps.core.permissions import IsProjectMember, IsProjectCreatorOrAdmin


class ProjectViewSet(viewsets.ModelViewSet):
    """
    CRUD for projects.

    GET    /api/projects/          — list projects (admin: all, member: own)
    POST   /api/projects/          — create a project (any authenticated user)
    GET    /api/projects/<id>/     — project detail (members/admin)
    PUT    /api/projects/<id>/     — update project (creator/admin)
    PATCH  /api/projects/<id>/     — partial update (creator/admin)
    DELETE /api/projects/<id>/     — delete project (creator/admin)
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Project.objects.annotate(
            member_count=Count('members', distinct=True),
            task_count=Count('tasks', distinct=True),
        ).order_by('-created_at')
        # Admins see everything; regular users see only their projects
        if not self.request.user.is_admin:
            qs = qs.filter(members=self.request.user)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectDetailSerializer

    def get_permissions(self):
        if self.action in ('retrieve',):
            return [IsAuthenticated(), IsProjectMember()]
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsProjectCreatorOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
