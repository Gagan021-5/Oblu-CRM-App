from django.contrib.auth import get_user_model
from django.test import TestCase


class InventoryDashboardSmokeTests(TestCase):
    """Exercise the authenticated inventory page in the PostgreSQL CI job."""

    def test_inventory_dashboard_renders_for_superuser(self):
        user = get_user_model().objects.create_superuser(
            username="inventory-ci-smoke",
            email="inventory-ci-smoke@example.invalid",
            password="ci-only-password",
        )
        self.client.force_login(user)

        response = self.client.get("/inventory/")

        self.assertEqual(response.status_code, 200)
