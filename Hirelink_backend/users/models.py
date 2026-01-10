# users/models.py - UPDATE EXISTING CODE
from django.contrib.auth.models import AbstractUser
from django.db import models

def user_profile_path(instance, filename):
    return f"profile_pics/user_{instance.id}/{filename}"

def user_resume_path(instance, filename):
    return f"resumes/user_{instance.id}/{filename}"

class Entreprise(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    website = models.URLField(blank=True, null=True)
    recruiter = models.OneToOneField('CustomUser', on_delete=models.CASCADE, related_name='entreprise')

    def __str__(self):
        return self.name

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('candidate', 'Candidate'),
        ('recruiter', 'Recruiter'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    full_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to=user_profile_path, null=True, blank=True)
    
    # ADD THESE FIELDS:
    resume = models.FileField(upload_to=user_resume_path, null=True, blank=True)
    headline = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    bio = models.TextField(blank=True)
    skills = models.TextField(blank=True, help_text="Comma-separated list of skills")
    github_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    
    is_validated = models.BooleanField(default=False)

    def __str__(self):
        return self.username
    
    # ADD THIS METHOD:
    def get_skills_list(self):
        if self.skills:
            return [skill.strip() for skill in self.skills.split(',') if skill.strip()]
        return []