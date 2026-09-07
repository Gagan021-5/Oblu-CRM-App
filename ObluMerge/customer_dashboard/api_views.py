"""
Customer Dashboard — REST API views for the employee mobile app.
All querysets scoped to the authenticated employee's salesperson profile.
"""

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework.exceptions import PermissionDenied
from .models import SalesPerson, Customer, CustomerRemark, CustomerFollowUp
from .api_serializers import (
    CustomerListSerializer,
    CustomerDetailSerializer,
    CustomerRemarkSerializer,
    CustomerFollowUpSerializer,
)


def get_salesperson(request):
    """
    Retrieve the SalesPerson profile linked to the authenticated user.
    Raises PermissionDenied (403) with code 'salesperson_profile_required'
    if the user is not linked to any SalesPerson.
    """
    salesperson = SalesPerson.objects.filter(user=request.user).first()
    if not salesperson:
        raise PermissionDenied(
            detail={
                "code": "salesperson_profile_required",
                "detail": "Your CRM account is not linked to a salesperson profile.",
            },
            code="salesperson_profile_required",
        )
    return salesperson


class CustomerListView(generics.ListAPIView):
    """
    GET /api/employee/customers/?search=&page=
    Lists customers assigned to the authenticated salesperson.
    """

    serializer_class = CustomerListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        salesperson = get_salesperson(self.request)
        qs = Customer.objects.filter(
            salesperson=salesperson
        ).select_related("salesperson").order_by("name")

        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                __import__("django.db.models", fromlist=["Q"]).Q(name__icontains=search)
                | __import__("django.db.models", fromlist=["Q"]).Q(phone__icontains=search)
                | __import__("django.db.models", fromlist=["Q"]).Q(state__icontains=search)
            )
        return qs


class CustomerDetailView(generics.RetrieveAPIView):
    """
    GET /api/employee/customers/{id}/
    Returns full customer detail, scoped to this salesperson.
    """

    serializer_class = CustomerDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        salesperson = get_salesperson(self.request)
        return Customer.objects.filter(
            salesperson=salesperson
        ).select_related("salesperson")


class CustomerRemarkCreateView(APIView):
    """
    POST /api/employee/customers/{id}/remarks/
    Add a remark to an assigned customer.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        salesperson = get_salesperson(request)
        from django.shortcuts import get_object_or_404
        customer = get_object_or_404(
            Customer.objects.filter(salesperson=salesperson), pk=pk
        )

        remark_text = request.data.get("remark", "").strip()
        if not remark_text:
            return Response(
                {"remark": "This field is required."},
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
    GET  /api/employee/customers/{id}/followups/
    POST /api/employee/customers/{id}/followups/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        salesperson = get_salesperson(request)
        from django.shortcuts import get_object_or_404
        customer = get_object_or_404(
            Customer.objects.filter(salesperson=salesperson), pk=pk
        )
        followups = CustomerFollowUp.objects.filter(
            customer=customer, salesperson=salesperson
        ).order_by("-followup_date")
        return Response(CustomerFollowUpSerializer(followups, many=True).data)

    def post(self, request, pk):
        salesperson = get_salesperson(request)
        from django.shortcuts import get_object_or_404
        customer = get_object_or_404(
            Customer.objects.filter(salesperson=salesperson), pk=pk
        )

        followup_date = request.data.get("followup_date")
        note = request.data.get("note", "")

        if not followup_date:
            return Response(
                {"followup_date": "This field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        followup = CustomerFollowUp.objects.create(
            customer=customer,
            salesperson=salesperson,
            followup_date=followup_date,
            note=note,
        )

        return Response(
            CustomerFollowUpSerializer(followup).data,
            status=status.HTTP_201_CREATED,
        )
