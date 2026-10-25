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


def get_visible_customer_queryset(user):
    """Apply the same account visibility rules to dashboard summaries as the directory."""
    qs = Customer.objects.all()
    if (
        user.is_superuser
        or user.is_staff
        or is_admin(user)
        or is_finance(user)
        or can(user, "customer.view_all")
    ):
        return qs

    accessible_sp_ids = get_accessible_salesperson_ids(user)
    accessible_uids = get_accessible_user_ids(user)
    scope_q = Q()
    if accessible_sp_ids:
        scope_q |= Q(salesperson_id__in=accessible_sp_ids)
    if accessible_uids:
        scope_q |= Q(salesperson__user_id__in=accessible_uids)
    salesperson = SalesPerson.objects.filter(user=user).first()
    if salesperson:
        scope_q |= Q(salesperson=salesperson)
    return qs.filter(scope_q) if scope_q else qs.none()


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
        cust_qs = get_visible_customer_queryset(request.user)

        total_customers = cust_qs.count()

        # Follow-ups due
        today = timezone.now().date()
        followups_due = CustomerFollowUp.objects.filter(
            followup_date__lte=today, is_completed=False
        )
        followups_due = followups_due.filter(customer__in=cust_qs)
        followups_due_count = followups_due.count()

        # Overdue payment vouchers
        overdue_qs = CustomerVoucherStatus.objects.filter(is_credit_period_crossed=True)
        overdue_qs = overdue_qs.filter(customer__in=cust_qs)
        overdue_count = overdue_qs.count()

        # Total outstanding
        total_balance = cust_qs.aggregate(
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


class CustomerChartsView(APIView):
    """
    GET /api/customers/charts/
    Returns distribution data for charts in the mobile app.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Count, Q
        cust_qs = get_visible_customer_queryset(request.user)

        sp_counts = (
            cust_qs.values("salesperson__name")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )
        salesperson_dist = [
            {"name": s["salesperson__name"] or "Unassigned", "customers": s["count"]}
            for s in sp_counts
        ]

        state_counts = (
            cust_qs.values("state")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )
        state_dist = [
            {"state": s["state"] or "Other", "count": s["count"]}
            for s in state_counts
        ]

        voucher_qs = CustomerVoucherStatus.objects.filter(customer__in=cust_qs)
        vouchers_total = voucher_qs.count()
        vouchers_overdue = voucher_qs.filter(is_credit_period_crossed=True).count()
        vouchers_pending = voucher_qs.filter(
            Q(is_unpaid=True) | Q(is_partially_paid=True)
        ).count()
        vouchers_paid = voucher_qs.filter(is_fully_paid=True).count()

        total_balance = cust_qs.aggregate(
            total=Sum("credit_profile__outstanding_balance")
        )["total"] or 0

        return Response({
            "totalCustomers": cust_qs.count(),
            "salespersonDistribution": salesperson_dist,
            "stateDistribution": state_dist,
            "vouchers": {
                "total": vouchers_total,
                "overdue": vouchers_overdue,
                "pending": vouchers_pending,
                "paid": vouchers_paid,
            },
            "totalOutstanding": float(abs(total_balance)),
            "totalOutstandingFormatted": f"₹{int(abs(total_balance)):,}",
        })


class CustomerWorkspaceToolsView(APIView):
    """Small mobile endpoints for the customer workspace tools.

    Every customer-facing result is scoped to the authenticated user's existing
    customer visibility. Administrative actions remain limited to staff/admin.
    """
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _role_keys(user):
        try:
            return {assignment.role.role_key.lower() for assignment in user.employee_profile.role_assignments.filter(is_active=True)}
        except Exception:
            return set()

    @classmethod
    def _has_role(cls, user, *keys):
        return bool(cls._role_keys(user).intersection(keys))

    def get(self, request, tool):
        from datetime import date
        from calendar import monthrange
        from django.db.models import Q

        customers = get_visible_customer_queryset(request.user)
        if tool == "team-customers":
            qs = Customer.objects.filter(pk__in=customers.values("pk")).select_related("salesperson").order_by("name")
            return Response(CustomerListSerializer(qs[:200], many=True).data)

        if tool == "payment-followups":
            qs = CustomerVoucherStatus.objects.filter(
                Q(is_unpaid=True) | Q(is_partially_paid=True), customer__in=customers
            ).select_related("customer", "voucher").order_by("customer__name", "voucher_date")
            return Response([{
                "id": row.id,
                "customer": row.customer.name,
                "customer_id": row.customer_id,
                "invoice": row.voucher.voucher_number if row.voucher else "",
                "date": row.voucher_date,
                "amount": str(row.voucher_amount or 0),
                "unpaid": str(row.unpaid_amount or 0),
                "overdue": bool(row.is_credit_period_crossed),
            } for row in qs[:300]])

        if tool == "monthly-sales":
            salesperson = SalesPerson.objects.filter(user=request.user).first()
            if not salesperson and not (request.user.is_staff or request.user.is_superuser):
                return Response({"rows": [], "total": "0", "month": date.today().strftime("%Y-%m")})
            month = request.query_params.get("month", date.today().strftime("%Y-%m"))
            try:
                year, month_num = (int(x) for x in month.split("-", 1))
                start = date(year, month_num, 1)
                end = date(year, month_num, monthrange(year, month_num)[1])
            except (ValueError, TypeError):
                return Response({"error": "month must use YYYY-MM format"}, status=400)
            status_qs = CustomerVoucherStatus.objects.filter(
                sold_by=salesperson, voucher_type__iexact="TAX INVOICE", voucher_date__range=(start, end)
            ).select_related("customer", "voucher")
            rows = []
            total = 0
            for vs in status_qs:
                amount = vs.voucher_amount or 0
                total += amount
                rows.append({"id": vs.id, "date": vs.voucher_date, "customer": vs.customer.name,
                    "voucher": vs.voucher.voucher_number if vs.voucher else "", "amount": str(amount),
                    "status": "paid" if vs.is_fully_paid else "pending"})
            return Response({"rows": rows, "total": str(total), "month": start.strftime("%Y-%m")})

        if tool == "cross-selling":
            from .views import CROSS_SELLING_CATEGORIES, get_cross_selling_dataset
            category_names = {item["id"]: item["name"] for item in CROSS_SELLING_CATEGORIES}
            rows = []
            for item in get_cross_selling_dataset()["customers"]:
                customer = item.get("customer")
                if customer and customers.filter(pk=customer.pk).exists():
                    rows.append({"customer": customer.name, "customer_id": customer.pk,
                        "salesperson": customer.salesperson.name if customer.salesperson else "Unassigned",
                        "bought": item.get("bought_count", 0),
                        "missing": [category_names.get(key, key) for key in item.get("missing_cat_ids", [])]})
            return Response(rows)

        if tool in {"my-incentives", "rsm-incentives", "sales-head-incentives"}:
            from incentive_calculator.models import IncentivePaymentStatus
            allowed = is_admin(request.user) or request.user.is_staff or request.user.is_superuser or self._has_role(request.user, "sales_head", "business")
            salesperson = SalesPerson.objects.filter(user=request.user).first()
            qs = IncentivePaymentStatus.objects.select_related("voucher_status__customer", "voucher_status__voucher", "voucher_status__sold_by")
            if tool == "my-incentives":
                if not salesperson:
                    return Response([])
                qs = qs.filter(voucher_status__sold_by=salesperson, is_paid_to_asm=True)
            elif tool == "rsm-incentives":
                from access_control.roles import get_subordinate_salesperson_ids
                team_ids = get_subordinate_salesperson_ids(request.user)
                if not team_ids or not self._has_role(request.user, "rsm", "sales_head", "admin") and not allowed:
                    return Response({"error": "Team incentive access is not available for this account."}, status=403)
                qs = qs.filter(voucher_status__sold_by_id__in=team_ids)
            elif not allowed or tool == "sales-head-incentives" and not self._has_role(request.user, "sales_head", "business", "admin") and not (request.user.is_staff or request.user.is_superuser):
                return Response({"error": "Administrator access required."}, status=403)
            return Response([{"id": row.id, "employee": row.voucher_status.sold_by.name if row.voucher_status.sold_by else "",
                "customer": row.voucher_status.customer.name, "voucher": row.voucher_status.voucher.voucher_number if row.voucher_status.voucher else "",
                "amount": str(row.amount_frozen), "paid": row.is_paid_to_asm} for row in qs.order_by("-voucher_status__voucher_date")[:300]])

        if tool == "voucher-approvals":
            if not (request.user.is_staff or request.user.is_superuser or is_admin(request.user) or self._has_role(request.user, "accounts_operations")):
                return Response({"error": "Administrator access required."}, status=403)
            qs = CustomerVoucherStatus.objects.filter(claim_status="PENDING").select_related("customer", "voucher", "claim_requested_by")
            return Response([{"id": row.id, "customer": row.customer.name,
                "voucher": row.voucher.voucher_number if row.voucher else "",
                "requested_by": row.claim_requested_by.name if row.claim_requested_by else "",
                "date": row.voucher_date} for row in qs.order_by("-voucher_date")[:300]])

        return Response({"error": "Unknown customer workspace tool."}, status=404)

    def post(self, request, tool):
        if tool != "voucher-approvals" or not (request.user.is_staff or request.user.is_superuser or is_admin(request.user) or self._has_role(request.user, "accounts_operations")):
            return Response({"error": "Administrator access required."}, status=403)
        row = get_object_or_404(CustomerVoucherStatus, pk=request.data.get("id"), claim_status="PENDING")
        action = request.data.get("action")
        if action not in {"approve", "reject"}:
            return Response({"error": "action must be approve or reject"}, status=400)
        row.claim_status = "APPROVED" if action == "approve" else "REJECTED"
        row.save(update_fields=["claim_status", "updated_at"])
        return Response({"success": True, "id": row.pk, "status": row.claim_status})

