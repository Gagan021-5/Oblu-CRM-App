"""
Customer Dashboard — REST API URL routing for the employee mobile app.
Mounted at /api/customers/ and /api/dashboard/
"""

from django.urls import path
from .api_views import (
    CustomerListView,
    CustomerDetailView,
    CustomerRemarkCreateView,
    CustomerFollowUpListCreateView,
    CustomerPaymentTicketActionView,
    DashboardStatsView,
)

urlpatterns = [
    path("", CustomerListView.as_view(), name="employee-customer-list"),
    path("<int:pk>/", CustomerDetailView.as_view(), name="employee-customer-detail"),
    path("<int:pk>/remarks/", CustomerRemarkCreateView.as_view(), name="employee-customer-remarks"),
    path("<int:pk>/followups/", CustomerFollowUpListCreateView.as_view(), name="employee-customer-followups"),
    path("<int:pk>/payment-ticket/", CustomerPaymentTicketActionView.as_view(), name="employee-customer-ticket"),
]
