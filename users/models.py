#users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

def user_profile_path(instance, filename):
    return f"profile_pics/user_{instance.id}/{filename}"

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
    is_validated = models.BooleanField(default=False)

    def __str__(self):
        return self.username
