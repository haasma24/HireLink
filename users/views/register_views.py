from rest_framework import generics, permissions, status
from rest_framework.response import Response
from users.serializers import RegistrationSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class RegisterView(generics.CreateAPIView):
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.AllowAny]
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        if user.role == 'candidate':
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Inscription candidat réussie !",
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user_id": user.id,
                "dashboard": "/candidate/dashboard/"
            }, status=status.HTTP_201_CREATED)
        elif user.role == 'recruiter':
            return Response({
                "message": "Inscription recruteur reçue, en attente de validation par un administrateur.",
                "user_id": user.id
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                "message": "Inscription admin réussie.",
                "user_id": user.id
            }, status=status.HTTP_201_CREATED)
