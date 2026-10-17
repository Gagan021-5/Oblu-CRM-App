"""
Leads — REST API URL routing for the employee mobile app.
Mounted at /api/leads/
"""

from django.urls import path
from .api_views import (
    LeadListView,
    LeadDetailView,
    LeadStageUpdateView,
    LeadStagesListView,
)

urlpatterns = [
    path("", LeadListView.as_view(), name="employee-lead-list"),
    path("stages/", LeadStagesListView.as_view(), name="employee-lead-stages"),
    path("<int:pk>/", LeadDetailView.as_view(), name="employee-lead-detail"),
    path("<int:pk>/stage/", LeadStageUpdateView.as_view(), name="employee-lead-stage-update"),
]
