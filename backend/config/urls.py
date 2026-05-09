from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from apps.users import views as user_views
from apps.projects.views import ProjectViewSet
from apps.tasks.views import TaskViewSet

# ── DRF Router ─────────────────────────────────────────────────────

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    # Auth endpoints
    path('api/auth/register/', user_views.RegisterView.as_view(), name='register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('api/auth/profile/', user_views.ProfileView.as_view(), name='profile'),

    # User management
    path('api/users/', user_views.UserListView.as_view(), name='user-list'),

    # API endpoints (router)
    path('api/', include(router.urls)),

    # Admin
    path('admin/', admin.site.urls),
]
