"""
URL configuration for merger project.
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth.views import LoginView, LogoutView
from inventory.views import SignUpView, WelcomeView
from django.contrib.auth import views as auth_views

urlpatterns = [
    # Mobile REST API Endpoints
    path("api/", include("call_tracking.urls")),
    path("api/auth/", include("access_control.urls")),
    path("api/access-control/", include("access_control.urls")),
    path("api/customers/", include("customer_dashboard.api_urls")),
    path("api/leads/", include("leads.api_urls")),
    path("api/dashboard/", include("customer_dashboard.dashboard_api_urls")),
    path("api/hrms/", include("hrms.api_urls")),

    # Web Portals & Templates
    path('admin/', admin.site.urls),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('hrms/', include('hrms.urls')),
    path('inventory/', include('inventory.urls')),
    path('signup/', SignUpView.as_view(), name='signup'),
    path('', WelcomeView.as_view(), name='welcome'),
    path('quotations/', include('quotations.urls')),
    path('customers/', include('customer_dashboard.urls')),
    path('leads/', include('leads.urls')),
    path('proforma/', include('proforma_invoice.urls')),
    path('vouchers/', include('tally_voucher.urls')),
    path('incentives/', include('incentive_calculator.urls')),
    path("meta/", include("meta.urls")),
    path("logs/", include('request_logs.urls')),
    path("docs/", include("docs.urls")),

    # Password reset
    path('password-reset/', auth_views.PasswordResetView.as_view(), name='password_reset'),
    path('password-reset/done/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),
]
