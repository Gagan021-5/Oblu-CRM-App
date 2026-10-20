# access_control/services.py
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from access_control.models import RolePermission, RoleAssignment
from access_control.hierarchy import get_accessible_user_ids
from customer_dashboard.models import SalesPerson

User = get_user_model()


def get_user_effective_permissions(user):
    """Returns {permission_key: set_of_granted_scopes}."""
    if not user.is_authenticated:
        return {}

    # Superuser or legacy accountant gets global access
    if user.is_superuser or getattr(user, "is_accountant", False):
        return {"*": {"all"}}

    emp = getattr(user, "employee_profile", None)
    if not emp:
        return {}

    now = timezone.now()
    active_assignments = RoleAssignment.objects.filter(
        employee=emp,
        is_active=True
    ).filter(
        Q(starts_at__isnull=True) | Q(starts_at__lte=now)
    ).filter(
        Q(ends_at__isnull=True) | Q(ends_at__gte=now)
    )

    role_ids = active_assignments.values_list("role_id", flat=True)

    role_perms = RolePermission.objects.filter(
        role_id__in=role_ids
    ).select_related("permission")

    perm_map = {}
    for rp in role_perms:
        key = rp.permission.permission_key
        perm_map.setdefault(key, set()).add(rp.default_scope)

    return perm_map


def get_object_owner_user_id(obj):
    """Accurately extracts the Django User ID owner from any model instance."""
    if hasattr(obj, "user_id") and obj.user_id:
        return obj.user_id
    if hasattr(obj, "created_by_id") and obj.created_by_id:
        return obj.created_by_id

    # Handle models where created_by is stored as username string (ProformaInvoice / QuotationMaker)
    if hasattr(obj, "created_by") and isinstance(obj.created_by, str) and obj.created_by:
        owner_u = User.objects.filter(username=obj.created_by).values_list("id", flat=True).first()
        if owner_u:
            return owner_u

    if hasattr(obj, "salesperson") and obj.salesperson:
        return obj.salesperson.user_id

    if hasattr(obj, "customer") and obj.customer and obj.customer.salesperson:
        return obj.customer.salesperson.user_id

    return None


def can(user, permission_key, obj=None):
    if not user.is_authenticated:
        return False
    if user.is_superuser or getattr(user, "is_accountant", False):
        return True

    perms = get_user_effective_permissions(user)
    if "*" in perms:
        return True

    granted_scopes = perms.get(permission_key)
    if not granted_scopes:
        return False

    if obj is None or "all" in granted_scopes:
        return True

    emp = getattr(user, "employee_profile", None)
    owner_user_id = get_object_owner_user_id(obj)

    if "self" in granted_scopes and owner_user_id == user.id:
        return True

    if "team" in granted_scopes:
        accessible_ids = get_accessible_user_ids(user)
        if owner_user_id in accessible_ids:
            return True

    if "department" in granted_scopes and emp and emp.department_id:
        if getattr(obj, "department_id", None) == emp.department_id:
            return True

    if "company" in granted_scopes and emp:
        obj_co = getattr(obj, "company_id", None)
        if obj_co and (obj_co == emp.company_id or emp.managed_companies.filter(id=obj_co).exists()):
            return True

    return False


def scope_queryset(user, permission_key, queryset):
    if not user.is_authenticated:
        return queryset.none()
    if user.is_superuser or getattr(user, "is_accountant", False):
        return queryset

    perms = get_user_effective_permissions(user)
    if "*" in perms:
        return queryset

    granted_scopes = perms.get(permission_key)
    if not granted_scopes:
        return queryset.none()

    if "all" in granted_scopes:
        return queryset

    model = queryset.model
    emp = getattr(user, "employee_profile", None)
    sp_profile = SalesPerson.objects.filter(user=user).first()

    union_filter = Q()

    # =========================================================================
    # Scope Rule: SELF
    # =========================================================================
    if "self" in granted_scopes:
        self_q = Q()
        if hasattr(model, "created_by"):
            # Handles both User ForeignKey and CharField username (Proforma/Quotation)
            self_q |= Q(created_by=user) | Q(created_by=user.username)
        if hasattr(model, "user"):
            self_q |= Q(user=user)
        if hasattr(model, "salesperson"):
            self_q |= Q(salesperson=sp_profile) if sp_profile else Q(salesperson__user=user)
        if hasattr(model, "customer"):
            self_q |= Q(customer__salesperson=sp_profile) if sp_profile else Q(customer__salesperson__user=user)
        union_filter |= self_q

    # =========================================================================
    # Scope Rule: TEAM
    # =========================================================================
    if "team" in granted_scopes:
        accessible_user_ids = get_accessible_user_ids(user)
        accessible_usernames = list(
            User.objects.filter(id__in=accessible_user_ids).values_list("username", flat=True)
        )

        team_sp_ids = []
        if sp_profile:
            team_sp_ids = list(SalesPerson.objects.filter(manager=sp_profile).values_list("id", flat=True))
            team_sp_ids.append(sp_profile.id)

        team_q = Q()
        if hasattr(model, "created_by"):
            # Matches both user IDs and usernames stored on PIs
            team_q |= Q(created_by_id__in=accessible_user_ids) | Q(created_by__in=accessible_usernames)
        if hasattr(model, "user"):
            team_q |= Q(user_id__in=accessible_user_ids)
        if hasattr(model, "salesperson"):
            team_q |= Q(salesperson__user_id__in=accessible_user_ids) | Q(salesperson_id__in=team_sp_ids)
        if hasattr(model, "customer"):
            team_q |= Q(customer__salesperson__user_id__in=accessible_user_ids) | Q(customer__salesperson_id__in=team_sp_ids)
        union_filter |= team_q

    # =========================================================================
    # Scope Rule: DEPARTMENT
    # =========================================================================
    if "department" in granted_scopes and emp and emp.department_id:
        if hasattr(model, "department"):
            union_filter |= Q(department=emp.department)

    # =========================================================================
    # Scope Rule: COMPANY
    # =========================================================================
    if "company" in granted_scopes and emp:
        if hasattr(model, "company"):
            allowed_cos = list(emp.managed_companies.values_list("id", flat=True))
            if emp.company_id:
                allowed_cos.append(emp.company_id)
            union_filter |= Q(company_id__in=allowed_cos)

    if not union_filter:
        return queryset.none()

    return queryset.filter(union_filter).distinct()