"""
Leads — REST API serializers for the employee mobile app.
"""

from rest_framework import serializers
from .models import Lead, LeadStage


class LeadStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadStage
        fields = ["id", "name", "order", "color", "is_closed", "is_won", "is_lost"]


class LeadListSerializer(serializers.ModelSerializer):
    """Compact lead list for the employee leads screen."""

    stage_name = serializers.CharField(
        source="stage.name", read_only=True, default="Unassigned"
    )
    stage_color = serializers.CharField(
        source="stage.color", read_only=True, default="#6366f1"
    )
    source_name = serializers.CharField(
        source="source.name", read_only=True, default=""
    )
    salesperson_name = serializers.CharField(
        source="salesperson.name", read_only=True, default=""
    )

    class Meta:
        model = Lead
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "state",
            "district",
            "status",
            "stage_name",
            "stage_color",
            "source_name",
            "salesperson_name",
            "followup_date",
            "followup_note",
            "created_at",
            "updated_at",
        ]


class LeadDetailSerializer(serializers.ModelSerializer):
    """Full lead detail with stage, source, and activity data."""

    stage_name = serializers.CharField(
        source="stage.name", read_only=True, default="Unassigned"
    )
    stage_color = serializers.CharField(
        source="stage.color", read_only=True, default="#6366f1"
    )
    source_name = serializers.CharField(
        source="source.name", read_only=True, default=""
    )
    salesperson_name = serializers.CharField(
        source="salesperson.name", read_only=True, default=""
    )
    remarks = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "state",
            "district",
            "address",
            "status",
            "stage_name",
            "stage_color",
            "source_name",
            "salesperson_name",
            "followup_date",
            "followup_note",
            "extra_data",
            "remarks",
            "created_at",
            "updated_at",
        ]

    def get_remarks(self, obj):
        recent = obj.lead_remarks.order_by("-created_at")[:20]
        return [
            {
                "id": r.id,
                "remark": r.remark,
                "created_at": r.created_at.isoformat(),
                "created_by": r.created_by.username if r.created_by else "",
            }
            for r in recent
        ]
