from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    """Health check endpoint for Vercel"""
    return JsonResponse({'status': 'ok', 'message': 'Backend is running'})


urlpatterns = [
    path('', health_check),
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/', include('recipes.urls')),
    path('api/health/', health_check),
]


