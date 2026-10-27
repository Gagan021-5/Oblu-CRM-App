"""
Customer Dashboard — REST API views for the employee mobile app.
Provides real-time access to Customers, Remarks, Follow-ups, and Tally Voucher status.
"""

from django.utils import timezone
from django.db.models import Count, DateField, DateTimeField, Exists, IntegerField, OuterRef, Prefetch, Q, Subquery, Sum, Value
from django.db.models.functions import Coalesce, Lower, TruncDate
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404

from access_control.roles import (
    is_admin,
    is_finance,
)
from access_control.services import can, scope_queryset
from .models import (
    SalesPerson,
    Customer,
    CustomerUnit,
    CustomerRemark,
    CustomerFollowUp,
    CustomerVoucherStatus,
    PaymentDiscussionThread,
    PaymentRemark,
    PaymentExpectedDateHistory,
    PaymentTicketEvent,
)
from .api_serializers import (
    CustomerListSerializer,
    CustomerDetailSerializer,
    CustomerRemarkSerializer,
    CustomerFollowUpSerializer,
    CustomerPaymentSerializer,
)


def get_visible_customer_queryset(user):
    """Return customer rows inside the active customer.view RBAC scope."""
    return _customer_scope(user, "customer.view", "customer.view_all", "payment.view")


def _has_customer_permission(user, *permission_keys):
    return bool(
        user.is_superuser or user.is_staff or is_admin(user) or is_finance(user)
        or any(can(user, key) for key in permission_keys)
    )


def _customer_scope(user, *permission_keys):
    """Union the records visible through the user's active database RBAC grants."""
    from functools import reduce
    from operator import or_

    querysets = [scope_queryset(user, key, Customer.objects.all()) for key in permission_keys if can(user, key)]
    if user.is_superuser or user.is_staff or is_admin(user) or is_finance(user):
        return Customer.objects.all()
    if not querysets:
        return Customer.objects.none()
    return reduce(or_, querysets)


def _payment_scope(user, *permission_keys):
    from functools import reduce
    from operator import or_

    base = CustomerVoucherStatus.objects.all()
    querysets = [scope_queryset(user, key, base) for key in permission_keys if can(user, key)]
    if user.is_superuser or user.is_staff or is_admin(user) or is_finance(user):
        return base
    if not querysets:
        return base.none()
    return reduce(or_, querysets)


def _get_customer_for_user(user, customer_id, *permission_keys):
    if not _has_customer_permission(user, *permission_keys):
        raise PermissionDenied("You do not have permission to view customer records.")
    return get_object_or_404(
        _customer_scope(user, *permission_keys).select_related("salesperson", "credit_profile"),
        pk=customer_id,
    )


def _annotate_portfolio_metrics(queryset):
    """Attach the voucher metrics used by the website customer portfolio."""
    from tally_voucher.models import Voucher, VoucherRow

    party_total = VoucherRow.objects.filter(
        voucher_id=OuterRef("pk"), ledger__iexact=OuterRef("party_name")
    ).values("voucher_id").annotate(total=Sum("amount")).values("total")[:1]
    customer_vouchers = Voucher.objects.annotate(party_clean=Lower("party_name")).filter(
        party_clean=Lower(OuterRef("name")), voucher_type__iexact="TAX INVOICE"
    )
    order_count = customer_vouchers.order_by().values("party_clean").annotate(
        total=Count("pk")
    ).values("total")[:1]
    order_value = customer_vouchers.order_by().annotate(
        party_total=Subquery(party_total)
    ).values("party_clean").annotate(total=Sum("party_total")).values("total")[:1]
    last_order = customer_vouchers.order_by("-date").values("date")[:1]
    return queryset.annotate(
        portfolio_total_orders=Subquery(order_count),
        portfolio_total_order_value=Subquery(order_value),
        portfolio_last_order_date=Subquery(last_order),
    )


def _annotate_customer_list_activity(queryset):
    """Compute list-card activity fields in SQL instead of querying per row."""
    today = timezone.now().date()
    cutoff = today - timezone.timedelta(days=90)
    due_followups = CustomerFollowUp.objects.filter(
        customer_id=OuterRef("pk"), followup_date__lte=today, is_completed=False
    ).values("customer_id").annotate(total=Count("id")).values("total")[:1]
    next_followup = CustomerFollowUp.objects.filter(
        customer_id=OuterRef("pk"), followup_date__gte=today, is_completed=False
    ).order_by("followup_date").values("followup_date")[:1]
    last_remark = CustomerRemark.objects.filter(
        customer_id=OuterRef("pk")
    ).order_by("-created_at").values("created_at")[:1]
    return queryset.annotate(
        api_followups_due=Coalesce(Subquery(due_followups, output_field=IntegerField()), Value(0)),
        api_next_followup_date=Subquery(next_followup, output_field=DateField()),
        api_last_remark_at=Subquery(last_remark, output_field=DateTimeField()),
        api_has_overdue=Exists(CustomerVoucherStatus.objects.filter(
            customer_id=OuterRef("pk"), is_credit_period_crossed=True
        )),
        api_has_recent_voucher=Exists(CustomerVoucherStatus.objects.filter(
            customer_id=OuterRef("pk"), voucher_date__gte=cutoff
        )),
        api_has_recent_tax_invoice=Exists(CustomerVoucherStatus.objects.filter(
            customer_id=OuterRef("pk"), voucher_type__iexact="TAX INVOICE", voucher_date__gte=cutoff
        )),
    )


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class CustomerMapPointsView(APIView):
    """Return only geocoded customers visible under the detailed-map grant."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not can(request.user, "customer.view_all"):
            raise PermissionDenied("Detailed customer map access is not enabled for this account.")

        points = scope_queryset(
            request.user,
            "customer.view_all",
            Customer.objects.all(),
        ).filter(
            latitude__isnull=False,
            longitude__isnull=False,
        ).order_by("name", "pk").values(
            "id", "name", "state", "district", "latitude", "longitude",
        )
        return Response(list(points))


class CustomerListView(generics.ListAPIView):
    """
    GET /api/customers/?search=&filter=&page=
    Lists customers with live credit profile and voucher status.
    """
    serializer_class = CustomerListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        if not _has_customer_permission(user, "customer.view", "customer.view_all", "payment.view"):
            raise PermissionDenied("Customer Directory access is not enabled for this account.")
        qs = _annotate_customer_list_activity(
            _annotate_portfolio_metrics(
                _customer_scope(user, "customer.view", "customer.view_all", "payment.view")
            )
        ).select_related("salesperson", "unit_membership__unit", "credit_profile")

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

        payment_status = self.request.query_params.get("payment_status", "all").strip().lower()
        has_overdue = Q(voucher_statuses__is_credit_period_crossed=True)
        has_balance = Q(credit_profile__outstanding_balance__gt=0)
        if payment_status == "overdue":
            qs = qs.filter(has_overdue).distinct()
        elif payment_status == "pending":
            qs = qs.filter(has_balance).exclude(has_overdue).distinct()
        elif payment_status == "paid":
            qs = qs.exclude(has_overdue).filter(Q(credit_profile__outstanding_balance__lte=0) | Q(credit_profile__isnull=True)).distinct()
        elif payment_status == "no_payment":
            qs = qs.filter(voucher_statuses__isnull=True).distinct()

        if self.request.query_params.get("has_outstanding", "").lower() == "true":
            qs = qs.filter(has_balance)

        ordering = {
            "name_asc": "name",
            "name_desc": "-name",
            "outstanding_high": "-credit_profile__outstanding_balance",
            "outstanding_low": "credit_profile__outstanding_balance",
        }.get(self.request.query_params.get("ordering", "default"), "name")
        return qs.order_by(ordering, "pk")


class CustomerDetailView(generics.RetrieveAPIView):
    """
    GET /api/customers/{id}/
    Returns full customer detail with remarks, followups, and Tally vouchers.
    """
    serializer_class = CustomerDetailSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        keys = tuple(key for key in ("customer.view", "customer.view_all") if can(user, key))
        if not _has_customer_permission(user, *keys):
            return Customer.objects.none()
        return _customer_scope(user, *keys).select_related("salesperson", "credit_profile").prefetch_related(
            "voucher_statuses__voucher", "remarks__salesperson", "followups__salesperson",
            "voucher_statuses__payment_thread__expected_date_history",
        )


class CustomerRemarkCreateView(APIView):
    """
    POST /api/customers/{id}/remarks/
    Add a new remark to a customer.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        customer = _get_customer_for_user(request.user, pk, "customer.view", "customer.view_all")
        salesperson = SalesPerson.objects.filter(user=request.user).first() or customer.salesperson
        if not salesperson:
            return Response({"error": "Link a salesperson to your account or assign one to this customer before adding remarks."}, status=400)

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
        customer = _get_customer_for_user(request.user, pk, "customer.view", "customer.view_all")
        followups = CustomerFollowUp.objects.filter(customer=customer).order_by("-followup_date")
        return Response(CustomerFollowUpSerializer(followups, many=True).data)

    def post(self, request, pk):
        customer = _get_customer_for_user(request.user, pk, "customer.view", "customer.view_all")
        salesperson = SalesPerson.objects.filter(user=request.user).first() or customer.salesperson
        if not salesperson:
            return Response({"error": "Link a salesperson to your account or assign one to this customer before scheduling follow-ups."}, status=400)

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
        customer = _get_customer_for_user(request.user, pk, "payment.view")
        payment_id = request.data.get("payment_id")
        action = request.data.get("action", "raise").lower()

        voucher_status = get_object_or_404(
            _payment_scope(request.user, "payment.view"), id=payment_id, customer=customer
        )

        thread, _ = PaymentDiscussionThread.objects.get_or_create(
            voucher_status=voucher_status
        )
        email_sent = False

        if action == "raise":
            thread.raise_ticket(request.user)
            PaymentTicketEvent.objects.create(thread=thread, event_type="RAISED", performed_by=request.user)
            from django.conf import settings
            from django.core.mail import EmailMultiAlternatives
            salesperson = customer.salesperson
            salesperson_email = salesperson.user.email if salesperson and salesperson.user else ""
            recipients = [salesperson_email] if salesperson_email else []
            cc = [address for address in ("abhijay.obluhc@gmail.com", request.user.email) if address]
            if recipients or cc:
                invoice = voucher_status.voucher.voucher_number if voucher_status.voucher else f"INV-{voucher_status.pk}"
                message = EmailMultiAlternatives(
                    subject=f"Payment ticket raised for {customer.name}",
                    body=(f"{request.user.username} raised a payment ticket.\n\n"
                          f"Customer: {customer.name}\nInvoice: {invoice}\n"
                          "Please review the payment thread in the CRM."),
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                    to=recipients,
                    cc=cc,
                )
                try:
                    email_sent = message.send(fail_silently=False) == 1
                except Exception:
                    email_sent = False
            else:
                email_sent = False
        elif action == "solve":
            thread.solve_ticket(request.user)
            PaymentTicketEvent.objects.create(thread=thread, event_type="SOLVED", performed_by=request.user)
            email_sent = False
        elif action == "expected":
            expected_date = request.data.get("expected_date")
            if not expected_date:
                return Response({"error": "expected_date is required."}, status=400)
            try:
                from datetime import date as date_type
                expected_date = date_type.fromisoformat(expected_date)
            except (TypeError, ValueError):
                return Response({"error": "expected_date must use YYYY-MM-DD format."}, status=400)
            PaymentExpectedDateHistory.objects.create(thread=thread, expected_date=expected_date, set_by=request.user)
            email_sent = False
        elif action == "remark":
            remark = str(request.data.get("remark") or "").strip()
            if not remark:
                return Response({"error": "remark is required."}, status=400)
            PaymentRemark.objects.create(thread=thread, remark=remark, created_by=request.user)
            email_sent = False
        elif action == "email":
            recipient = (customer.email or "").strip()
            if not recipient:
                return Response({"error": "This customer does not have an email address."}, status=400)
            from django.conf import settings
            from django.core.mail import EmailMultiAlternatives
            invoice = voucher_status.voucher.voucher_number if voucher_status.voucher else f"INV-{voucher_status.pk}"
            email = EmailMultiAlternatives(
                subject=f"Payment reminder for invoice {invoice}",
                body=(f"Dear {customer.name},\n\nThis is a reminder regarding invoice {invoice}. "
                      f"Outstanding amount: ₹{voucher_status.unpaid_amount or 0}.\n\n"
                      "Please contact our accounts team if you have already made this payment."),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                to=[recipient],
                cc=["finance@oblutools.com"],
            )
            if email.send(fail_silently=False) != 1:
                return Response({"error": "The reminder email could not be sent."}, status=502)
            email_sent = True
        else:
            return Response({"error": "Unsupported payment action."}, status=400)

        voucher_status.refresh_from_db()

        return Response(
            {
                "success": True,
                "ticket_status": thread.ticket_status,
                "email_sent": email_sent,
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
        active_cutoff = today - timezone.timedelta(days=90)
        active_customers_count = cust_qs.filter(
            voucher_statuses__voucher_type__iexact="TAX INVOICE",
            voucher_statuses__voucher_date__gte=active_cutoff,
        ).distinct().count()
        followups_due = CustomerFollowUp.objects.filter(
            followup_date__lte=today, is_completed=False
        )
        followups_due = followups_due.filter(customer__in=cust_qs)
        followups_due_count = followups_due.count()

        # Overdue payment vouchers
        overdue_qs = CustomerVoucherStatus.objects.filter(is_credit_period_crossed=True)
        overdue_qs = overdue_qs.filter(customer__in=cust_qs)
        overdue_count = overdue_qs.count()
        pending_customers_count = cust_qs.filter(
            credit_profile__outstanding_balance__gt=0
        ).distinct().count()

        # A real seven-day activity series for the same customers the user may
        # see. Remarks are touchpoints; scheduled follow-ups are counted by
        # their scheduled date. Empty days stay zero rather than using samples.
        week_start = today - timezone.timedelta(days=6)
        day_dates = [week_start + timezone.timedelta(days=offset) for offset in range(7)]
        remark_counts = {
            row["day"]: row["total"]
            for row in CustomerRemark.objects.filter(
                customer__in=cust_qs,
                created_at__date__range=(week_start, today),
            ).annotate(day=TruncDate("created_at")).values("day").annotate(total=Count("id"))
        }
        followup_counts = {
            row["followup_date"]: row["total"]
            for row in CustomerFollowUp.objects.filter(
                customer__in=cust_qs,
                followup_date__range=(week_start, today),
            ).values("followup_date").annotate(total=Count("id"))
        }
        weekly_activity = [{
            "date": day.isoformat(),
            "day": day.strftime("%a"),
            "interactions": remark_counts.get(day, 0),
            "followups": followup_counts.get(day, 0),
        } for day in day_dates]

        # Total outstanding
        total_balance = cust_qs.aggregate(
            total=Sum("credit_profile__outstanding_balance")
        )["total"] or 0

        # Leads count
        from leads.models import Lead
        leads_count = scope_queryset(request.user, "lead.view", Lead.objects.all()).count() if can(request.user, "lead.view") else 0

        return Response(
            {
                "totalCustomers": total_customers,
                "activeCustomersCount": active_customers_count,
                "followUpsDueCount": followups_due_count,
                "pendingPaymentsCount": pending_customers_count,
                "overduePaymentsCount": overdue_count,
                "weeklyCustomerActivity": weekly_activity,
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
        if not _has_customer_permission(request.user, "customer.view_all"):
            raise PermissionDenied("Customer analytics access is not enabled for this account.")
        cust_qs = _customer_scope(request.user, "customer.view_all")

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

        if tool == "team-customers":
            if not _has_customer_permission(request.user, "customer.view", "customer.view_all"):
                raise PermissionDenied("Team customer access is not enabled for this account.")
            cutoff = timezone.now().date() - timezone.timedelta(days=90)
            recent_tax_statuses = CustomerVoucherStatus.objects.filter(
                voucher_type__iexact="TAX INVOICE", voucher_date__gte=cutoff
            ).only("id", "customer_id", "voucher_date", "voucher_type")
            qs = _annotate_portfolio_metrics(_customer_scope(request.user, "customer.view", "customer.view_all")).select_related("salesperson", "unit_membership__unit").prefetch_related(
                Prefetch("voucher_statuses", queryset=recent_tax_statuses, to_attr="recent_tax_invoice_statuses")
            ).order_by("name")
            return Response(CustomerListSerializer(qs, many=True).data)

        if tool == "payment-followups":
            if not _has_customer_permission(request.user, "payment.view"):
                raise PermissionDenied("Payment follow-up access is not enabled for this account.")
            qs = CustomerVoucherStatus.objects.filter(
                Q(is_unpaid=True) | Q(is_partially_paid=True),
                pk__in=_payment_scope(request.user, "payment.view").values("pk"),
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
            if not _has_customer_permission(request.user, "customer.view", "customer.view_all", "payment.view"):
                raise PermissionDenied("Monthly sales access is not enabled for this account.")
            month = request.query_params.get("month", date.today().strftime("%Y-%m"))
            try:
                year, month_num = (int(x) for x in month.split("-", 1))
                start = date(year, month_num, 1)
                end = date(year, month_num, monthrange(year, month_num)[1])
            except (ValueError, TypeError):
                return Response({"error": "month must use YYYY-MM format"}, status=400)
            permitted_statuses = _payment_scope(request.user, "customer.view", "customer.view_all", "payment.view")
            status_qs = permitted_statuses.filter(
                voucher_type__iexact="TAX INVOICE", voucher_date__range=(start, end)
            ).select_related("customer", "voucher").order_by("voucher_date", "customer__name")
            selected_salesperson = request.query_params.get("salesperson")
            if selected_salesperson:
                status_qs = status_qs.filter(sold_by_id=selected_salesperson)

            from tally_voucher.models import VoucherStockItem
            voucher_ids = status_qs.values_list("voucher_id", flat=True)
            stock_items = VoucherStockItem.objects.filter(voucher_id__in=voucher_ids).select_related(
                "voucher", "item"
            ).order_by("voucher__date", "voucher_id", "id")
            status_by_voucher = {item.voucher_id: item for item in status_qs}
            rows = []
            total = 0
            counted_vouchers = set()
            for line in stock_items:
                vs = status_by_voucher.get(line.voucher_id)
                if not vs:
                    continue
                if line.voucher_id not in counted_vouchers:
                    party_row = line.voucher.rows.filter(ledger__iexact=line.voucher.party_name).first()
                    total += party_row.amount if party_row else (vs.voucher_amount or 0)
                    counted_vouchers.add(line.voucher_id)
                rows.append({
                    "id": f"{line.voucher_id}-{line.pk}",
                    "date": line.voucher.date,
                    "customer": line.voucher.party_name,
                    "voucher": line.voucher.voucher_number,
                    "product": line.item.name if line.item else "",
                    "quantity": line.quantity,
                    "amount": str(line.amount or 0),
                    "status": "paid" if vs.is_fully_paid or (vs.unpaid_amount or 0) == 0 else "pending",
                })
            return Response({"rows": rows, "total": str(total), "month": start.strftime("%Y-%m")})

        if tool == "cross-selling":
            if not _has_customer_permission(request.user, "customer.view"):
                raise PermissionDenied("Cross-Selling Matrix access is not enabled for this account.")
            from .views import (
                CROSS_SELLING_CATEGORIES, get_cross_selling_dataset,
                get_cross_selling_user_permissions, filter_cross_selling_customers,
            )
            category_names = {item["id"]: item["name"] for item in CROSS_SELLING_CATEGORIES}
            rows = []
            permissions = get_cross_selling_user_permissions(request.user)
            _, visible_items = filter_cross_selling_customers(
                get_cross_selling_dataset()["customers"], permissions,
                request.query_params.get("salesperson", ""),
            )
            for item in visible_items:
                customer = item.get("customer")
                if customer:
                    rows.append({"customer": customer.name, "customer_id": customer.pk,
                        "salesperson": customer.salesperson.name if customer.salesperson else "Unassigned",
                        "bought": item.get("bought_count", 0),
                        "missing": [category_names.get(key, key) for key in item.get("missing_cat_ids", [])]})
            return Response(rows)

        if tool in {"my-incentives", "rsm-incentives", "sales-head-incentives"}:
            from datetime import date
            from django.test import RequestFactory
            month = request.query_params.get("month_picker") or date.today().strftime("%Y-%m")

            def website_context(view_class, **query):
                website_request = RequestFactory().get("/", {"month_picker": month, **query})
                website_request.user = request.user
                website_view = view_class()
                website_view.setup(website_request)
                return website_view.get_context_data()

            allowed = is_admin(request.user) or request.user.is_staff or request.user.is_superuser or self._has_role(request.user, "sales_head", "business", "admin")
            if tool == "my-incentives":
                # Use the website calculator as the source of truth. It applies
                # the same employee identity, month, product rules and payment
                # logic without requiring pre-created payout ledger rows.
                from incentive_calculator.views import ASMIncentiveCalculatorPaidOnlyView5

                context = website_context(ASMIncentiveCalculatorPaidOnlyView5)
                rows = [{
                    "id": f"{row.get('voucher_id')}-{index}",
                    "date": row["date"].isoformat() if hasattr(row.get("date"), "isoformat") else str(row.get("date", "")),
                    "customer": row.get("customer", ""),
                    "voucher": row.get("voucher_no", ""),
                    "product": row.get("product", ""),
                    "quantity": str(row.get("quantity", 0)),
                    "amount": str(row.get("amount", 0)),
                    "paid": bool(row.get("is_fully_paid")),
                    "has_incentive": bool(row.get("has_incentive")),
                } for index, row in enumerate(context.get("rows", []))]
                product_totals = context.get("product_totals", {})
                return Response({
                    "rows": rows,
                    "month": month,
                    "summary": {
                        "potential": str(context.get("grand_total_incentive", 0)),
                        "payable": str(context.get("payable_incentive", 0)),
                        "pending": str(context.get("unpayable_incentive", 0)),
                        "total_sales": str(context.get("total_sales", 0)),
                    },
                    "products": [{
                        "name": name,
                        "quantity": str(values.get("paid_qty", 0)),
                        "rate": str(values.get("rate", 0)),
                        "potential": str(values.get("potential_payout", 0)),
                        "payable": str(values.get("ready_payout", 0)),
                    } for name, values in product_totals.items()],
                })
            elif tool == "rsm-incentives":
                if not (request.user.is_superuser or getattr(request.user, "is_accountant", False) or request.user.groups.filter(name="Accountant").exists() or self._has_role(request.user, "rsm", "sales_head", "admin")):
                    return Response({"error": "Team incentive access is not available for this account."}, status=403)
                from incentive_calculator.views import RSMTeamIncentiveDashboardView
                from customer_dashboard.models import SalesPerson as DashboardSalesPerson

                requested_rsm = request.query_params.get("rsm")
                linked_salesperson = DashboardSalesPerson.objects.filter(user=request.user).first()
                if not requested_rsm and linked_salesperson:
                    requested_rsm = str(linked_salesperson.pk)
                context = website_context(RSMTeamIncentiveDashboardView, **({"rsm": requested_rsm} if requested_rsm else {}))
                allowed_rsms = context.get("rsms")
                team_rows = []
                for asm in context.get("team_report", []):
                    for item in asm.get("items", []):
                        team_rows.append({
                            "id": f"{asm['asm_name']}-{len(team_rows)}",
                            "employee": asm["asm_name"],
                            "product": item.get("name", ""),
                            "quantity": str(item.get("qty", 0)),
                            "asm_incentive": str(item.get("asm_incentive", 0)),
                            "rsm_incentive": str(item.get("rsm_incentive", 0)),
                            "paid": bool(item.get("is_paid")),
                            "trigger_on": bool(item.get("is_trigger_on")),
                        })
                return Response({
                    "rows": team_rows,
                    "month": month,
                    "rsm": getattr(context.get("selected_rsm"), "name", ""),
                    "rsm_id": getattr(context.get("selected_rsm"), "pk", None),
                    "rsms": [{"id": person.pk, "name": person.name} for person in allowed_rsms] if allowed_rsms is not None else [],
                    "summary": {
                        "potential": str(context.get("grand_rsm_potential", 0)),
                        "payable": str(context.get("grand_rsm_paid", 0)),
                        "pending": str(context.get("grand_rsm_pending", 0)),
                        "blocked": str(context.get("grand_rsm_triggered_off", 0)),
                    },
                })

            elif tool == "sales-head-incentives":
                if not allowed or not self._has_role(request.user, "sales_head", "business", "admin") and not (request.user.is_staff or request.user.is_superuser):
                    return Response({"error": "Administrator access required."}, status=403)

                # Keep mobile Sales Head Incentives in sync with the website. The
                # website calculates the override from invoice line items; it does
                # not read IncentivePaymentStatus (which is the ASM payout ledger).
                from incentive_calculator.views import SalesHeadDashboardView

                dashboard = SalesHeadDashboardView()
                dashboard.setup(request)
                context = dashboard.get_context_data()
                rows = []
                for salesperson_report in context.get("report", []):
                    for item in salesperson_report.get("items", []):
                        rows.append({
                            "id": len(rows) + 1,
                            "employee": salesperson_report["name"],
                            "role": salesperson_report["role"],
                            "customer": item["customer"],
                            "product": item["product"],
                            "date": item["date"].isoformat() if hasattr(item["date"], "isoformat") else str(item["date"]),
                            "quantity": item["qty"],
                            "asm_incentive": str(item["asm"]),
                            "amount": str(item["head"]),
                            "status": item["status"],
                        })

                totals = context.get("totals", {})
                return Response({
                    "rows": rows,
                    "month": context.get("month_picker"),
                    "display_month": context.get("display_month"),
                    "summary": {
                        "potential": str(totals.get("potential", 0)),
                        "payable": str(totals.get("payable", 0)),
                        "pending": str(totals.get("pending", 0)),
                        "blocked": str(totals.get("blocked", 0)),
                    },
                })
            return Response([])

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
        if tool == "voucher-approvals":
            if not (request.user.is_staff or request.user.is_superuser or is_admin(request.user) or self._has_role(request.user, "accounts_operations")):
                return Response({"error": "Administrator access required."}, status=403)
            row = get_object_or_404(CustomerVoucherStatus, pk=request.data.get("id"), claim_status="PENDING")
            action = request.data.get("action")
            if action not in {"approve", "reject"}:
                return Response({"error": "action must be approve or reject"}, status=400)
            if action == "approve":
                row.sold_by = row.claim_requested_by
            row.claim_status = "APPROVED" if action == "approve" else "REJECTED"
            row.claim_requested_by = None
            row.save(update_fields=["sold_by", "claim_status", "claim_requested_by", "updated_at"])
            return Response({"success": True, "id": row.pk, "status": row.claim_status})

        if tool != "team-customers":
            return Response({"error": "This customer action is not available."}, status=404)
        user = request.user
        if not (user.is_superuser or user.is_staff or is_admin(user) or can(user, "customer.edit")):
            raise PermissionDenied("Customer edit access is not enabled for this account.")

        action = str(request.data.get("action", "")).strip().lower()
        unit_id = request.data.get("unit_id")
        visible_customers = _customer_scope(user, "customer.view", "customer.view_all")
        editable_customers = _customer_scope(user, "customer.edit")
        unit = get_object_or_404(
            CustomerUnit.objects.filter(memberships__customer__in=visible_customers).distinct(),
            pk=unit_id,
        )
        member_ids = list(unit.memberships.values_list("customer_id", flat=True))
        if not member_ids or editable_customers.filter(pk__in=member_ids).count() != len(member_ids):
            raise PermissionDenied("You can edit only units whose ledgers are inside your edit scope.")

        if action == "rename_unit":
            name = str(request.data.get("unit_name", "")).strip()
            if not name:
                return Response({"error": "Enter a name for this customer unit."}, status=400)
            if len(name) > 255:
                return Response({"error": "Unit names can be up to 255 characters."}, status=400)
            if CustomerUnit.objects.filter(salesperson_id=unit.salesperson_id, name__iexact=name).exclude(pk=unit.pk).exists():
                return Response({"error": "This salesperson already has a customer unit with that name."}, status=400)
            unit.name = name
            unit.save(update_fields=["name", "updated_at"])
            return Response({"success": True, "unit_id": unit.pk, "unit_name": unit.name})

        if action == "delete_unit":
            unit.delete()
            return Response({"success": True, "deleted": True})

        return Response({"error": "Unsupported customer unit action."}, status=400)

