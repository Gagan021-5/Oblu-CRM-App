# access_control/context_processors.py
from customer_dashboard.models import SalesPerson
from access_control.services import get_user_effective_permissions

def rbac_context(request):
    if not request.user.is_authenticated:
        return {}

    user = request.user
    emp = getattr(user, "employee_profile", None)

    user_roles = []
    role_display_name = "User"
    if emp:
        for assignment in emp.role_assignments.filter(is_active=True):
            if assignment.is_currently_valid():
                user_roles.append(assignment.role.role_key)
                if role_display_name == "User":
                    role_display_name = assignment.role.display_name

    if user.is_superuser:
        role_display_name = "Superuser"
    elif getattr(user, "is_accountant", False) and not user_roles:
        role_display_name = "Accountant"

    # Fetch effective permissions dictionary:
    perms = get_user_effective_permissions(user)
    perm_keys = set(perms.keys()) if perms else set()

    salesperson = SalesPerson.objects.filter(user=user).first()

    return {
        "user_roles": user_roles,
        "role_display_name": role_display_name,
        "permissions": perm_keys,
        "is_executive": bool(
            user.is_superuser
            or getattr(user, "is_accountant", False)
            or any(r in user_roles for r in ["admin", "sales_head", "business", "accounts_operations"])
        ),
        "salesperson": salesperson,
    }