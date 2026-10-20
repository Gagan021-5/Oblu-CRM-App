"""
HRMS REST API URL routing for mobile app.
Mounted at /api/hrms/
"""

from django.urls import path
from .mobile_api_views import (
    HRMSDashboardAPIView,
    HRMSEmployeeListAPIView,
    HRMSLeaveActionAPIView,
    HRMSAttendancePunchAPIView,
)

urlpatterns = [
    path("dashboard/", HRMSDashboardAPIView.as_view(), name="mobile-hrms-dashboard"),
    path("employees/", HRMSEmployeeListAPIView.as_view(), name="mobile-hrms-employees"),
    path("leaves/<int:pk>/action/", HRMSLeaveActionAPIView.as_view(), name="mobile-hrms-leave-action"),
    path("punch/", HRMSAttendancePunchAPIView.as_view(), name="mobile-hrms-punch"),
]
