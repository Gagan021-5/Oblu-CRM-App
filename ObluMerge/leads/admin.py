## ═══════════════════════════════════════════════════
##  leads/admin.py
## ═══════════════════════════════════════════════════
# Paste this into leads/admin.py

from django.contrib import admin
from .models import (
    LeadSource, LeadStage, ReasonCode, RemarkRelevance,
    Lead, LeadStageHistory, LeadFollowUp, LeadRemark, CallLog
)


@admin.register(LeadSource)
class LeadSourceAdmin(admin.ModelAdmin):
    list_display  = ["name", "source_type", "cost_per_lead", "is_active", "created_at"]
    list_filter   = ["source_type", "is_active"]
    search_fields = ["name"]


@admin.register(LeadStage)
class LeadStageAdmin(admin.ModelAdmin):
    list_display  = ["name", "order", "color", "is_closed", "is_won", "is_lost"]
    list_editable = ["order", "color", "is_closed", "is_won", "is_lost"]
    ordering      = ["order"]


@admin.register(ReasonCode)
class ReasonCodeAdmin(admin.ModelAdmin):
    list_display  = ["category", "label", "requires_price_data", "requires_why", "is_positive", "is_active"]
    list_editable = ["is_active"]


@admin.register(RemarkRelevance)
class RemarkRelevanceAdmin(admin.ModelAdmin):
    list_display = ["level", "label", "color"]


class LeadRemarkInline(admin.TabularInline):
    model  = LeadRemark
    extra  = 0
    fields = ["made_by", "remark", "reason_code", "relevance", "created_at"]
    readonly_fields = ["created_at"]


class CallLogInline(admin.TabularInline):
    model  = CallLog
    extra  = 0
    fields = ["called_by", "connection_status", "duration_minutes", "called_at"]
    readonly_fields = ["called_at"]


class LeadFollowUpInline(admin.TabularInline):
    model  = LeadFollowUp
    extra  = 0
    fields = ["salesperson", "followup_date", "note", "is_completed"]


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display    = ["name", "phone", "salesperson", "stage", "status", "source", "created_at"]
    list_filter     = ["status", "stage", "salesperson", "source"]
    search_fields   = ["name", "phone", "email"]
    inlines         = [CallLogInline, LeadRemarkInline, LeadFollowUpInline]
    date_hierarchy  = "created_at"


@admin.register(LeadStageHistory)
class LeadStageHistoryAdmin(admin.ModelAdmin):
    list_display = ["lead", "from_stage", "to_stage", "changed_by", "entered_at", "exited_at"]
    list_filter  = ["to_stage"]
    readonly_fields = ["entered_at"]


@admin.register(LeadRemark)
class LeadRemarkAdmin(admin.ModelAdmin):
    list_display = ["lead", "made_by", "reason_code", "relevance", "created_at"]
    list_filter  = ["reason_code", "relevance"]
    search_fields = ["remark", "lead__name"]


@admin.register(CallLog)
class CallLogAdmin(admin.ModelAdmin):
    list_display = ["lead", "called_by", "connection_status", "duration_minutes", "called_at"]
    list_filter  = ["connection_status"]