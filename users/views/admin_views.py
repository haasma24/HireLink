from rest_framework.decorators import api_view, permission_classes
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
        html_content = f"""<html>...</html>""" # Same as original code snippet
        msg = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        return Response({"message": "Compte validé et email envoyé."})
    except CustomUser.DoesNotExist:
        return Response({"error": "Recruteur non trouvé."}, status=404)
