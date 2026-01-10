# Hirelink_backend/users/views/auth_views.py
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from django.contrib.auth import login
from rest_framework_simplejwt.tokens import RefreshToken
from users.serializers import LoginSerializer

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Connexion réussie.",
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
            "user_id": user.id,
            "role": user.role,
        })

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Déconnexion réussie."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"error": "Token invalide."}, status=status.HTTP_400_BAD_REQUEST)
