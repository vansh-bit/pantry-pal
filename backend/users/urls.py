from django.urls import path
from . import views
urlpatterns = [
    path('auth/register/', views.register),
    path('auth/login/', views.login_view),
    path('auth/logout/', views.logout_view),
    path('auth/me/', views.me),
    path('ops/run-migrations/', views.run_migrations),
    path('pantry/', views.PantryListCreate.as_view()),
    path('pantry/<int:pk>/', views.PantryDetail.as_view()),
    path('pantry/ai-suggestions/', views.pantry_ai_suggestions),
    path('search-history/', views.SearchHistoryList.as_view()),
    path('search-history/<int:pk>/', views.delete_search_history),
    path('users/', views.list_users),               # new
    path('users/<int:pk>/toggle-admin/', views.toggle_admin),  # new
]
