from django.urls import path
from . import views

urlpatterns = [
    path('recipes/', views.RecipeListCreate.as_view()),
    path('recipes/my-recipes/', views.MyRecipes.as_view()),
    path('recipes/pending/', views.PendingRecipes.as_view()),
    path('recipes/<int:pk>/', views.RecipeDetail.as_view()),
    path('recipes/<int:pk>/approve/', views.approve_recipe),
    path('recipes/<int:pk>/reject/', views.reject_recipe),
    path('recipes/<int:pk>/reviews/', views.recipe_reviews),
    path('reviews/<int:pk>/', views.delete_review),
    path('ingredients/', views.IngredientList.as_view()),
    path('tags/', views.TagList.as_view()),
    path('search/', views.search_recipes),
]
