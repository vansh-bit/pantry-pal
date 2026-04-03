from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Recipe, Ingredient, Tag, Review
from .serializers import (RecipeListSerializer, RecipeDetailSerializer,
                           RecipeCreateSerializer, IngredientSerializer,
                           TagSerializer, ReviewSerializer)
from users.models import SearchHistory

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user or request.user.is_staff

class RecipeListCreate(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'prep_time_mins', 'calories']
    ordering = ['-created_at']

    def get_serializer_class(self):
        return RecipeCreateSerializer if self.request.method == 'POST' else RecipeListSerializer

    def get_queryset(self):
        qs = Recipe.objects.filter(approval_status='approved').select_related('author').prefetch_related('tags', 'reviews')
        search = self.request.query_params.get('search')
        cuisine = self.request.query_params.get('cuisine')
        tag = self.request.query_params.get('tag')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(cuisine__icontains=search) | Q(instructions__icontains=search))
        if cuisine:
            qs = qs.filter(cuisine__icontains=cuisine)
        if tag:
            qs = qs.filter(tags__tag_name__icontains=tag)
        return qs

class RecipeDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsOwnerOrAdmin]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return RecipeCreateSerializer
        return RecipeDetailSerializer

    def get_queryset(self):
        return Recipe.objects.all().select_related('author').prefetch_related('tags', 'recipe_ingredients__ingredient', 'reviews__author')

class MyRecipes(generics.ListAPIView):
    serializer_class = RecipeListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Recipe.objects.filter(author=self.request.user).select_related('author').prefetch_related('tags', 'reviews')

class PendingRecipes(generics.ListAPIView):
    serializer_class = RecipeListSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Recipe.objects.filter(approval_status='pending').select_related('author').prefetch_related('tags')

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def approve_recipe(request, pk):
    try:
        recipe = Recipe.objects.get(pk=pk)
        recipe.approval_status = 'approved'
        recipe.save()
        return Response({'status': 'approved'})
    except Recipe.DoesNotExist:
        return Response(status=404)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def reject_recipe(request, pk):
    try:
        recipe = Recipe.objects.get(pk=pk)
        recipe.approval_status = 'rejected'
        recipe.save()
        return Response({'status': 'rejected'})
    except Recipe.DoesNotExist:
        return Response(status=404)

@api_view(['GET', 'POST'])
def recipe_reviews(request, pk):
    try:
        recipe = Recipe.objects.get(pk=pk)
    except Recipe.DoesNotExist:
        return Response(status=404)

    if request.method == 'GET':
        reviews = recipe.reviews.select_related('author')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=401)
    serializer = ReviewSerializer(data=request.data, context={'request': request, 'recipe_id': pk})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_review(request, pk):
    try:
        review = Review.objects.get(pk=pk, author=request.user)
        review.delete()
        return Response(status=204)
    except Review.DoesNotExist:
        return Response(status=404)

class IngredientList(generics.ListCreateAPIView):
    serializer_class = IngredientSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = Ingredient.objects.all()
        search = self.request.query_params.get('search')
        category = self.request.query_params.get('category')
        if search:
            qs = qs.filter(name__icontains=search)
        if category:
            qs = qs.filter(category__icontains=category)
        return qs

class TagList(generics.ListCreateAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

@api_view(['POST'])
def search_recipes(request):
    query = request.data.get('query', '').strip()
    if not query:
        return Response({'error': 'Query required'}, status=400)
    if request.user.is_authenticated:
        SearchHistory.objects.create(user=request.user, search_query=query)
    qs = Recipe.objects.filter(
        approval_status='approved'
    ).filter(
        Q(title__icontains=query) | Q(cuisine__icontains=query) |
        Q(ingredients__name__icontains=query) | Q(tags__tag_name__icontains=query)
    ).distinct().select_related('author').prefetch_related('tags', 'reviews')
    serializer = RecipeListSerializer(qs, many=True)
    return Response({'results': serializer.data, 'count': qs.count(), 'query': query})
