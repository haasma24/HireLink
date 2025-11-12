from django.contrib.auth.models import AbstractUser
from django.db import models

def user_profile_path(instance, filename):
    # fichier stocké dans media/profile_pics/user_<id>/<filename>
    return f"profile_pics/user_{instance.id}/{filename}"

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('candidate', 'Candidate'),
        ('recruiter', 'Recruiter'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='candidate')
    full_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to=user_profile_path, null=True, blank=True)

    def __str__(self):
        return self.username
