from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class CaseInsensitiveModelBackend(ModelBackend):
    """
    Case-insensitive authentication backend so usernames like 'infected', 'Infected',
    or credentials with accidental leading/trailing whitespace authenticate reliably.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        if not username or not password:
            return None

        cleaned_username = username.strip()
        try:
            user = UserModel.objects.get(
                **{f"{UserModel.USERNAME_FIELD}__iexact": cleaned_username}
            )
        except UserModel.DoesNotExist:
            UserModel().set_password(password)
            return None
        except UserModel.MultipleObjectsReturned:
            user = (
                UserModel.objects.filter(
                    **{f"{UserModel.USERNAME_FIELD}__iexact": cleaned_username}
                )
                .order_by("id")
                .first()
            )

        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
