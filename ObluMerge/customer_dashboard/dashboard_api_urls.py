"""
Dashboard Overview — REST API URL routing.
Mounted at /api/dashboard/
"""

from django.urls import path
from .api_views import DashboardStatsView

urlpatterns = [
    path("stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]
