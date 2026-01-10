# applications/serializers.py
from rest_framework import serializers
from .models import Application, Interview, ApplicationStatusLog, Notification
from jobs.models import Job  # Import from jobs app
from jobs.serializers import JobSerializer  # Import JobSerializer
from django.utils import timezone

# YOUR Application Serializers
class ApplicationSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company', read_only=True)  # Changed from job.recruiter to job.company
    posted_by_name = serializers.CharField(source='job.posted_by.full_name', read_only=True)  # New field
    
    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ('candidate', 'applied_at', 'updated_at')
    
    def validate(self, attrs):
        if self.instance is None:  # Creation only
            job = attrs.get('job')
            candidate = self.context['request'].user
            
            # Check if already applied
            if job.applications.filter(applicant=candidate).exists():  # Changed from application_set
                raise serializers.ValidationError("You have already applied for this job")
            
            # Check application deadline
            if job.application_deadline and job.application_deadline < timezone.now().date():
                raise serializers.ValidationError("Application deadline has passed")
        
        return attrs

class ApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ('job', 'cover_letter', 'resume')
    
    def create(self, validated_data):
        validated_data['candidate'] = self.context['request'].user
        return super().create(validated_data)

class InterviewSerializer(serializers.ModelSerializer):
    application_details = ApplicationSerializer(source='application', read_only=True)
    interviewer_name = serializers.CharField(source='interviewer.full_name', read_only=True)
    candidate_name = serializers.CharField(source='application.candidate.full_name', read_only=True)
    job_title = serializers.CharField(source='application.job.title', read_only=True)
    
    class Meta:
        model = Interview
        fields = '__all__'
    
    def validate_scheduled_date(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Interview must be scheduled for a future date")
        return value

class ApplicationStatusLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)
    
    class Meta:
        model = ApplicationStatusLog
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('user', 'created_at')