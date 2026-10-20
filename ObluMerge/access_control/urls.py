from django.urls import path
from .views import MeProfileView, MyTeamListView

urlpatterns = [
    path('me/', MeProfileView.as_view(), name='access-control-me'),
    path('my-permissions/', MeProfileView.as_view(), name='access-control-my-permissions'),
    path('my-team/', MyTeamListView.as_view(), name='my-team'),
]
