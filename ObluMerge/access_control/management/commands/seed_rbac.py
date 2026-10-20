# access_control/management/commands/seed_rbac.py
from django.core.management.base import BaseCommand
from access_control.models import Role, Permission, RolePermission

# In access_control/management/commands/seed_rbac.py
ROLE_MATRIX = {
    "admin": {
        "display_name": "Super Admin",
        "perms": {
            "customer.view_all": "all",
            "customer.view": "all",
            "customer.edit": "all",
            "customer.edit_credit": "all",
            "payment.view": "all",
            "proforma.create": "all",
            "proforma.view": "all",
            "proforma.dispatch": "all",
            "stock.request": "all",
            "credit.overdue": "all",
            "inventory.view": "all",
            "product_tier.manage": "all",
        }
    },
    "sales_head": {
        "display_name": "Sales Head",
        "perms": {
            "customer.view_all": "all",
            "customer.view": "all",
            "customer.edit": "all",
            "customer.edit_credit": "all",
            "payment.view": "all",
            "proforma.create": "all",
            "proforma.view": "all",
            "credit.overdue": "all",
        }
    },
    "business": {
        "display_name": "Business Manager",
        "perms": {
            "customer.view_all": "all",
            "customer.view": "all",
            "customer.edit": "all",
            "payment.view": "all",
            "proforma.create": "all",
            "proforma.view": "all",
            "inventory.view": "all",
        }
    },
    "accounts_operations": {
        "display_name": "Accounts & Operations",
        "perms": {
            "customer.view_all": "all",
            "customer.view": "all",
            "payment.view": "all",
            "proforma.create": "all",
            "proforma.view": "all",
            "proforma.dispatch": "all",
            "stock.request": "all",
            "inventory.view": "all",
            "product_tier.manage": "all",
        }
    },
    "warehouse": {
        "display_name": "Warehouse",
        "perms": {
            "proforma.dispatch": "all",
            "inventory.view": "all",
        }
    },
    "rsm": {
        "display_name": "Regional Sales Manager",
        "perms": {
            "customer.view": "team",
            "customer.edit": "team",
            "payment.view": "team",
            "proforma.create": "team",
            "proforma.view": "team",
        }
    },
    "asm": {
        "display_name": "Area Sales Manager",
        "perms": {
            "customer.view": "team",
            "customer.edit": "team",
            "payment.view": "team",
            "proforma.create": "team",
            "proforma.view": "team",
        }
    },
    "salesperson": {
        "display_name": "Salesperson",
        "perms": {
            "customer.view": "self",
            "payment.view": "self",
        }
    },
}
class Command(BaseCommand):
    help = "Seeds and synchronizes standard RBAC roles and permissions"

    def handle(self, *args, **options):
        for r_key, data in ROLE_MATRIX.items():
            role, _ = Role.objects.update_or_create(
                role_key=r_key,
                defaults={"display_name": data["display_name"]}
            )
            for p_key, scope in data["perms"].items():
                module = p_key.split(".")[0]
                label = p_key.replace(".", " ").title()
                perm, _ = Permission.objects.update_or_create(
                    permission_key=p_key,
                    defaults={
                        "display_name": label,
                        "module_name": module
                    }
                )
                RolePermission.objects.update_or_create(
                    role=role,
                    permission=perm,
                    defaults={"default_scope": scope}
                )
        self.stdout.write(self.style.SUCCESS("Successfully synchronized RBAC roles and permissions!"))