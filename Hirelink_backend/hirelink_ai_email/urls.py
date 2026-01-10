# hirelink_ai_email/urls.py
from django.urls import path
from .views import GenerateEmailView, SendEmailView

urlpatterns = [
    path("ai/email/generate/", GenerateEmailView.as_view(), name="ai-generate-email"),
    path("ai/email/send/", SendEmailView.as_view(), name="ai-send-email"),
]
