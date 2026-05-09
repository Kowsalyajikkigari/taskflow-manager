from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """Only users with role=ADMIN can access."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class IsAdminOrReadOnly(BasePermission):
    """Admin can do anything; others can only read."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_admin


class IsProjectMember(BasePermission):
    """User must be a member of the project to access it."""
    def has_object_permission(self, request, view, obj):
        return (
            obj.members.filter(id=request.user.id).exists()
            or request.user.is_admin
        )


class IsProjectCreatorOrAdmin(BasePermission):
    """Only the project creator (or an admin) can modify/delete the project."""
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.created_by == request.user or request.user.is_admin


class IsTaskCreatorOrAssigneeOrAdmin(BasePermission):
    """
    Read: any project member or admin.
    Write: only the task creator, assigned user, or admin.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return (
                obj.project.members.filter(id=request.user.id).exists()
                or request.user.is_admin
            )
        return (
            obj.created_by == request.user
            or obj.assignee == request.user
            or request.user.is_admin
        )
