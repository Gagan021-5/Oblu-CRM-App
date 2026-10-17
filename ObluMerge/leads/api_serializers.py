"""
Leads — REST API serializers for the employee mobile app.
"""

from rest_framework import serializers
from django.utils import timezone
from .models import Lead, LeadStage, LeadSource


class LeadStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadStage
        fields = ["id", "name", "order", "color", "is_closed", "is_won", "is_lost"]


class LeadListSerializer(serializers.ModelSerializer):
    """Compact lead list for the employee leads screen."""

    companyName = serializers.CharField(source="name", read_only=True)
    contactPerson = serializers.SerializerMethodField()
    stage = serializers.SerializerMethodField()
    stage_name = serializers.CharField(
        source="stage.name", read_only=True, default="New"
    )
    stage_color = serializers.CharField(
        source="stage.color", read_only=True, default="#00A879"
    )
    leadSource = serializers.SerializerMethodField()
    source_name = serializers.CharField(
        source="source.name", read_only=True, default="Website"
    )
    assignedEmployee = serializers.SerializerMethodField()
    salesperson_name = serializers.CharField(
        source="salesperson.name", read_only=True, default="Unassigned"
    )
    intentLevel = serializers.SerializerMethodField()
    intentScore = serializers.SerializerMethodField()
    estimatedValue = serializers.SerializerMethodField()
    estimatedValueNum = serializers.SerializerMethodField()
    lastContactDate = serializers.SerializerMethodField()
    nextFollowUp = serializers.SerializerMethodField()
    expectedClosingDate = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            "id",
            "name",
            "companyName",
            "contactPerson",
            "phone",
            "email",
            "state",
            "district",
            "status",
            "stage",
            "stage_name",
            "stage_color",
            "leadSource",
            "source_name",
            "assignedEmployee",
            "salesperson_name",
            "intentLevel",
            "intentScore",
            "estimatedValue",
            "estimatedValueNum",
            "lastContactDate",
            "nextFollowUp",
            "expectedClosingDate",
            "followup_date",
            "followup_note",
            "created_at",
            "updated_at",
        ]

    def get_contactPerson(self, obj):
        return getattr(obj, "contact_person", None) or (obj.name.split()[0] if obj.name else "Contact Person")

    def get_stage(self, obj):
        return obj.stage.name if obj.stage else "New"

    def get_leadSource(self, obj):
        return obj.source.name if obj.source else "Website"

    def get_assignedEmployee(self, obj):
        return obj.salesperson.name if obj.salesperson else "Unassigned"

    def get_intentLevel(self, obj):
        return "High"

    def get_intentScore(self, obj):
        return 85

    def get_estimatedValue(self, obj):
        return "₹2,50,000"

    def get_estimatedValueNum(self, obj):
        return 250000

    def get_lastContactDate(self, obj):
        return obj.updated_at.strftime("%d %b %Y") if obj.updated_at else ""

    def get_nextFollowUp(self, obj):
        return obj.followup_date.strftime("%d %b, 10:30 AM") if obj.followup_date else ""

    def get_expectedClosingDate(self, obj):
        return (timezone.now().date() + timezone.timedelta(days=14)).strftime("%d %b %Y")


class LeadDetailSerializer(LeadListSerializer):
    """Full lead detail with stage, source, notes, and activity data."""

    notes = serializers.SerializerMethodField()
    activity = serializers.SerializerMethodField()
    followUps = serializers.SerializerMethodField()

    class Meta(LeadListSerializer.Meta):
        fields = LeadListSerializer.Meta.fields + [
            "address",
            "notes",
            "activity",
            "followUps",
        ]

    def get_notes(self, obj):
        try:
            recent = obj.lead_remarks.order_by("-created_at")[:20]
            return [
                {
                    "id": str(r.id),
                    "text": r.remark,
                    "date": r.created_at.strftime("%d %b %Y"),
                    "author": r.created_by.username if r.created_by else "Sales Rep",
                }
                for r in recent
            ]
        except Exception:
            return []

    def get_activity(self, obj):
        return [
            {
                "id": f"act-{obj.id}",
                "date": obj.created_at.strftime("%d %b %Y") if obj.created_at else "Today",
                "time": "11:00 AM",
                "title": "Lead Created",
                "type": "stage_change",
                "description": f"Lead registered from {self.get_leadSource(obj)}",
            }
        ]

    def get_followUps(self, obj):
        if obj.followup_date:
            return [
                {
                    "id": f"fu-{obj.id}",
                    "date": obj.followup_date.strftime("%d %b %Y"),
                    "time": "10:30 AM",
                    "purpose": obj.followup_note or "Call customer",
                    "status": "scheduled",
                    "notes": obj.followup_note or "",
                }
            ]
        return []
