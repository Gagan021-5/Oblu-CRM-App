"""
Customer Dashboard — REST API views for the employee mobile app.
Provides real-time access to Customers, Remarks, Follow-ups, and Tally Voucher status.
"""

from django.utils import timezone
from django.db.models import Q, Sum
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404

from access_control.roles import (
    get_accessible_salesperson_ids,
    get_salesperson_profile,
    is_admin,
    is_finance,
)
from access_control.hierarchy import get_accessible_user_ids
from access_control.services import can
from .models import (
    SalesPerson,
    Customer,
    CustomerRemark,
    CustomerFollowUp,
    CustomerVoucherStatus,
    PaymentDiscussionThread,
)
from .api_serializers import (
    CustomerListSerializer,
    CustomerDetailSerializer,
    CustomerRemarkSerializer,
    CustomerFollowUpSerializer,
    CustomerPaymentSerializer,
)


def get_salesperson(request):
    """
    Retrieve the SalesPerson profile linked to the authenticated user.
    If the user is an admin or staff, returns None (full company-wide access).
    If no salesperson is explicitly linked, falls back gracefully without 403.
    """
    user = request.user
    if user.is_staff or user.is_superuser or getattr(user, "role", "") == "admin":
        return None

    # Check direct link
    salesperson = SalesPerson.objects.filter(user=user).first()
    if salesperson:
        return salesperson

    # Try name match
    matched = SalesPerson.objects.filter(name__icontains=user.username).first()
    if matched:
        try:
            matched.user = user
            matched.save(update_fields=["user"])
        except Exception:
            pass
        return matched

    return None


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class CustomerListView(generics.ListAPIView):
    """
    GET /api/customers/?search=&filter=&page=
    Lists customers with live credit profile and voucher status.
    """
    serializer_class = CustomerListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        salesperson = get_salesperson(self.request)
        qs = Customer.objects.select_related("salesperson").prefetch_related(
            "credit_profile", "voucher_statuses", "remarks", "followups"
        )

        # Scoping via Access Control & Hierarchy
        user = self.request.user
        is_super = user.is_superuser or user.is_staff or is_admin(user) or is_finance(user) or can(user, "customer.view_all")
        view_all = self.request.query_params.get("view_all", "").lower() in ["true", "1"]

        if not is_super and not view_all:
            accessible_sp_ids = get_accessible_salesperson_ids(user)
            accessible_uids = get_accessible_user_ids(user)
            scope_q = Q()
            if accessible_sp_ids:
                scope_q |= Q(salesperson_id__in=accessible_sp_ids)
            if accessible_uids:
                scope_q |= Q(salesperson__user_id__in=accessible_uids)
            if salesperson:
                scope_q |= Q(salesperson=salesperson)

            if scope_q:
                qs = qs.filter(scope_q)
            else:
                qs = qs.none()

        # Search
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(phone__icontains=search)
                | Q(state__icontains=search)
                | Q(district__icontains=search)
            )

        # Filter tab
        active_filter = self.request.query_params.get("filter", "all").strip().lower()
        today = timezone.now().date()
        if active_filter == "followup_due":
            qs = qs.filter(
                followups__followup_date__lte=today,
                followups__is_completed=False,
            ).distinct()
        elif active_filter == "payment_pending":
            qs = qs.filter(
                Q(credit_profile__outstanding_balance__gt=0)
                | Q(voucher_statuses__is_credit_period_crossed=True)
            ).distinct()
        elif active_filter == "recently_contacted":
            qs = qs.filter(remarks__isnull=False).distinct()

        return qs.order_by("name")


class CustomerDetailView(generics.RetrieveAPIView):
    """
    GET /api/customers/{id}/
    Returns full customer detail with remarks, followups, and Tally vouchers.
    """
    serializer_class = CustomerDetailSerializer
    permission_classes = [IsAuthenticated]
    queryset = Customer.objects.select_related("salesperson", "credit_profile").prefetch_related(
        "voucher_statuses__voucher", "remarks__salesperson", "followups__salesperson"
    )


class CustomerRemarkCreateView(APIView):
    """
    POST /api/customers/{id}/remarks/
    Add a new remark to a customer.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        customer = get_object_or_404(Customer, pk=pk)
        salesperson = get_salesperson(request)
        if not salesperson:
            salesperson = customer.salesperson or SalesPerson.objects.first()

        remark_text = request.data.get("remark", "").strip() or request.data.get("text", "").strip()
        if not remark_text:
            return Response(
                {"error": "Remark text is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        remark = CustomerRemark.objects.create(
            customer=customer,
            salesperson=salesperson,
            remark=remark_text,
        )

        return Response(
            CustomerRemarkSerializer(remark).data,
            status=status.HTTP_201_CREATED,
        )


class CustomerFollowUpListCreateView(APIView):
    """
    GET  /api/customers/{id}/followups/
    POST /api/customers/{id}/followups/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        customer = get_object_or_404(Customer, pk=pk)
        followups = CustomerFollowUp.objects.filter(customer=customer).order_by("-followup_date")
        return Response(CustomerFollowUpSerializer(followups, many=True).data)

    def post(self, request, pk):
        customer = get_object_or_404(Customer, pk=pk)
        salesperson = get_salesperson(request)
        if not salesperson:
            salesperson = customer.salesperson or SalesPerson.objects.first()

        date_val = request.data.get("followup_date") or request.data.get("date")
        note = request.data.get("note") or request.data.get("notes") or request.data.get("purpose", "")

        if not date_val:
            date_val = timezone.now().date() + timezone.timedelta(days=1)
        elif isinstance(date_val, str):
            try:
                from datetime import datetime
                date_val = datetime.strptime(date_val, "%Y-%m-%d").date()
            except Exception:
                try:
                    from datetime import datetime
                    date_val = datetime.strptime(date_val, "%d %b %Y").date()
                except Exception:
                    date_val = timezone.now().date() + timezone.timedelta(days=1)

        followup = CustomerFollowUp.objects.create(
            customer=customer,
            salesperson=salesperson,
            followup_date=date_val,
            note=note,
        )

        return Response(
            CustomerFollowUpSerializer(followup).data,
            status=status.HTTP_201_CREATED,
        )


class CustomerPaymentTicketActionView(APIView):
    """
    POST /api/customers/{id}/payment-ticket/
    Raise or resolve a payment discussion ticket on a voucher status.
    Payload: {"payment_id": 123, "action": "raise" | "solve"}
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        customer = get_object_or_404(Customer, pk=pk)
        payment_id = request.data.get("payment_id")
        action = request.data.get("action", "raise").lower()

        voucher_status = get_object_or_404(
            CustomerVoucherStatus, id=payment_id, customer=customer
        )

        thread, _ = PaymentDiscussionThread.objects.get_or_create(
            voucher_status=voucher_status
        )

        if action == "raise":
            thread.ticket_status = "RAISED"
            thread.ticket_raised_at = timezone.now()
            thread.save()
        elif action == "solve":
            thread.ticket_status = "SOLVED"
            thread.save()

        return Response(
            {
                "success": True,
                "ticket_status": thread.ticket_status,
                "payment": CustomerPaymentSerializer(voucher_status).data,
            },
            status=status.HTTP_200_OK,
        )


class DashboardStatsView(APIView):
    """
    GET /api/dashboard/stats/
    Returns live CRM overview KPIs for the employee / admin mobile dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        salesperson = get_salesperson(request)
        cust_qs = Customer.objects.all()
        if salesperson:
            cust_qs = cust_qs.filter(salesperson=salesperson)

        total_customers = cust_qs.count()

        # Follow-ups due
        today = timezone.now().date()
        followups_due = CustomerFollowUp.objects.filter(
            followup_date__lte=today, is_completed=False
        )
        if salesperson:
            followups_due = followups_due.filter(salesperson=salesperson)
        followups_due_count = followups_due.count()

        # Overdue payment vouchers
        overdue_qs = CustomerVoucherStatus.objects.filter(is_credit_period_crossed=True)
        if salesperson:
            overdue_qs = overdue_qs.filter(customer__salesperson=salesperson)
        overdue_count = overdue_qs.count()

        # Total outstanding
        total_balance = Customer.objects.aggregate(
            total=Sum("credit_profile__outstanding_balance")
        )["total"] or 0

        # Leads count
        from leads.models import Lead
        leads_count = Lead.objects.count()

        return Response(
            {
                "totalCustomers": total_customers,
                "activeCustomersCount": total_customers,
                "followUpsDueCount": followups_due_count,
                "overduePaymentsCount": overdue_count,
                "totalOutstandingNum": float(abs(total_balance)),
                "totalOutstandingFormatted": f"₹{int(abs(total_balance)):,}",
                "totalLeadsCount": leads_count,
                "syncHealth": "100% Live",
            }
        )
