# applications/views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Count
from django.utils import timezone
from .models import Application, Interview, Notification, ApplicationStatusLog
from .serializers import (
    ApplicationSerializer, InterviewSerializer, 
    NotificationSerializer, ApplicationCreateSerializer
)
from jobs.serializers import JobSerializer
from jobs.models import Job  # Import Job from jobs app
import logging

logger = logging.getLogger(__name__)

# YOUR CORE APPLICATION WORKFLOW VIEWS
class ApplicationListView(generics.ListCreateAPIView):
    """Candidates can view their applications and apply to jobs"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['applied_at', 'updated_at']
    ordering = ['-applied_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ApplicationCreateSerializer
        return ApplicationSerializer
    
    def get_queryset(self):
        # Candidates can only see their own applications
        return Application.objects.filter(candidate=self.request.user).select_related('job', 'job__posted_by')  # Changed from recruiter to posted_by
    
    def perform_create(self, serializer):
        application = serializer.save()
        
        # Create notification for recruiter - use job.posted_by
        if application.job.posted_by:
            Notification.objects.create(
                user=application.job.posted_by,  # Changed from job.recruiter to job.posted_by
                notification_type='application_submitted',
                title='New Application Received',
                message=f"{application.candidate.full_name} applied for {application.job.title}",
                related_application=application
            )
        
        logger.info(f"Application created: {application.id} by {self.request.user.username}")

class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Candidates can view and withdraw their applications"""
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Application.objects.filter(candidate=self.request.user)
    
    def perform_destroy(self, instance):
        if instance.status not in ['applied', 'under_review']:
            raise serializers.ValidationError("Cannot withdraw application in current status")
        instance.delete()

class InterviewListView(generics.ListCreateAPIView):
    """Candidates can view their scheduled interviews"""
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['interview_type']
    ordering_fields = ['scheduled_date']
    ordering = ['scheduled_date']
    
    def get_queryset(self):
        return Interview.objects.filter(application__candidate=self.request.user).select_related('application', 'application__job')

class NotificationListView(generics.ListAPIView):
    """Candidates can view their notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user, is_read=False)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})

class ApplicationStatsView(APIView):
    """Candidates can view their application statistics"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        applications = Application.objects.filter(candidate=request.user)
        
        stats = {
            'total_applications': applications.count(),
            'by_status': dict(applications.values_list('status').annotate(count=Count('id')).values_list('status', 'count')),
            'recent_applications': applications.filter(applied_at__gte=timezone.now()-timezone.timedelta(days=30)).count(),
            'upcoming_interviews': Interview.objects.filter(
                application__candidate=request.user, 
                scheduled_date__gte=timezone.now()
            ).count(),
        }
        
        return Response(stats)

# Webhook for status updates (for recruiters/AI to call)
class ApplicationStatusWebhook(APIView):
    """Webhook for other systems to update application status"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, application_id):
        try:
            application = Application.objects.get(id=application_id)
            
            # Verify the user has permission to update this application
            if request.user.role != 'recruiter' or application.job.posted_by != request.user:  # Changed from job.recruiter to job.posted_by
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            new_status = request.data.get('status')
            reason = request.data.get('reason', '')
            
            if new_status not in dict(Application.STATUS_CHOICES):
                return Response(
                    {'error': 'Invalid status'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update status and create log
            old_status = application.status
            application.status = new_status
            application.save()
            
            ApplicationStatusLog.objects.create(
                application=application,
                old_status=old_status,
                new_status=new_status,
                changed_by=request.user,
                reason=reason
            )
            
            # Create notification for candidate
            Notification.objects.create(
                user=application.candidate,
                notification_type='application_status',
                title='Application Status Updated',
                message=f"Your application for {application.job.title} is now {new_status}",
                related_application=application
            )
            
            return Response({
                'message': 'Status updated successfully',
                'new_status': new_status
            })
            
        except Application.DoesNotExist:
            return Response(
                {'error': 'Application not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )