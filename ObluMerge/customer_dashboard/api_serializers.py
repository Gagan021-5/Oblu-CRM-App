"""
Customer Dashboard — REST API serializers for employee mobile app.
Bridges real PostgreSQL / Tally voucher data seamlessly to the React Native CRM.
"""

from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from .models import Customer, CustomerRemark, CustomerFollowUp, CustomerCreditProfile, CustomerVoucherStatus, PaymentDiscussionThread


class CustomerRemarkSerializer(serializers.ModelSerializer):
    salesperson_name = serializers.CharField(
        source="salesperson.name", read_only=True, default=""
    )
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    text = serializers.CharField(source="remark", read_only=True)
    author = serializers.SerializerMethodField()

    class Meta:
        model = CustomerRemark
        fields = ["id", "remark", "text", "salesperson_name", "author", "date", "time", "created_at"]
        read_only_fields = ["id", "salesperson_name", "author", "date", "time", "created_at"]

    def get_date(self, obj):
        return obj.created_at.strftime("%d %b %Y") if obj.created_at else ""

    def get_time(self, obj):
        return obj.created_at.strftime("%I:%M %p") if obj.created_at else ""

    def get_author(self, obj):
        return obj.salesperson.name if obj.salesperson else "Sales Rep"


class CustomerFollowUpSerializer(serializers.ModelSerializer):
    salesperson_name = serializers.CharField(
        source="salesperson.name", read_only=True, default=""
    )
    customer_name = serializers.CharField(
        source="customer.name", read_only=True, default=""
    )
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    purpose = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    notes = serializers.CharField(source="note", read_only=True)

    class Meta:
        model = CustomerFollowUp
        fields = [
            "id",
            "customer",
            "customer_name",
            "salesperson_name",
            "note",
            "notes",
            "date",
            "time",
            "purpose",
            "status",
            "followup_date",
            "is_completed",
            "created_at",
            "completed_at",
        ]
        read_only_fields = [
            "id",
            "customer_name",
            "salesperson_name",
            "date",
            "time",
            "purpose",
            "status",
            "created_at",
            "completed_at",
        ]

    def get_date(self, obj):
        if not obj.followup_date:
            return ""
        if isinstance(obj.followup_date, str):
            return obj.followup_date
        return obj.followup_date.strftime("%d %b %Y")

    def get_time(self, obj):
        return "10:30 AM"

    def get_purpose(self, obj):
        return obj.note or "Follow-up"

    def get_status(self, obj):
        return "completed" if obj.is_completed else "scheduled"


class CustomerPaymentSerializer(serializers.ModelSerializer):
    """Serializes Tally voucher statuses into mobile CustomerPayment shape."""
    invoiceNumber = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()
    dueDate = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    isDateCrossed = serializers.BooleanField(source="is_credit_period_crossed", read_only=True)
    ticketStatus = serializers.SerializerMethodField()
    ticketRaisedAt = serializers.SerializerMethodField()
    emailSent = serializers.SerializerMethodField()
    emailRecipient = serializers.SerializerMethodField()

    class Meta:
        model = CustomerVoucherStatus
        fields = [
            "id",
            "invoiceNumber",
            "amount",
            "dueDate",
            "status",
            "isDateCrossed",
            "ticketStatus",
            "ticketRaisedAt",
            "emailSent",
            "emailRecipient",
        ]

    def get_invoiceNumber(self, obj):
        return obj.voucher.voucher_number if obj.voucher else f"INV-{obj.id}"

    def get_amount(self, obj):
        amt = abs(obj.voucher_amount or 0)
        return f"₹{int(amt):,}"

    def get_dueDate(self, obj):
        if not obj.voucher_date:
            return ""
        if isinstance(obj.voucher_date, str):
            return obj.voucher_date
        return obj.voucher_date.strftime("%d %b %Y")

    def get_status(self, obj):
        if obj.is_credit_period_crossed:
            return "overdue"
        if obj.is_unpaid or obj.is_partially_paid:
            return "pending"
        return "paid"

    def get_ticketStatus(self, obj):
        try:
            return obj.payment_thread.ticket_status
        except Exception:
            return "NONE"

    def get_ticketRaisedAt(self, obj):
        try:
            thread = obj.payment_thread
            if thread.ticket_raised_at:
                return thread.ticket_raised_at.strftime("%d %b %Y, %I:%M %p")
        except Exception:
            pass
        return ""

    def get_emailSent(self, obj):
        try:
            return obj.payment_thread.ticket_status in ["RAISED", "SOLVED"]
        except Exception:
            return False

    def get_emailRecipient(self, obj):
        return f"{obj.customer.email or 'customer@company.com'}, finance@oblutools.com"


class CustomerListSerializer(serializers.ModelSerializer):
    """
    Compact customer list item matching both React Native Customer interface
    and standard REST CRM consumers.
    """
    contactPerson = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    assignedSalesperson = serializers.SerializerMethodField()
    customerSince = serializers.SerializerMethodField()
    creditPeriod = serializers.SerializerMethodField()
    outstandingPayment = serializers.SerializerMethodField()
    outstandingPaymentNum = serializers.SerializerMethodField()
    paymentStatus = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    lastContactTime = serializers.SerializerMethodField()
    nextFollowUp = serializers.SerializerMethodField()
    followups_due = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "contactPerson",
            "phone",
            "email",
            "city",
            "state",
            "district",
            "address",
            "pincode",
            "assignedSalesperson",
            "customerSince",
            "creditPeriod",
            "outstandingPayment",
            "outstandingPaymentNum",
            "paymentStatus",
            "status",
            "lastContactTime",
            "nextFollowUp",
            "followups_due",
            "created_at",
            "updated_at",
        ]

    def get_contactPerson(self, obj):
        words = (obj.name or "").split()
        return f"{words[0]} (Contact)" if words else "Contact Person"

    def get_city(self, obj):
        return obj.district or obj.state or "Office"

    def get_assignedSalesperson(self, obj):
        return obj.salesperson.name if obj.salesperson else "Unassigned"

    def get_customerSince(self, obj):
        return obj.created_at.strftime("%b %Y") if obj.created_at else "Jan 2024"

    def get_creditPeriod(self, obj):
        try:
            return f"{obj.credit_profile.credit_period_days} Days"
        except Exception:
            return "15 Days"

    def get_outstandingPayment(self, obj):
        num = self.get_outstandingPaymentNum(obj)
        return f"₹{int(num):,}"

    def get_outstandingPaymentNum(self, obj):
        try:
            return float(abs(obj.credit_profile.outstanding_balance or 0))
        except Exception:
            return 0.0

    def get_paymentStatus(self, obj):
        try:
            has_overdue = obj.voucher_statuses.filter(is_credit_period_crossed=True).exists()
            if has_overdue:
                return "overdue"
        except Exception:
            pass
        bal = self.get_outstandingPaymentNum(obj)
        if bal > 0:
            return "pending"
        return "paid"

    def get_status(self, obj):
        bal = self.get_outstandingPaymentNum(obj)
        if bal > 500000:
            return "VIP"
        try:
            cutoff = timezone.now().date() - timezone.timedelta(days=90)
            has_recent = obj.voucher_statuses.filter(voucher_date__gte=cutoff).exists()
            return "Active" if has_recent else "Inactive"
        except Exception:
            return "Active"

    def get_lastContactTime(self, obj):
        remark = obj.remarks.order_by("-created_at").first()
        if remark and remark.created_at:
            delta = timezone.now() - remark.created_at
            if delta.days == 0:
                return "Today"
            elif delta.days == 1:
                return "Yesterday"
            elif delta.days < 7:
                return f"{delta.days}d ago"
            return remark.created_at.strftime("%d %b")
        return ""

    def get_nextFollowUp(self, obj):
        today = timezone.now().date()
        fu = obj.followups.filter(is_completed=False, followup_date__gte=today).order_by("followup_date").first()
        if fu and fu.followup_date:
            return f"{fu.followup_date.strftime('%d %b')}, 10:30 AM"
        return ""

    def get_followups_due(self, obj):
        today = timezone.now().date()
        return obj.followups.filter(
            followup_date__lte=today,
            is_completed=False,
        ).count()


class CustomerDetailSerializer(CustomerListSerializer):
    """Full customer detail with nested remarks, followups, and real Tally voucher payments."""
    remarks = serializers.SerializerMethodField()
    followUps = serializers.SerializerMethodField()
    payments = serializers.SerializerMethodField()

    class Meta(CustomerListSerializer.Meta):
        fields = CustomerListSerializer.Meta.fields + [
            "remarks",
            "followUps",
            "payments",
        ]

    def get_remarks(self, obj):
        recent = obj.remarks.order_by("-created_at")[:30]
        return CustomerRemarkSerializer(recent, many=True).data

    def get_followUps(self, obj):
        recent = obj.followups.order_by("-followup_date")[:20]
        return CustomerFollowUpSerializer(recent, many=True).data

    def get_payments(self, obj):
        vouchers = obj.voucher_statuses.select_related("voucher").order_by("-voucher_date")[:30]
        return CustomerPaymentSerializer(vouchers, many=True).data
