from django.db import models
from django.conf import settings
from django.utils import timezone
from customer_dashboard.models import SalesPerson
import json


# ─────────────────────────────────────────────
# 1.  LEAD SOURCE
# ─────────────────────────────────────────────
class LeadSource(models.Model):
    """
    Stores where a lead is coming from: Meta Ads, IndiaMart, Walk-in, etc.
    Each source can carry campaign-level metadata in `meta` (JSON).
    Cost-per-lead is optional and can be overridden on the lead itself.
    """

    class SourceType(models.TextChoices):
        META        = "META",       "Meta (Facebook / Instagram)"
        INDIAMART   = "INDIAMART",  "IndiaMart"
        JUSTDIAL    = "JUSTDIAL",   "Just Dial"
        REFERRAL    = "REFERRAL",   "Referral"
        WALK_IN     = "WALK_IN",    "Walk-in"
        WEBSITE     = "WEBSITE",    "Website"
        COLD_CALL   = "COLD_CALL",  "Cold Call"
        EXHIBITION  = "EXHIBITION", "Exhibition / Trade Show"
        WHATSAPP    = "WHATSAPP",   "WhatsApp Campaign"
        OTHER       = "OTHER",      "Other"

    name            = models.CharField(max_length=255, unique=True,
                                       help_text="e.g. 'Meta – Diwali Campaign 2025'")
    source_type     = models.CharField(max_length=20, choices=SourceType.choices,
                                       default=SourceType.OTHER)
    # Campaign / channel metadata (flexible JSON)
    # e.g. {"campaign_id": "123", "ad_set": "retargeting", "platform": "instagram"}
    campaign_meta   = models.JSONField(default=dict, blank=True,
                                       help_text="Any extra fields: campaign_id, ad_set, platform, etc.")
    cost_per_lead   = models.DecimalField(max_digits=10, decimal_places=2,
                                          null=True, blank=True,
                                          help_text="Average CPL for this source/campaign")
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_source_type_display()})"


# ─────────────────────────────────────────────
# 2.  LEAD STAGE  (configurable pipeline stages)
# ─────────────────────────────────────────────
class LeadStage(models.Model):
    """
    Represents a pipeline stage (New, Contacted, Quoted, etc.).
    Stages are ordered via `order` field and can be colour-coded.
    """
    name        = models.CharField(max_length=100, unique=True)
    order       = models.PositiveSmallIntegerField(default=0)
    color       = models.CharField(max_length=7, default="#6366f1",
                                   help_text="Hex color for Kanban column header")
    is_closed   = models.BooleanField(default=False,
                                      help_text="Mark as true for Won / Lost / Junk terminal stages")
    is_won      = models.BooleanField(default=False)
    is_lost     = models.BooleanField(default=False)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name


# ─────────────────────────────────────────────
# 3.  REASON CODE  (rich, self-describing)
# ─────────────────────────────────────────────
class ReasonCode(models.Model):
    """
    Structured reason codes for call/remark outcomes.
    Some reason categories trigger extra sub-fields.
    """

    class Category(models.TextChoices):
        NOT_INTERESTED      = "NOT_INTERESTED",      "Not Interested"
        PRICE_HIGH          = "PRICE_HIGH",          "Price Too High"
        NO_ANSWER           = "NO_ANSWER",           "Call Not Picked"
        BUSY                = "BUSY",                "Customer Busy / Asked to Call Later"
        STOCK_NA            = "STOCK_NA",            "Stock Not Available"
        ALREADY_PURCHASED   = "ALREADY_PURCHASED",   "Already Purchased Elsewhere"
        NEED_TIME           = "NEED_TIME",           "Need Time to Decide"
        WRONG_NUMBER        = "WRONG_NUMBER",        "Wrong Number"
        LANGUAGE_BARRIER    = "LANGUAGE_BARRIER",    "Language Barrier"
        POSITIVE_INTEREST   = "POSITIVE_INTEREST",   "Positive Interest"
        REQUESTED_CALLBACK  = "REQUESTED_CALLBACK",  "Requested Callback"
        QUOTATION_SENT      = "QUOTATION_SENT",      "Quotation Sent"
        ORDER_PLACED        = "ORDER_PLACED",        "Order Placed"
        OTHER               = "OTHER",               "Other"

    # Sub-reason for "Not Interested"
    class NotInterestedWhy(models.TextChoices):
        NO_NEED         = "NO_NEED",         "No current need"
        COMPETITOR      = "COMPETITOR",      "Using a competitor"
        BAD_EXPERIENCE  = "BAD_EXPERIENCE",  "Past bad experience"
        TOO_SMALL       = "TOO_SMALL",       "Business too small"
        OTHER           = "OTHER",           "Other"

    category            = models.CharField(max_length=30, choices=Category.choices, unique=True)
    label               = models.CharField(max_length=200,
                                           help_text="Human-readable label shown in dropdowns")
    requires_price_data = models.BooleanField(default=False,
                                              help_text="True for PRICE_HIGH – asks quoted/requested price+product")
    requires_why        = models.BooleanField(default=False,
                                              help_text="True for NOT_INTERESTED – asks why")
    is_positive         = models.BooleanField(default=False,
                                              help_text="True for outcomes that move lead forward")
    is_active           = models.BooleanField(default=True)

    class Meta:
        ordering = ["category"]

    def __str__(self):
        return self.label

    @classmethod
    def seed_defaults(cls):
        """Call from a migration or management command to pre-populate."""
        defaults = [
            ("NOT_INTERESTED",      "Not Interested",              False, True,  False),
            ("PRICE_HIGH",          "Price Too High",              True,  False, False),
            ("NO_ANSWER",           "Call Not Picked",             False, False, False),
            ("BUSY",                "Customer Busy",               False, False, False),
            ("STOCK_NA",            "Stock Not Available",         False, False, False),
            ("ALREADY_PURCHASED",   "Already Purchased Elsewhere", False, False, False),
            ("NEED_TIME",           "Need Time to Decide",         False, False, False),
            ("WRONG_NUMBER",        "Wrong Number",                False, False, False),
            ("LANGUAGE_BARRIER",    "Language Barrier",            False, False, False),
            ("POSITIVE_INTEREST",   "Positive Interest",           False, False, True),
            ("REQUESTED_CALLBACK",  "Requested Callback",          False, False, True),
            ("QUOTATION_SENT",      "Quotation Sent",              False, False, True),
            ("ORDER_PLACED",        "Order Placed",                False, False, True),
            ("OTHER",               "Other",                       False, False, False),
        ]
        for cat, lbl, req_price, req_why, positive in defaults:
            cls.objects.get_or_create(
                category=cat,
                defaults=dict(label=lbl, requires_price_data=req_price,
                              requires_why=req_why, is_positive=positive)
            )


# ─────────────────────────────────────────────
# 4.  REMARK RELEVANCE
# ─────────────────────────────────────────────
class RemarkRelevance(models.Model):
    """
    Tag on a remark to classify its quality/intent.
    Default choices: Relevant, Spam, Follow-up Required, Escalate
    """

    class Level(models.TextChoices):
        RELEVANT        = "RELEVANT",   "Relevant"
        SPAM            = "SPAM",       "Spam / Junk"
        FOLLOWUP_REQD   = "FOLLOWUP",   "Follow-up Required"
        ESCALATE        = "ESCALATE",   "Escalate to Manager"

    level       = models.CharField(max_length=20, choices=Level.choices, unique=True)
    label       = models.CharField(max_length=100)
    color       = models.CharField(max_length=7, default="#6366f1")

    class Meta:
        verbose_name_plural = "Remark Relevances"

    def __str__(self):
        return self.label


# ─────────────────────────────────────────────
# 5.  LEAD
# ─────────────────────────────────────────────
class Lead(models.Model):

    class Status(models.TextChoices):
        OPEN        = "OPEN",       "Open"
        WON         = "WON",        "Won"
        LOST        = "LOST",       "Lost"
        JUNK        = "JUNK",       "Junk / Spam"
        ON_HOLD     = "ON_HOLD",    "On Hold"

    # ── Core identity ──
    name        = models.CharField(max_length=255)
    phone       = models.CharField(max_length=50)
    email       = models.EmailField(null=True, blank=True)

    # ── Geography ──
    state       = models.CharField(max_length=128, null=True, blank=True)
    district    = models.CharField(max_length=128, null=True, blank=True)
    address     = models.TextField(null=True, blank=True)

    # ── Classification ──
    source      = models.ForeignKey(LeadSource, null=True, blank=True,
                                    on_delete=models.SET_NULL, related_name="leads")
    # CPL override (if this particular lead had a different cost)
    cost        = models.DecimalField(max_digits=10, decimal_places=2,
                                      null=True, blank=True,
                                      help_text="Leave blank to inherit from LeadSource.cost_per_lead")
    salesperson = models.ForeignKey(SalesPerson, null=True, blank=True,
                                    on_delete=models.SET_NULL, related_name="leads")
    stage       = models.ForeignKey(LeadStage, null=True, blank=True,
                                    on_delete=models.SET_NULL, related_name="leads")
    status      = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)

    # ── Flexible extra data ──
    extra_data  = models.JSONField(default=dict, blank=True,
                                   help_text="Any source-specific fields (e.g. IndiaMart query, product interest)")

    # ── Follow-up scheduling ──
    followup_date   = models.DateField(null=True, blank=True)
    followup_note   = models.TextField(blank=True)

    # ── Timestamps ──
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = (("name", "phone"),)

    def __str__(self):
        return f"{self.name} ({self.phone})"

    @property
    def effective_cost(self):
        if self.cost is not None:
            return self.cost
        if self.source and self.source.cost_per_lead is not None:
            return self.source.cost_per_lead
        return None

    @property
    def current_stage_name(self):
        return self.stage.name if self.stage else "Unassigned"

    @property
    def latest_remark(self):
        return self.lead_remarks.order_by("-created_at").first()

    @property
    def total_calls(self):
        return self.calls.count()

    @property
    def connected_calls(self):
        return self.calls.filter(connection_status=CallLog.ConnectionStatus.CONNECTED).count()


# ─────────────────────────────────────────────
# 6.  LEAD STAGE HISTORY  (audit trail)
# ─────────────────────────────────────────────
class LeadStageHistory(models.Model):
    """
    Every time a lead moves to a new stage, one record is inserted.
    The `time_spent_hours` is computed when the NEXT transition happens.
    """
    lead            = models.ForeignKey(Lead, on_delete=models.CASCADE,
                                        related_name="stage_history")
    from_stage      = models.ForeignKey(LeadStage, null=True, blank=True,
                                        on_delete=models.SET_NULL, related_name="+")
    to_stage        = models.ForeignKey(LeadStage, null=True, blank=True,
                                        on_delete=models.SET_NULL, related_name="+")
    changed_by      = models.ForeignKey(SalesPerson, null=True, blank=True,
                                        on_delete=models.SET_NULL)
    entered_at      = models.DateTimeField(default=timezone.now)
    exited_at       = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["entered_at"]

    def __str__(self):
        return (f"{self.lead.name}: "
                f"{self.from_stage or 'Start'} → {self.to_stage or '?'}")

    @property
    def time_spent_hours(self):
        if self.exited_at and self.entered_at:
            delta = self.exited_at - self.entered_at
            return round(delta.total_seconds() / 3600, 1)
        return None

    @property
    def time_spent_display(self):
        hrs = self.time_spent_hours
        if hrs is None:
            return "In Progress"
        if hrs < 24:
            return f"{hrs}h"
        days = hrs / 24
        return f"{days:.1f}d"


# ─────────────────────────────────────────────
# 7.  LEAD FOLLOW-UP
# ─────────────────────────────────────────────
class LeadFollowUp(models.Model):
    lead            = models.ForeignKey(Lead, on_delete=models.CASCADE,
                                        related_name="followups")
    salesperson     = models.ForeignKey(SalesPerson, on_delete=models.CASCADE,
                                        related_name="lead_followups")
    note            = models.TextField(blank=True)
    followup_date   = models.DateField()
    is_completed    = models.BooleanField(default=False)
    completed_at    = models.DateTimeField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["followup_date"]

    def __str__(self):
        return f"{self.lead.name} – {self.followup_date}"


# ─────────────────────────────────────────────
# 8.  LEAD REMARK
# ─────────────────────────────────────────────
class LeadRemark(models.Model):
    lead            = models.ForeignKey(Lead, on_delete=models.CASCADE,
                                        related_name="lead_remarks")
    made_by         = models.ForeignKey(SalesPerson, on_delete=models.CASCADE,
                                        related_name="lead_remarks")
    remark          = models.TextField()
    reason_code     = models.ForeignKey(ReasonCode, null=True, blank=True,
                                        on_delete=models.SET_NULL,
                                        related_name="remarks")
    relevance       = models.ForeignKey(RemarkRelevance, null=True, blank=True,
                                        on_delete=models.SET_NULL,
                                        related_name="remarks")
    created_at      = models.DateTimeField(auto_now_add=True)

    # ── Extra fields shown only when reason_code warrants them ──
    # For PRICE_HIGH
    quoted_price    = models.DecimalField(max_digits=12, decimal_places=2,
                                          null=True, blank=True)
    requested_price = models.DecimalField(max_digits=12, decimal_places=2,
                                          null=True, blank=True)
    product_discussed = models.CharField(max_length=255, null=True, blank=True)

    # For NOT_INTERESTED
    not_interested_why = models.CharField(
        max_length=30,
        choices=ReasonCode.NotInterestedWhy.choices,
        null=True, blank=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Remark by {self.made_by} on {self.lead}"


# ─────────────────────────────────────────────
# 9.  CALL LOG
# ─────────────────────────────────────────────
class CallLog(models.Model):
    """
    Records every call attempt on a lead.
    Optionally linked to the remark that was created after the call.
    """

    class ConnectionStatus(models.TextChoices):
        CONNECTED       = "CONNECTED",      "Connected"
        NOT_PICKED      = "NOT_PICKED",     "Not Picked"
        BUSY            = "BUSY",           "Busy"
        SWITCHED_OFF    = "SWITCHED_OFF",   "Switched Off"
        WRONG_NUMBER    = "WRONG_NUMBER",   "Wrong Number"
        VOICEMAIL       = "VOICEMAIL",      "Voicemail"

    lead                = models.ForeignKey(Lead, on_delete=models.CASCADE,
                                            related_name="calls")
    called_by           = models.ForeignKey(SalesPerson, null=True, blank=True,
                                            on_delete=models.SET_NULL,
                                            related_name="calls_made")
    remark              = models.OneToOneField(LeadRemark, null=True, blank=True,
                                               on_delete=models.SET_NULL,
                                               related_name="call")
    connection_status   = models.CharField(max_length=20,
                                           choices=ConnectionStatus.choices,
                                           default=ConnectionStatus.CONNECTED)
    duration_minutes    = models.PositiveSmallIntegerField(null=True, blank=True,
                                                           help_text="Call duration in minutes")
    called_at           = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-called_at"]

    def __str__(self):
        return (f"Call to {self.lead.name} "
                f"[{self.get_connection_status_display()}] "
                f"at {self.called_at:%d %b %H:%M}")