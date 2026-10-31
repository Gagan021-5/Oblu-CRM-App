"""
Inventory REST API URL routing for mobile app.
Mounted at /api/inventory/
"""

from django.urls import path
from .mobile_api_views import (
    InventoryExecutiveDashboardAPIView,
    InventoryItemListAPIView,
)

urlpatterns = [
    path("dashboard/", InventoryExecutiveDashboardAPIView.as_view(), name="mobile-inventory-dashboard"),
    path("items/", InventoryItemListAPIView.as_view(), name="mobile-inventory-items"),
]
