# jobs/urls.py
from django.urls import path
from . import views
from .views_ai import GenerateApplicationEmailView
from jobs.views_recruiter import RecruiterApplicationsView

urlpatterns = [
    # Job CRUD operations
    path('', views.JobListView.as_view(), name='job-list'),
    path('create/', views.JobCreateView.as_view(), name='job-create'),
    path('<int:pk>/', views.JobDetailView.as_view(), name='job-detail'),
    path('<int:pk>/update/', views.JobUpdateView.as_view(), name='job-update'),
    path('<int:pk>/delete/', views.JobDeleteView.as_view(), name='job-delete'),

    # Job search
    path('search/', views.JobSearchView.as_view(), name='job-search'),

    # Recruiter-specific endpoints
    path('recruiter/jobs/', views.RecruiterJobListView.as_view(), name='recruiter-job-list'),
    path('recruiter/applications/', views.JobApplicationsListView.as_view(), name='recruiter-applications'),
    path('recruiter/applications/<int:job_id>/', views.JobApplicationsListView.as_view(), name='job-applications'),

    # Candidate-specific endpoints
    path('candidate/applications/', views.CandidateApplicationsListView.as_view(), name='candidate-applications'),
    path('candidate/saved-jobs/', views.SavedJobsListView.as_view(), name='saved-jobs'),
    path('<int:job_id>/save/', views.SaveJobView.as_view(), name='save-job'),
    path('<int:job_id>/apply/', views.JobApplicationCreateView.as_view(), name='apply-job'),

    # New recruiter endpoints
    path('recruiter/stats/', views.RecruiterDashboardStatsView.as_view(), name='recruiter-stats'),
    path('recruiter/jobs/<int:pk>/toggle/', views.JobToggleActiveView.as_view(), name='job-toggle-active'),

    path('users/recruiter/jobs/', views.RecruiterJobListView.as_view(), name='recruiter-jobs'),
    path('users/recruiter/applications/', RecruiterApplicationsView.as_view(), name='recruiter-applications'),

    # AI-generated email endpoint
    path('recruiter/applications/<int:application_id>/generate-email/', GenerateApplicationEmailView.as_view(), name='recruiter-generate-email'),

    # AI Matching endpoints
    path('ai/recommendations/', views.AIRecommendationsView.as_view(), name='ai-recommendations'),
    path('ai/train/', views.TrainAIModelView.as_view(), name='ai-train'),
    path('ai/status/', views.AIModelStatusView.as_view(), name='ai-status'),
    path('ai/test/', views.TestAIRecommendationView.as_view(), name='ai-test'),
    path('ai/test/<int:candidate_id>/', views.TestAIRecommendationView.as_view(), name='ai-test-candidate'),
]
