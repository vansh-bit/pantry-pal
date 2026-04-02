from django.contrib import admin
from .models import Recipe, Ingredient, Tag, RecipeIngredient, Review

@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'cuisine', 'approval_status', 'created_at']
    list_filter = ['approval_status', 'cuisine']
    search_fields = ['title', 'author__email']
    actions = ['approve_recipes', 'reject_recipes']

    def approve_recipes(self, request, queryset):
        queryset.update(approval_status='approved')
    approve_recipes.short_description = 'Approve selected recipes'

    def reject_recipes(self, request, queryset):
        queryset.update(approval_status='rejected')
    reject_recipes.short_description = 'Reject selected recipes'

@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ['name', 'category']
    search_fields = ['name', 'category']
    list_filter = ['category']

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['tag_name']
    search_fields = ['tag_name']

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['author', 'recipe', 'rating', 'review_date']
    list_filter = ['rating']
    search_fields = ['author__email', 'recipe__title']
