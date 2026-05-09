from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Task
from .serializers import TaskListSerializer, TaskDetailSerializer
from .filters import TaskFilter
from apps.core.permissions import IsTaskCreatorOrAssigneeOrAdmin


class TaskViewSet(viewsets.ModelViewSet):
    """
    CRUD for tasks within projects.

    GET    /api/tasks/            — list tasks (filtered by project, status, etc.)
    POST   /api/tasks/            — create a task in a project
    GET    /api/tasks/<id>/       — task detail
    PUT    /api/tasks/<id>/       — update task (creator/assignee/admin)
    PATCH  /api/tasks/<id>/       — partial update (creator/assignee/admin)
    DELETE /api/tasks/<id>/       — delete task (creator/admin)

    Filters:
        ?project=<id>
        ?status=todo|in_progress|done
        ?priority=low|medium|high
        ?assignee=<user_id>
        ?assignee_isnull=true     — unassigned tasks
        ?created_by=<user_id>
        ?due_date_before=YYYY-MM-DD
        ?due_date_after=YYYY-MM-DD
        ?search=<keyword>
    """
    permission_classes = [IsAuthenticated]
    filterset_class = TaskFilter
    search_fields = ('title', 'description')
    ordering_fields = ('created_at', 'due_date', 'priority', 'status')
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Task.objects.select_related('project', 'assignee', 'created_by')
        # Admins see all tasks; regular users see tasks in their projects
        if not self.request.user.is_admin:
            qs = qs.filter(project__members=self.request.user)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        return TaskDetailSerializer

    def get_permissions(self):
        if self.action in ('create',):
            return [IsAuthenticated()]
        if self.action in ('retrieve', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsTaskCreatorOrAssigneeOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
