# applications/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from jobs.models import Job  # Import Job from jobs app

User = get_user_model()

# YOUR Application Models - NO Job model here, use the one from jobs app
class Application(models.Model):
    STATUS_CHOICES = (
        ('applied', 'Applied'),
        ('under_review', 'Under Review'),
        ('shortlisted', 'Shortlisted'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('interviewed', 'Interviewed'),
        ('rejected', 'Rejected'),
        ('accepted', 'Accepted'),
        ('offer_sent', 'Offer Sent'),
        ('hired', 'Hired'),
    )
    
    candidate = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'candidate'})
    job = models.ForeignKey(Job, on_delete=models.CASCADE)  # Using Job from jobs app
    cover_letter = models.TextField()
    resume = models.FileField(upload_to='resumes/%Y/%m/%d/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['candidate', 'job'], name='unique_application')
        ]
        indexes = [
            models.Index(fields=['candidate', 'status']),
            models.Index(fields=['job', 'status']),
        ]
        ordering = ['-applied_at']
    
    def __str__(self):
        return f"{self.candidate.username} - {self.job.title}"

class Interview(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='interviews')
    scheduled_date = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    interview_type = models.CharField(max_length=50, choices=[
        ('phone', 'Phone Screen'),
        ('video', 'Video Call'),
        ('technical', 'Technical Interview'),
        ('onsite', 'On-site Interview'),
    ])
    interviewer = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'recruiter'})
    meeting_link = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['scheduled_date']
    
    def __str__(self):
        return f"Interview for {self.application}"

class ApplicationStatusLog(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='status_logs')
    old_status = models.CharField(max_length=20, choices=Application.STATUS_CHOICES)
    new_status = models.CharField(max_length=20, choices=Application.STATUS_CHOICES)
    changed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    changed_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-changed_at']

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('application_status', 'Application Status Update'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('interview_reminder', 'Interview Reminder'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    related_application = models.ForeignKey(Application, on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']