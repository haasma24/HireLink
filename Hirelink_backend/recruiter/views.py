# recruiter/views.py
from rest_framework import generics, permissions
from applications.models import Application  # adapt
from .serializers import RecruiterApplicationSerializer

class RecruiterApplicationDetailView(generics.RetrieveAPIView):
    serializer_class = RecruiterApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
      user = self.request.user
      return Application.objects.filter(
          job__posted_by=user
      ).select_related('candidate', 'job')
