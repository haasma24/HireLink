# recruiter/applications_views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from applications.models import Application, ApplicationStatusLog
from applications.serializers import ApplicationSerializer
from jobs.models import Job
import logging

logger = logging.getLogger(__name__)


def is_recruiter(user) -> bool:
    """
    Helper: check if user is recruiter.
    Adapte si ton User.role est différent.
    """
    return getattr(user, "role", None) == "recruiter"


# 1) Toutes les candidatures des jobs du recruiter
class RecruiterApplicationListView(generics.ListAPIView):
    """
    Recruiter: list all applications for jobs posted by the recruiter.
    """
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "job"]
    ordering_fields = ["applied_at", "updated_at"]
    ordering = ["-applied_at"]

    def get_queryset(self):
        user = self.request.user
        if not is_recruiter(user):
            return Application.objects.none()

        # IMPORTANT: Job.posted_by -> CustomUser
        return (
            Application.objects
            .filter(job__posted_by=user)
            .select_related("candidate", "job")
        )


# 2) Candidatures pour un job précis du recruiter
class RecruiterJobApplicationListView(generics.ListAPIView):
    """
    Recruiter: list applications for a specific job he posted.
    """
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status"]
    ordering_fields = ["applied_at", "updated_at"]
    ordering = ["-applied_at"]

    def get_queryset(self):
        user = self.request.user
        job_id = self.kwargs.get("job_id")

        if not is_recruiter(user):
            return Application.objects.none()

        try:
            # Job appartient à ce recruiter (champ posted_by)
            job = Job.objects.get(id=job_id, posted_by=user)
        except Job.DoesNotExist:
            return Application.objects.none()

        return (
            Application.objects
            .filter(job=job)
            .select_related("candidate", "job")
        )


# 3) Détail d’une candidature (lecture seule côté recruiter)
class RecruiterApplicationDetailView(generics.RetrieveAPIView):
    """
    Recruiter: view details of a specific application for his jobs.
    """
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not is_recruiter(user):
            return Application.objects.none()

        return (
            Application.objects
            .filter(job__posted_by=user)
            .select_related("candidate", "job")
        )


# 4) Changer le statut d’une candidature (recruiter)
class RecruiterApplicationStatusUpdateView(APIView):
    """
    Recruiter: update status of an application for his job.
    Exemple de body:
    {
        "status": "shortlisted",
        "reason": "Good profile"
    }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        if not is_recruiter(user):
            return Response(
                {"detail": "Not allowed."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            application = Application.objects.get(
                id=pk,
                job__posted_by=user,  # ici aussi posted_by
            )
        except Application.DoesNotExist:
            return Response(
                {"detail": "Application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("status")
        reason = request.data.get("reason", "")

        if not new_status:
            return Response(
                {"detail": "Status is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status not in dict(Application.STATUS_CHOICES):
            return Response(
                {"detail": "Invalid status value."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = application.status
        application.status = new_status
        application.save()

        ApplicationStatusLog.objects.create(
            application=application,
            old_status=old_status,
            new_status=new_status,
            changed_by=user,
            reason=reason,
        )

        logger.info(
            f"[RECRUITER] Application {application.id} status "
            f"{old_status} -> {new_status} by {user.username}"
        )

        serializer = ApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)
