from django.urls import path
from . import views

app_name = "leads"

urlpatterns = [
    # ── Kanban board (salesperson home) ──────────────────────
    path("",                views.LeadKanbanView.as_view(),         name="kanban"),

    # ── Lead CRUD ─────────────────────────────────────────────
    path("list/",           views.LeadListView.as_view(),           name="lead_list"),
    path("create/",         views.LeadCreateView.as_view(),         name="lead_create"),
    path("<int:pk>/",       views.LeadDetailView.as_view(),         name="lead_detail"),
    path("<int:pk>/edit/",  views.LeadEditView.as_view(),           name="lead_edit"),

    # ── Call logging ─────────────────────────────────────────
    path("<int:pk>/call/",  views.AddCallView.as_view(),            name="add_call"),

    # ── Bulk upload ──────────────────────────────────────────
    path("upload/",         views.LeadUploadView.as_view(),         name="lead_upload"),

    # ── Follow-ups ───────────────────────────────────────────
    path("followups/",      views.LeadFollowUpDashboardView.as_view(), name="followup_dashboard"),

    # ── Sources ──────────────────────────────────────────────
    path("sources/",        views.LeadSourceListView.as_view(),     name="lead_sources"),

    # ── AJAX endpoints ───────────────────────────────────────
    path("ajax/move-stage/",     views.move_lead_stage,             name="move_stage"),
    path("ajax/reason-meta/",    views.reason_code_meta,            name="reason_code_meta"),
]