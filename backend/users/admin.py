from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, UserPantry, SearchHistory

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'full_name', 'is_staff', 'created_at']
    search_fields = ['email', 'full_name']
    ordering = ['-created_at']
    fieldsets = ((None, {'fields': ('email', 'password')}),('Personal', {'fields': ('full_name',)}),('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),)
    add_fieldsets = ((None, {'classes': ('wide',),'fields': ('email', 'full_name', 'password1', 'password2'),}),)

@admin.register(UserPantry)
class UserPantryAdmin(admin.ModelAdmin):
    list_display = ['user', 'ingredient', 'quantity', 'unit']
    search_fields = ['user__email', 'ingredient__name']

@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'search_query', 'searched_on']
    search_fields = ['user__email', 'search_query']
