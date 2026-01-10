# jobs/models.py - KEEP THIS, REMOVE DUPLICATES
from django.db import models

class Job(models.Model):
    JOB_TYPE_CHOICES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
        ('remote', 'Remote'),
    ]
    
    EXPERIENCE_LEVEL_CHOICES = [
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior Level'),
        ('executive', 'Executive'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    company = models.CharField(max_length=200)
    location = models.CharField(max_length=100)
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_currency = models.CharField(max_length=10, default='USD')
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='full_time')
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES, default='entry')
    posted_by = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='posted_jobs')
    is_active = models.BooleanField(default=True)
    application_deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    required_skills = models.TextField(blank=True, help_text="Comma-separated list of required skills")
    preferred_skills = models.TextField(blank=True, help_text="Comma-separated list of preferred skills")
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} at {self.company}"
    
    def get_required_skills_list(self):
        if self.required_skills:
            return [skill.strip() for skill in self.required_skills.split(',') if skill.strip()]
        return []
    
    def get_preferred_skills_list(self):
        if self.preferred_skills:
            return [skill.strip() for skill in self.preferred_skills.split(',') if skill.strip()]
        return []

class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('shortlisted', 'Shortlisted'),
        ('interview', 'Interview Scheduled'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='job_applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    cover_letter = models.TextField(blank=True)
    resume = models.FileField(upload_to='resumes/%Y/%m/%d/', null=True, blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['job', 'applicant']
        ordering = ['-applied_at']
    
    def __str__(self):
        return f"{self.applicant.username} applied for {self.job.title}"

class SavedJob(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by_users')
    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='saved_jobs')
    saved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['job', 'user']
    
    def __str__(self):
        return f"{self.user.username} saved {self.job.title}"