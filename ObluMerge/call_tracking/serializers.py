"""
Serializers for the Call Tracer API.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CallLog, CallStats, CallTrackingProfile

User = get_user_model()


def get_role(user):
    """Calculates user role dynamically from CRM permissions."""
    if user.is_staff or user.is_superuser:
        return "admin"
    return "user"


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that embeds role and user info in response."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["role"] = get_role(user)
        try:
            profile = user.call_tracking_profile
            token["consent_given"] = profile.consent_given
        except Exception:
            token["consent_given"] = False
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        profile, _ = CallTrackingProfile.objects.get_or_create(user=self.user)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "role": get_role(self.user),
            "device_id": profile.device_id,
            "device_model": profile.device_model,
            "app_version": profile.app_version,
            "consent_given": profile.consent_given,
        }
        return data


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for direct user/employee registration."""

    password = serializers.CharField(
        write_only=True, required=True, min_length=8
    )
    password_confirm = serializers.CharField(
        write_only=True, required=True, min_length=8
    )
    role = serializers.CharField(required=False, default="user")
    device_id = serializers.CharField(required=False, allow_blank=True, default="")
    device_model = serializers.CharField(required=False, allow_blank=True, default="")
    app_version = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "password_confirm",
            "role",
            "device_id",
            "device_model",
            "app_version",
        ]

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm", None)
        password = validated_data.pop("password")
        role = validated_data.pop("role", "user")
        device_id = validated_data.pop("device_id", "")
        device_model = validated_data.pop("device_model", "")
        app_version = validated_data.pop("app_version", "")

        is_staff = (role == "admin")
        user = User(
            username=validated_data.get("username"),
            email=validated_data.get("email", ""),
            is_staff=is_staff,
        )
        user.set_password(password)
        user.save()

        CallTrackingProfile.objects.create(
            user=user,
            device_id=device_id,
            device_model=device_model,
            app_version=app_version,
            consent_given=False,
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User details with aggregate call count and latest call time."""

    role = serializers.SerializerMethodField()
    device_id = serializers.SerializerMethodField()
    device_model = serializers.SerializerMethodField()
    app_version = serializers.SerializerMethodField()
    consent_given = serializers.SerializerMethodField()
    total_call_logs = serializers.IntegerField(read_only=True, default=0)
    last_call_timestamp = serializers.DateTimeField(read_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "device_id",
            "device_model",
            "app_version",
            "consent_given",
            "date_joined",
            "last_login",
            "total_call_logs",
            "last_call_timestamp",
        ]
        read_only_fields = ["id", "date_joined", "last_login", "last_call_timestamp"]

    def get_role(self, obj):
        return get_role(obj)

    def _get_profile(self, obj):
        if not hasattr(obj, "_cached_call_profile"):
            try:
                obj._cached_call_profile = obj.call_tracking_profile
            except Exception:
                obj._cached_call_profile = None
        return obj._cached_call_profile

    def get_device_id(self, obj):
        p = self._get_profile(obj)
        return p.device_id if p else ""

    def get_device_model(self, obj):
        p = self._get_profile(obj)
        return p.device_model if p else ""

    def get_app_version(self, obj):
        p = self._get_profile(obj)
        return p.app_version if p else ""

    def get_consent_given(self, obj):
        p = self._get_profile(obj)
        return p.consent_given if p else False



class AdminProfileUpdateSerializer(serializers.Serializer):
    """Allows an admin to update their username, email, and password."""

    username = serializers.CharField(required=False, max_length=150)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(required=False, min_length=8, write_only=True)
    password_confirm = serializers.CharField(required=False, min_length=8, write_only=True)

    def validate(self, attrs):
        if "password" in attrs and attrs["password"]:
            if attrs.get("password") != attrs.get("password_confirm"):
                raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs


class CallLogItemSerializer(serializers.Serializer):
    """Validates individual call log entries inside a sync batch."""

    phone_number = serializers.CharField(max_length=20)
    call_type = serializers.ChoiceField(choices=CallLog.CALL_TYPE_CHOICES)
    duration = serializers.IntegerField(min_value=0)
    timestamp = serializers.DateTimeField()


class CallLogSyncSerializer(serializers.Serializer):
    """Validates a batch of call logs submitted for synchronization."""

    call_logs = serializers.ListField(
        child=CallLogItemSerializer(),
        allow_empty=False,
        max_length=500,
    )


class CallLogSerializer(serializers.ModelSerializer):
    """Full CallLog model serializer for admin list/detail views."""

    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = CallLog
        fields = [
            "id",
            "user",
            "username",
            "phone_number",
            "call_type",
            "duration",
            "timestamp",
            "synced_at",
        ]
        read_only_fields = ["id", "synced_at"]


class CallStatsSerializer(serializers.ModelSerializer):
    """CallStats model serializer for aggregated analytics."""

    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = CallStats
        fields = [
            "id",
            "user",
            "username",
            "date",
            "total_calls",
            "total_duration",
            "calls_by_type",
            "top_numbers",
        ]
