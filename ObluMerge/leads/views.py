import csv
import io
from datetime import date, timedelta

from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views import View
from django.views.decorators.http import require_POST
from django.views.generic import TemplateView, ListView

from customer_dashboard.models import SalesPerson
from inventory.mixins import AccountantRequiredMixin

from .forms import (
    CallLogForm, LeadCreateForm, LeadEditForm,
    LeadFollowUpForm, LeadRemarkForm, LeadUploadForm,
)
from .models import (
    CallLog, Lead, LeadFollowUp, LeadRemark,
    LeadSource, LeadStage, LeadStageHistory,
    ReasonCode, RemarkRelevance,
)


# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────

def _get_salesperson(user):
    return SalesPerson.objects.filter(user=user).first()


def _move_stage(lead, new_stage, changed_by_sp):
    """
    Close the current open stage-history record, create a new one.
    Also updates lead.stage.
    """
    now = timezone.now()
    # close previous open record
    LeadStageHistory.objects.filter(
        lead=lead, exited_at__isnull=True
    ).update(exited_at=now)

    LeadStageHistory.objects.create(
        lead=lead,
        from_stage=lead.stage,
        to_stage=new_stage,
        changed_by=changed_by_sp,
        entered_at=now,
    )
    lead.stage = new_stage

    # auto-update status for terminal stages
    if new_stage:
        if new_stage.is_won:
            lead.status = Lead.Status.WON
        elif new_stage.is_lost:
            lead.status = Lead.Status.LOST
    lead.save()


# ─────────────────────────────────────────────────────────────
# 1.  KANBAN BOARD  (salesperson view)
# ─────────────────────────────────────────────────────────────

class LeadKanbanView(LoginRequiredMixin, TemplateView):
    template_name = "leads/kanban.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        sp = _get_salesperson(self.request.user)

        if not sp:
            ctx["error"] = "No salesperson profile found."
            ctx["stages"] = []
            return ctx

        # Managers can filter by team member
        is_manager = sp.manager is None
        selected_member_id = self.request.GET.get("member")

        if is_manager:
            team = list(sp.team_members.all())
            if selected_member_id == "me":
                target_sp = sp
            elif selected_member_id:
                target_sp = SalesPerson.objects.filter(id=selected_member_id).first() or sp
            else:
                target_sp = sp
        else:
            target_sp = sp
            team = []

        stages = LeadStage.objects.order_by("order")
        today = date.today()

        stage_columns = []
        for stage in stages:
            leads_qs = Lead.objects.filter(
                salesperson=target_sp,
                stage=stage,
                status=Lead.Status.OPEN,
            ).select_related("source").prefetch_related("calls", "lead_remarks")

            enriched = []
            for lead in leads_qs:
                last_remark = lead.lead_remarks.order_by("-created_at").first()
                overdue = lead.followup_date and lead.followup_date < today
                enriched.append({
                    "lead":        lead,
                    "last_remark": last_remark,
                    "overdue":     overdue,
                    "call_count":  lead.calls.count(),
                })
            stage_columns.append({
                "stage":  stage,
                "leads":  enriched,
                "count":  len(enriched),
            })

        # Follow-ups for side panel
        followups = LeadFollowUp.objects.filter(
            salesperson=target_sp,
            is_completed=False,
        ).select_related("lead").order_by("followup_date")

        ctx.update({
            "stage_columns":  stage_columns,
            "is_manager":     is_manager,
            "team_members":   team,
            "selected_member": selected_member_id or "me",
            "target_sp":      target_sp,
            "followups_today":    followups.filter(followup_date=today),
            "followups_overdue":  followups.filter(followup_date__lt=today),
            "followups_upcoming": followups.filter(followup_date__gt=today),
        })
        return ctx


# ─────────────────────────────────────────────────────────────
# 2.  AJAX – MOVE LEAD TO NEW STAGE (drag & drop)
# ─────────────────────────────────────────────────────────────

@require_POST
def move_lead_stage(request):
    lead_id  = request.POST.get("lead_id")
    stage_id = request.POST.get("stage_id")

    lead  = get_object_or_404(Lead, id=lead_id)
    stage = get_object_or_404(LeadStage, id=stage_id)
    sp    = _get_salesperson(request.user)

    _move_stage(lead, stage, sp)
    return JsonResponse({"status": "ok", "new_stage": stage.name})


# ─────────────────────────────────────────────────────────────
# 3.  LEAD DETAIL
# ─────────────────────────────────────────────────────────────

class LeadDetailView(LoginRequiredMixin, TemplateView):
    template_name = "leads/lead_detail.html"

    def dispatch(self, request, *args, **kwargs):
        self.lead = get_object_or_404(Lead, pk=kwargs["pk"])
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx.update({
            "lead":            self.lead,
            "remarks":         self.lead.lead_remarks.select_related(
                                   "made_by", "reason_code", "relevance"
                               ).order_by("-created_at"),
            "calls":           self.lead.calls.select_related(
                                   "called_by", "remark"
                               ).order_by("-called_at"),
            "followups":       self.lead.followups.order_by("followup_date"),
            "stage_history":   self.lead.stage_history.select_related(
                                   "from_stage", "to_stage"
                               ).order_by("entered_at"),
            "stages":          LeadStage.objects.order_by("order"),
            "call_form":       CallLogForm(),
            "remark_form":     LeadRemarkForm(),
            "followup_form":   LeadFollowUpForm(),
            "reason_codes_json": _reason_codes_json(),
        })
        return ctx

    def post(self, request, *args, **kwargs):
        action = request.POST.get("action")
        sp = _get_salesperson(request.user)
        redirect_url = reverse("leads:lead_detail", args=[self.lead.pk])

        # ── Change Stage ──────────────────────────────────────
        if action == "change_stage":
            stage_id = request.POST.get("stage_id")
            stage = get_object_or_404(LeadStage, id=stage_id)
            _move_stage(self.lead, stage, sp)
            messages.success(request, f"Stage moved to '{stage.name}'.")
            return redirect(redirect_url)

        # ── Add Follow-up ─────────────────────────────────────
        if action == "add_followup":
            form = LeadFollowUpForm(request.POST)
            if form.is_valid():
                fu = form.save(commit=False)
                fu.lead = self.lead
                fu.salesperson = sp
                fu.save()
                messages.success(request, "Follow-up scheduled.")
            else:
                messages.error(request, "Invalid follow-up data.")
            return redirect(redirect_url)

        # ── Complete Follow-up ────────────────────────────────
        if action == "complete_followup":
            fid = request.POST.get("followup_id")
            fu = get_object_or_404(LeadFollowUp, id=fid, lead=self.lead)
            fu.is_completed = True
            fu.completed_at = timezone.now()
            fu.save()
            messages.success(request, "Follow-up marked complete.")
            return redirect(redirect_url)

        # ── Add Remark (standalone, no call) ──────────────────
        if action == "add_remark":
            form = LeadRemarkForm(request.POST)
            if form.is_valid():
                remark = form.save(commit=False)
                remark.lead = self.lead
                remark.made_by = sp
                remark.save()
                messages.success(request, "Remark added.")
            else:
                messages.error(request, "Invalid remark.")
            return redirect(redirect_url)

        messages.error(request, "Unknown action.")
        return redirect(redirect_url)


# ─────────────────────────────────────────────────────────────
# 4.  ADD CALL  (two-step: call info → remark)
# ─────────────────────────────────────────────────────────────

class AddCallView(LoginRequiredMixin, View):
    """
    POST step-1: Save CallLog, redirect to add-remark step.
    The call is pre-created; remark is attached afterwards.
    We do it in one POST to keep it slick.
    """
    template_name = "leads/add_call.html"

    def get(self, request, pk):
        lead = get_object_or_404(Lead, pk=pk)
        return render(request, self.template_name, {
            "lead":          lead,
            "call_form":     CallLogForm(),
            "remark_form":   LeadRemarkForm(),
            "reason_codes_json": _reason_codes_json(),
        })

    def post(self, request, pk):
        lead = get_object_or_404(Lead, pk=pk)
        sp   = _get_salesperson(request.user)

        call_form   = CallLogForm(request.POST)
        remark_form = LeadRemarkForm(request.POST)

        if call_form.is_valid():
            call = call_form.save(commit=False)
            call.lead      = lead
            call.called_by = sp
            call.save()

            # Save remark only if connected (or if text provided)
            remark_text = request.POST.get("remark", "").strip()
            if remark_form.is_valid() and remark_text:
                remark = remark_form.save(commit=False)
                remark.lead     = lead
                remark.made_by  = sp
                remark.save()
                call.remark = remark
                call.save()

            messages.success(request, "Call logged successfully.")
            return redirect(reverse("leads:lead_detail", args=[lead.pk]))

        messages.error(request, "Please fix the errors below.")
        return render(request, self.template_name, {
            "lead":          lead,
            "call_form":     call_form,
            "remark_form":   remark_form,
            "reason_codes_json": _reason_codes_json(),
        })


# ─────────────────────────────────────────────────────────────
# 5.  LEAD CREATE / EDIT
# ─────────────────────────────────────────────────────────────

class LeadCreateView(LoginRequiredMixin, View):
    template_name = "leads/lead_form.html"

    def get(self, request):
        return render(request, self.template_name, {
            "form": LeadCreateForm(),
            "title": "Add New Lead",
        })

    def post(self, request):
        form = LeadCreateForm(request.POST)
        if form.is_valid():
            lead = form.save()
            sp = _get_salesperson(request.user)
            if lead.stage:
                LeadStageHistory.objects.create(
                    lead=lead, to_stage=lead.stage, changed_by=sp
                )
            messages.success(request, f"Lead '{lead.name}' created.")
            return redirect(reverse("leads:lead_detail", args=[lead.pk]))
        return render(request, self.template_name, {
            "form": form, "title": "Add New Lead"
        })


class LeadEditView(LoginRequiredMixin, View):
    template_name = "leads/lead_form.html"

    def get(self, request, pk):
        lead = get_object_or_404(Lead, pk=pk)
        return render(request, self.template_name, {
            "form":  LeadEditForm(instance=lead),
            "lead":  lead,
            "title": "Edit Lead",
        })

    def post(self, request, pk):
        lead = get_object_or_404(Lead, pk=pk)
        old_stage = lead.stage
        form = LeadEditForm(request.POST, instance=lead)
        if form.is_valid():
            updated = form.save(commit=False)
            sp = _get_salesperson(request.user)
            if updated.stage != old_stage:
                _move_stage(updated, updated.stage, sp)
            else:
                updated.save()
            messages.success(request, "Lead updated.")
            return redirect(reverse("leads:lead_detail", args=[lead.pk]))
        return render(request, self.template_name, {
            "form": form, "lead": lead, "title": "Edit Lead"
        })


# ─────────────────────────────────────────────────────────────
# 6.  LEAD LIST  (admin / accountant)
# ─────────────────────────────────────────────────────────────

class LeadListView(AccountantRequiredMixin, ListView):
    model               = Lead
    template_name       = "leads/lead_list.html"
    context_object_name = "leads"
    paginate_by         = 50

    def get_queryset(self):
        qs = Lead.objects.select_related("salesperson", "stage", "source")
        sp_id   = self.request.GET.get("salesperson")
        status  = self.request.GET.get("status")
        stage_id = self.request.GET.get("stage")
        search  = self.request.GET.get("search", "")
        source_id = self.request.GET.get("source")

        if sp_id:
            qs = qs.filter(salesperson_id=sp_id)
        if status:
            qs = qs.filter(status=status)
        if stage_id:
            qs = qs.filter(stage_id=stage_id)
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(phone__icontains=search)
        if source_id:
            qs = qs.filter(source_id=source_id)

        return qs.order_by("-created_at")

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["salespersons"] = SalesPerson.objects.order_by("name")
        ctx["stages"]       = LeadStage.objects.order_by("order")
        ctx["sources"]      = LeadSource.objects.filter(is_active=True).order_by("name")
        ctx["status_choices"] = Lead.Status.choices
        q = self.request.GET.copy()
        q.pop("page", None)
        ctx["querystring"] = q.urlencode()
        return ctx


# ─────────────────────────────────────────────────────────────
# 7.  BULK UPLOAD
# ─────────────────────────────────────────────────────────────

class LeadUploadView(AccountantRequiredMixin, View):
    template_name = "leads/lead_upload.html"

    def get(self, request):
        return render(request, self.template_name, {"form": LeadUploadForm()})

    def post(self, request):
        form = LeadUploadForm(request.POST, request.FILES)
        if not form.is_valid():
            return render(request, self.template_name, {"form": form})

        uploaded_file = request.FILES["file"]
        salesperson   = form.cleaned_data.get("salesperson")
        source        = form.cleaned_data.get("source")

        # Detect CSV vs Excel
        filename = uploaded_file.name.lower()
        rows_created = 0
        rows_skipped = 0
        errors       = []

        try:
            if filename.endswith(".csv"):
                decoded = uploaded_file.read().decode("utf-8-sig")
                reader  = csv.DictReader(io.StringIO(decoded))
                rows    = list(reader)
            else:
                import openpyxl
                wb   = openpyxl.load_workbook(uploaded_file, data_only=True)
                ws   = wb.active
                hdrs = [str(c.value).strip() if c.value else "" for c in next(ws.iter_rows(min_row=1, max_row=1))]
                rows = []
                for row in ws.iter_rows(min_row=2, values_only=True):
                    rows.append(dict(zip(hdrs, row)))
        except Exception as e:
            messages.error(request, f"Could not read file: {e}")
            return render(request, self.template_name, {"form": form})

        default_stage = LeadStage.objects.order_by("order").first()

        for i, row in enumerate(rows, start=2):
            name  = str(row.get("name") or row.get("Name") or "").strip()
            phone = str(row.get("phone") or row.get("Phone") or row.get("mobile") or "").strip()

            if not name or not phone:
                rows_skipped += 1
                errors.append(f"Row {i}: missing name or phone.")
                continue

            try:
                Lead.objects.create(
                    name        = name,
                    phone       = phone,
                    email       = (row.get("email") or row.get("Email") or "").strip() or None,
                    state       = (row.get("state") or row.get("State") or "").strip() or None,
                    district    = (row.get("district") or "").strip() or None,
                    address     = (row.get("address") or "").strip() or None,
                    salesperson = salesperson,
                    source      = source,
                    stage       = default_stage,
                    status      = Lead.Status.OPEN,
                )
                rows_created += 1
            except IntegrityError:
                rows_skipped += 1
                errors.append(f"Row {i}: '{name}' / '{phone}' already exists.")

        messages.success(
            request,
            f"Upload complete — {rows_created} created, {rows_skipped} skipped."
        )
        if errors:
            for e in errors[:10]:
                messages.warning(request, e)

        return redirect("leads:lead_list")


# ─────────────────────────────────────────────────────────────
# 8.  FOLLOW-UP DASHBOARD
# ─────────────────────────────────────────────────────────────

class LeadFollowUpDashboardView(LoginRequiredMixin, TemplateView):
    template_name = "leads/followup_dashboard.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        sp    = _get_salesperson(self.request.user)
        today = date.today()

        base = LeadFollowUp.objects.filter(
            salesperson=sp, is_completed=False
        ).select_related("lead", "lead__stage").order_by("followup_date")

        ctx.update({
            "followups_overdue":  base.filter(followup_date__lt=today),
            "followups_today":    base.filter(followup_date=today),
            "followups_upcoming": base.filter(followup_date__gt=today),
            "sp": sp,
        })
        return ctx


# ─────────────────────────────────────────────────────────────
# 9.  LEAD SOURCE MANAGEMENT
# ─────────────────────────────────────────────────────────────

class LeadSourceListView(AccountantRequiredMixin, TemplateView):
    template_name = "leads/lead_sources.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["sources"] = LeadSource.objects.annotate(
            lead_count=__import__("django.db.models", fromlist=["Count"]).Count("leads")
        ).order_by("name")
        return ctx


# ─────────────────────────────────────────────────────────────
# 10. AJAX – REASON CODE METADATA
# ─────────────────────────────────────────────────────────────

def reason_code_meta(request):
    """
    Returns JSON metadata for all active reason codes.
    Used by JS to show/hide conditional fields in the remark form.
    """
    data = {
        rc.category: {
            "requires_price_data": rc.requires_price_data,
            "requires_why":        rc.requires_why,
            "is_positive":         rc.is_positive,
        }
        for rc in ReasonCode.objects.filter(is_active=True)
    }
    return JsonResponse(data)


def _reason_codes_json():
    import json
    data = {
        rc.id: {
            "category":          rc.category,
            "requires_price":    rc.requires_price_data,
            "requires_why":      rc.requires_why,
        }
        for rc in ReasonCode.objects.filter(is_active=True)
    }
    return json.dumps(data)