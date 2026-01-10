from rest_framework import serializers
from .models import Job, JobApplication, SavedJob

class JobSerializer(serializers.ModelSerializer):
    posted_by = serializers.StringRelatedField()
    is_saved = serializers.SerializerMethodField()
    has_applied = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'company', 'location',
            'salary_min', 'salary_max', 'salary_currency',
            'job_type', 'experience_level', 'posted_by',
            'is_active', 'application_deadline', 'created_at',
            'required_skills', 'preferred_skills',
            'is_saved', 'has_applied'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'posted_by']
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedJob.objects.filter(job=obj, user=request.user).exists()
        return False
    
    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return JobApplication.objects.filter(job=obj, applicant=request.user).exists()
        return False

class JobCreateUpdateSerializer(serializers.ModelSerializer):  # ADD THIS CLASS
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'company', 'location',
            'salary_min', 'salary_max', 'salary_currency',
            'job_type', 'experience_level', 'is_active',
            'application_deadline', 'required_skills', 'preferred_skills'
        ]
    
    def validate(self, data):
        if data.get('salary_min') and data.get('salary_max'):
            if data['salary_min'] > data['salary_max']:
                raise serializers.ValidationError(
                    {"salary": "Minimum salary cannot be greater than maximum salary."}
                )
        return data

class JobApplicationSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    applicant = serializers.StringRelatedField()
    
    class Meta:
        model = JobApplication
        fields = [
            'id', 'job', 'applicant', 'status',
            'cover_letter', 'resume', 'applied_at', 'updated_at'
        ]
        read_only_fields = ['id', 'applied_at', 'updated_at']

class JobApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ['id', 'job', 'cover_letter', 'resume']
        read_only_fields = ['id']
    
    def validate(self, data):
        request = self.context.get('request')
        job = data.get('job')
        
        if JobApplication.objects.filter(job=job, applicant=request.user).exists():
            raise serializers.ValidationError(
                {"detail": "You have already applied for this job."}
            )
        
        return data

class SavedJobSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    
    class Meta:
        model = SavedJob
        fields = ['id', 'job', 'saved_at']

class JobSearchSerializer(serializers.Serializer):
    """Serializer for job search parameters"""
    keyword = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    job_type = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    experience_level = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    salary_min = serializers.IntegerField(required=False, min_value=0)
    salary_max = serializers.IntegerField(required=False, min_value=0)
    company = serializers.CharField(required=False, allow_blank=True)
    sort_by = serializers.CharField(required=False, default='-created_at')
    page = serializers.IntegerField(required=False, default=1)
    page_size = serializers.IntegerField(required=False, default=10)
