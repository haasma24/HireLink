#users/urls.py
from django.urls import path
from users.views.register_views import RegisterView
from users.views.auth_views import LoginView, LogoutView
from users.views.profile_views import UserDetailView
from users.views.admin_views import validate_recruiter
from users.views.password_views import RequestPasswordResetView, ResetPasswordView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', UserDetailView.as_view(), name='user-profile'),
    path('validate-recruiter/<int:recruiter_id>/', validate_recruiter, name='validate-recruiter'),
    path('password-reset/', RequestPasswordResetView.as_view(), name='password-reset'),
    path('reset-password/<uid>/<token>/', ResetPasswordView.as_view(), name='reset-password'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
