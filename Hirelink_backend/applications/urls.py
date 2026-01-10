# urls.py
from django.urls import path
from . import views

urlpatterns = [
    
    # YOUR application workflow endpoints
    path('applications/', views.ApplicationListView.as_view(), name='application-list'),
    path('applications/<int:pk>/', views.ApplicationDetailView.as_view(), name='application-detail'),
    path('applications/<int:application_id>/status/', views.ApplicationStatusWebhook.as_view(), name='application-status-webhook'),
    
    # Interview endpoints
    path('interviews/', views.InterviewListView.as_view(), name='interview-list'),
    
    # Notification endpoints
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    
    # Stats endpoint
    path('stats/applications/', views.ApplicationStatsView.as_view(), name='application-stats'),
]