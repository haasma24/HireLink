from django.urls import path
from recruiter.applications_views import (
    RecruiterApplicationListView,
    RecruiterJobApplicationListView,
    RecruiterApplicationDetailView,
    RecruiterApplicationStatusUpdateView,
)

urlpatterns = [
    path(
        "recruiter/applications/",
        RecruiterApplicationListView.as_view(),
        name="recruiter-application-list",
    ),
    path(
        "recruiter/applications/job/<int:job_id>/",
        RecruiterJobApplicationListView.as_view(),
        name="recruiter-job-application-list",
    ),
    path(
        "recruiter/applications/<int:pk>/",
        RecruiterApplicationDetailView.as_view(),
        name="recruiter-application-detail",
    ),
    path(
        "recruiter/applications/<int:pk>/status/",
        RecruiterApplicationStatusUpdateView.as_view(),
        name="recruiter-application-status-update",
    ),
     path(
        'recruiter/applications/<int:pk>/',
        RecruiterApplicationDetailView.as_view(),
        name='recruiter-application-detail',
    ),
]
