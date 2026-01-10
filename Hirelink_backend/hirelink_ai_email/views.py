from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.mail import send_mail
from django.conf import settings

from .model import EmailContext, EmailType, generate_email


class GenerateEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data

        try:
            email_type: EmailType = data.get("email_type")
            ctx = EmailContext(
                candidate_name=data.get("candidate_name", ""),
                candidate_email=data.get("candidate_email", ""),
                job_title=data.get("job_title", ""),
                company_name=data.get("company_name", ""),
                application_date=data.get("application_date", ""),
                interview_date=data.get("interview_date") or None,
                email_type=email_type,
                language="en",
                tone="professional",
            )
        except Exception as e:
            return Response(
                {"detail": f"Invalid payload: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            email_body = generate_email(ctx)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"email_body": email_body}, status=status.HTTP_200_OK)


class SendEmailView(APIView):
    """
    Send a ready-to-send email to a candidate.

    Expected JSON payload:
    {
      "to": "candidate@example.com",
      "subject": "Developer position – Application update",
      "body": "Email body..."
    }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data

        to_email = data.get("to")
        subject = data.get("subject")
        body = data.get("body")

        if not to_email or not subject or not body:
            return Response(
                {"detail": "Fields 'to', 'subject' and 'body' are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[to_email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {"detail": f"Error while sending email: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"detail": "Email sent successfully."},
            status=status.HTTP_200_OK,
        )
