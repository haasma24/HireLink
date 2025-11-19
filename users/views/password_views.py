from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from users.models import CustomUser

class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email requis."}, status=400)
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({"message": "Si l’email existe, un lien a été envoyé."})
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = PasswordResetTokenGenerator().make_token(user)
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
        send_mail(
            "Réinitialisation du mot de passe",
            f"Cliquez ici pour réinitialiser votre mot de passe : {reset_link}",
            settings.DEFAULT_FROM_EMAIL,
            [email],
        )
        return Response({"message": "Email envoyé."})

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request, uid, token):
        password = request.data.get("password")
        password2 = request.data.get("password2")
        if password != password2:
            return Response({"error": "Les mots de passe ne correspondent pas."}, status=400)
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = CustomUser.objects.get(pk=user_id)
        except:
            return Response({"error": "Lien invalide."}, status=400)
        if not PasswordResetTokenGenerator().check_token(user, token):
            return Response({"error": "Lien expiré ou invalide."}, status=400)
        user.set_password(password)
        user.save()
        return Response({"message": "Mot de passe réinitialisé avec succès."})
