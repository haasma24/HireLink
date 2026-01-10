# users/views/admin_views.py
"""from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from users.models import CustomUser

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def validate_recruiter(request, recruiter_id):
    try:
        user = CustomUser.objects.get(id=recruiter_id, role='recruiter')
        user.is_validated = True
        user.save()
        login_url = "http://127.0.0.1:3000/login/"  # or production URL
        subject = "Votre compte recruteur a été validé"
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = user.email
        text_content = "Bonjour, votre compte recruteur a été validé. Connectez-vous sur votre espace."
        html_content = f"""
#<html>...</html> # Same as original code snippet
"""
        msg = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        return Response({"message": "Compte validé et email envoyé."})
    except CustomUser.DoesNotExist:
        return Response({"error": "Recruteur non trouvé."}, status=404)
"""




# users/views/admin_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from users.models import CustomUser
from users.serializers.user_serializer import UserSerializer


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def list_recruiters(request):
    """
    Liste tous les utilisateurs ayant role = 'recruiter'.
    Tu peux filtrer sur is_validated si besoin.
    """
    qs = CustomUser.objects.filter(role='recruiter').select_related('entreprise')
    # Pour n'afficher que ceux en attente:
    # qs = qs.filter(is_validated=False)

    serializer = UserSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def validate_recruiter(request, recruiter_id):
    try:
        user = CustomUser.objects.get(id=recruiter_id, role='recruiter')
        user.is_validated = True
        user.save()
        login_url = "http://127.0.0.1:3000/login/"
        subject = "Votre compte recruteur a été validé"
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = user.email
        text_content = (
            "Bonjour, votre compte recruteur a été validé. "
            "Connectez-vous sur votre espace."
        )
        html_content = f"""
<html>
  <body>
    <p>Bonjour {user.full_name or ''},</p>
    <p>Votre compte recruteur sur <strong>HireLink</strong> a été validé.</p>
    <p>Vous pouvez maintenant vous connecter à votre espace recruteur en cliquant sur le lien ci-dessous :</p>
    <p><a href="{login_url}">{login_url}</a></p>
    <p>Cordialement,<br>L’équipe HireLink</p>
  </body>
</html>
"""

        msg = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        return Response({"message": "Compte validé et email envoyé."})
    except CustomUser.DoesNotExist:
        return Response({"error": "Recruteur non trouvé."}, status=404)
