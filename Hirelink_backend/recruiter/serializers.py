# recruiter/serializers.py
from rest_framework import serializers
from applications.models import Application  # ou ton chemin réel

class RecruiterApplicationSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(
        source='candidate.fullname',
        read_only=True
    )
    candidate_email = serializers.EmailField(
        source='candidate.email',
        read_only=True
    )
    job_title = serializers.CharField(
        source='job.title',
        read_only=True
    )
    company_name = serializers.CharField(
        source='job.company',
        read_only=True
    )

    class Meta:
        model = Application
        fields = [
            'id',
            'status',
            'cover_letter',
            'resume',
            'notes',
            'applied_at',
            'updated_at',
            'candidate_name',
            'candidate_email',  # ← très important
            'job_title',
            'company_name',
            'candidate',
            'job',
        ]
