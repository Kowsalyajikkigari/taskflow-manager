from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.core.permissions import IsAdmin

from django.contrib.auth import get_user_model

from apps.users.serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — anyone can register."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class ProfileView(generics.RetrieveAPIView):
    """GET /api/auth/profile/ — returns the logged-in user's info."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """GET /api/users/ — list all users (admin only, used for task assignment)."""
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
