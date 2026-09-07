"""
Customer Dashboard — REST API URL routing for the employee mobile app.
Mounted at /api/customers/ (or /api/employee/customers/)
"""

from django.urls import path
from .api_views import (
    CustomerListView,
    CustomerDetailView,
    CustomerRemarkCreateView,
    CustomerFollowUpListCreateView,
)

urlpatterns = [
    path("", CustomerListView.as_view(), name="employee-customer-list"),
    path("<int:pk>/", CustomerDetailView.as_view(), name="employee-customer-detail"),
    path("<int:pk>/remarks/", CustomerRemarkCreateView.as_view(), name="employee-customer-remarks"),
    path("<int:pk>/followups/", CustomerFollowUpListCreateView.as_view(), name="employee-customer-followups"),
]
