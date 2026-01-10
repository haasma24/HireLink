# jobs/views_recruiter.py 
from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response

from .models import JobApplication
from .serializers import JobApplicationSerializer


class RecruiterApplicationsView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        apps = JobApplication.objects.select_related('job', 'applicant').filter(
            job__posted_by=request.user
        ).order_by('-applied_at')

        serializer = JobApplicationSerializer(apps, many=True)
        return Response({"applications": serializer.data})
