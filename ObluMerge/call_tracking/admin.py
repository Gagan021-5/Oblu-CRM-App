from django.contrib import admin

from .models import CallLog, CallStats


@admin.register(CallLog)
class CallLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "phone_number",
        "call_type",
        "duration",
        "timestamp",
        "synced_at",
    )

    list_filter = (
        "call_type",
        "timestamp",
    )

    search_fields = (
        "user__username",
        "user__email",
        "phone_number",
    )

    ordering = ("-timestamp",)
    readonly_fields = ("synced_at",)


@admin.register(CallStats)
class CallStatsAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "date",
        "total_calls",
        "total_duration",
    )

    list_filter = ("date",)

    search_fields = (
        "user__username",
        "user__email",
    )

    ordering = ("-date",)