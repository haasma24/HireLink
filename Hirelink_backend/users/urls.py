# Hirelink_backend/users/urls.py
from django.urls import path
from users.views.views_company import RecruiterCompanyView
from users.views.register_views import RegisterView
from users.views.auth_views import LoginView, LogoutView
from users.views.profile_views import UserDetailView
from users.views.admin_views import validate_recruiter
from users.views.password_views import RequestPasswordResetView, ResetPasswordView
from users.views.admin_views import list_recruiters
from users.views.resume_views import UploadResumeView, UpdateProfileView


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', UserDetailView.as_view(), name='user-profile'),
    
    path('recruiters/', list_recruiters, name='admin-recruiter-list'),
     path('upload-resume/', UploadResumeView.as_view(), name='upload-resume'),
    path('update-profile/', UpdateProfileView.as_view(), name='update-profile'),
    path('validate-recruiter/<int:recruiter_id>/', validate_recruiter, name='validate-recruiter'),
    path('password-reset/', RequestPasswordResetView.as_view(), name='password-reset'),
    path('reset-password/<uid>/<token>/', ResetPasswordView.as_view(), name='reset-password'),
    path('recruiter/company/', RecruiterCompanyView.as_view(), name='recruiter-company'),
]
