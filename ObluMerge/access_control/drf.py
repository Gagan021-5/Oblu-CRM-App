# access_control/drf.py
from rest_framework.permissions import BasePermission
from access_control.services import can, scope_queryset

class RBACPermission(BasePermission):
    def has_permission(self, request, view):
        perm_code = getattr(view, "rbac_permission", None)
        if not perm_code:
            return True
        return can(request.user, perm_code)

    def has_object_permission(self, request, view, obj):
        perm_code = getattr(view, "rbac_permission", None)
        if not perm_code:
            return True
        return can(request.user, perm_code, obj=obj)


class RBACScopedMixin:
    """
    Mixin for DRF ListAPIView or ModelViewSet.
    Automatically applies scoped filtering to the queryset.
    """
    rbac_permission = None

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.rbac_permission:
            return qs
        return scope_queryset(self.request.user, self.rbac_permission, qs)