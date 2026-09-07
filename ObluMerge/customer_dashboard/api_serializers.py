"""
Customer Dashboard — REST API serializers for employee mobile app.
"""

from rest_framework import serializers
from .models import Customer, CustomerRemark, CustomerFollowUp


class CustomerListSerializer(serializers.ModelSerializer):
    """Compact customer list for the employee CRM screen."""

    salesperson_name = serializers.CharField(
        source="salesperson.name", read_only=True, default=""
    )
    followups_due = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "state",
            "district",
            "address",
            "salesperson_name",
            "followups_due",
            "created_at",
            "updated_at",
        ]

    def get_followups_due(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        return obj.followups.filter(
            followup_date__lte=today,
            is_completed=False,
        ).count()


class CustomerRemarkSerializer(serializers.ModelSerializer):
    salesperson_name = serializers.CharField(
        source="salesperson.name", read_only=True, default=""
    )

    class Meta:
        model = CustomerRemark
        fields = ["id", "remark", "salesperson_name", "created_at"]
        read_only_fields = ["id", "salesperson_name", "created_at"]


class CustomerFollowUpSerializer(serializers.ModelSerializer):
    salesperson_name = serializers.CharField(
        source="salesperson.name", read_only=True, default=""
    )
    customer_name = serializers.CharField(
        source="customer.name", read_only=True, default=""
    )

    class Meta:
        model = CustomerFollowUp
        fields = [
            "id",
            "customer",
            "customer_name",
            "salesperson_name",
            "note",
            "followup_date",
            "is_completed",
            "created_at",
            "completed_at",
        ]
        read_only_fields = [
            "id",
            "customer_name",
            "salesperson_name",
            "created_at",
            "completed_at",
        ]


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Full customer detail with recent remarks and followups."""

    salesperson_name = serializers.CharField(
        source="salesperson.name", read_only=True, default=""
    )
    remarks = serializers.SerializerMethodField()
    followups = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "state",
            "district",
            "address",
            "pincode",
            "salesperson_name",
            "remarks",
            "followups",
            "created_at",
            "updated_at",
        ]

    def get_remarks(self, obj):
        recent = obj.remarks.order_by("-created_at")[:20]
        return CustomerRemarkSerializer(recent, many=True).data

    def get_followups(self, obj):
        recent = obj.followups.order_by("-followup_date")[:10]
        return CustomerFollowUpSerializer(recent, many=True).data
