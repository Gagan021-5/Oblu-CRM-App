from django.contrib.auth.mixins import AccessMixin
from django.shortcuts import redirect


class AccountantRequiredMixin(AccessMixin):
    """Verify that the current user is authenticated."""

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated or not (getattr(request.user, 'is_accountant', False) or request.user.is_superuser):
            return redirect('welcome')
        return super().dispatch(request, *args, **kwargs)