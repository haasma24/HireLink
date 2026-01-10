from django.contrib import admin
from .models import Job, JobApplication, SavedJob

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'location', 'job_type', 'experience_level', 'is_active', 'created_at']
    list_filter = ['job_type', 'experience_level', 'is_active', 'created_at']
    search_fields = ['title', 'company', 'description']
    list_editable = ['is_active']
    date_hierarchy = 'created_at'

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ['job', 'applicant', 'status', 'applied_at']
    list_filter = ['status', 'applied_at']
    search_fields = ['job__title', 'applicant__username']
    date_hierarchy = 'applied_at'

@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ['job', 'user', 'saved_at']
    list_filter = ['saved_at']
    search_fields = ['job__title', 'user__username']