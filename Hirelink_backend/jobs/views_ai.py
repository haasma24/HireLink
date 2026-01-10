# jobs/views_ai.py
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response

from jobs.models import JobApplication
from hirelink_ai_email.model import EmailContext, generate_email  # adapte le chemin si besoin


class GenerateApplicationEmailView(APIView):
    """
    Génère un email (refus / relance / invitation) pour une candidature donnée,
    en utilisant le module IA OpenRouter (model.py).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, application_id):
        user = request.user

        # Sécurité : seul le recruteur propriétaire du job
        if getattr(user, "role", None) != "recruiter":
            return Response(
                {"detail": "Seuls les recruteurs peuvent générer ces emails."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            application = JobApplication.objects.select_related("job", "applicant").get(
                id=application_id,
                job__posted_by=user,
            )
        except JobApplication.DoesNotExist:
            return Response(
                {"detail": "Candidature introuvable ou non autorisée."},
                status=status.HTTP_404_NOT_FOUND,
            )

        email_type = (request.data.get("type") or "").lower()
        interview_date = request.data.get("interview_date") or None

        if email_type not in ("refus", "relance", "invitation"):
            return Response(
                {"detail": "Type d'email invalide (refus | relance | invitation)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Construire le contexte pour ton EmailContext
        ctx = EmailContext(
            candidate_name=application.applicant.full_name
            or application.applicant.username,
            candidate_email=application.applicant.email,
            job_title=application.job.title,
            company_name=application.job.company,
            application_date=application.applied_at.date().isoformat(),
            interview_date=interview_date,
            email_type=email_type,  # type: ignore[arg-type]
            language="fr",
            tone="professionnel",
        )

        try:
            body = generate_email(ctx)  # ta fonction actuelle renvoie le corps de l'email
        except Exception as e:
            return Response(
                {"detail": f"Erreur lors de l'appel IA : {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Ici tu peux générer un sujet simple côté backend
        if email_type == "refus":
            subject = f"Retour sur votre candidature - {application.job.title}"
        elif email_type == "relance":
            subject = f"Suivi de votre candidature - {application.job.title}"
        else:  # invitation
            subject = f"Invitation à un entretien - {application.job.title}"

        return Response(
            {
                "subject": subject,
                "body": body,
            },
            status=status.HTTP_200_OK,
        )
