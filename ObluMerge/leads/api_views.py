"""
Leads — REST API views for the employee mobile app.
"""

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Lead, LeadStage, LeadSource, LeadRemark
from .api_serializers import LeadListSerializer, LeadDetailSerializer, LeadStageSerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class LeadListView(generics.ListCreateAPIView):
    """
    GET  /api/leads/?stage=&search=
    POST /api/leads/
    """
    serializer_class = LeadListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = Lead.objects.select_related("stage", "source", "salesperson").order_by("-created_at")

        stage = self.request.query_params.get("stage", "").strip()
        if stage and stage.lower() != "all":
            qs = qs.filter(stage__name__iexact=stage)

        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(phone__icontains=search)
                | Q(email__icontains=search)
                | Q(state__icontains=search)
                | Q(district__icontains=search)
            )

        return qs

    def perform_create(self, serializer):
        stage_name = self.request.data.get("stage", "New")
        stage = LeadStage.objects.filter(name__iexact=stage_name).first()
        if not stage:
            stage, _ = LeadStage.objects.get_or_create(name="New", defaults={"order": 1, "color": "#00A879"})

        source_name = self.request.data.get("leadSource") or self.request.data.get("source", "Website")
        source, _ = LeadSource.objects.get_or_create(name=source_name)

        serializer.save(stage=stage, source=source)


class LeadDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/leads/{id}/
    PATCH /api/leads/{id}/
    """
    serializer_class = LeadDetailSerializer
    permission_classes = [IsAuthenticated]
    queryset = Lead.objects.select_related("stage", "source", "salesperson").prefetch_related("lead_remarks")


class LeadStageUpdateView(APIView):
    """
    PATCH /api/leads/{id}/stage/
    Payload: {"stage": "Contacted"}
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        lead = get_object_or_404(Lead, pk=pk)
        stage_name = request.data.get("stage")
        if not stage_name:
            return Response({"error": "Stage name is required."}, status=status.HTTP_400_BAD_REQUEST)

        stage, _ = LeadStage.objects.get_or_create(name=stage_name)
        lead.stage = stage
        lead.save(update_fields=["stage", "updated_at"])

        return Response(LeadDetailSerializer(lead).data)


class LeadStagesListView(APIView):
    """
    GET /api/leads/stages/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stages = LeadStage.objects.all().order_by("order")
        if not stages.exists():
            for idx, (name, color) in enumerate([("New", "#00A879"), ("Contacted", "#35D6A0"), ("Qualified", "#4E95FF"), ("Proposal", "#F3B84B"), ("Won", "#19C997")]):
                LeadStage.objects.get_or_create(name=name, defaults={"order": idx, "color": color})
            stages = LeadStage.objects.all().order_by("order")
        return Response(LeadStageSerializer(stages, many=True).data)
