import json
import os
import urllib.error
import urllib.parse
import urllib.request
from io import StringIO

from django.core.management import call_command
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .models import CustomUser, UserPantry, SearchHistory
from .serializers import (UserSerializer, RegisterSerializer, LoginSerializer,
                           UserPantrySerializer, SearchHistorySerializer)
from recipes.models import Recipe


def _recipe_match_candidates(pantry_names, limit=5):
    pantry_set = {name.strip().lower() for name in pantry_names if name.strip()}
    candidates = []
    recipes = Recipe.objects.filter(approval_status='approved').prefetch_related('recipe_ingredients__ingredient')[:80]

    for recipe in recipes:
        recipe_ingredients = []
        for ri in recipe.recipe_ingredients.all():
            if ri.ingredient and ri.ingredient.name:
                recipe_ingredients.append(ri.ingredient.name.strip())

        if not recipe_ingredients:
            continue

        lower_map = {name.lower(): name for name in recipe_ingredients}
        matched = [orig for lower, orig in lower_map.items() if lower in pantry_set]
        if not matched:
            continue

        missing = [orig for lower, orig in lower_map.items() if lower not in pantry_set]
        candidates.append({
            'recipe_id': recipe.id,
            'title': recipe.title,
            'cuisine': recipe.cuisine,
            'match_count': len(matched),
            'matching_ingredients': matched,
            'missing_ingredients': missing[:6],
        })

    candidates.sort(key=lambda x: (-x['match_count'], len(x['missing_ingredients']), x['title'].lower()))
    return candidates[:limit]


def _fallback_ai_summary(pantry_names, matches):
    if not matches:
        pantry_preview = ", ".join(pantry_names[:6])
        return (
            "No strong recipe match yet. Try adding 2-3 more ingredients, ideally a protein, "
            "a vegetable, and a pantry base like rice/pasta. "
            f"Current pantry highlights: {pantry_preview}."
        )

    best = matches[0]
    if best['missing_ingredients']:
        return (
            f"Best match is {best['title']} ({best['cuisine']}) with {best['match_count']} matching ingredients. "
            f"To cook it today, consider adding: {', '.join(best['missing_ingredients'][:3])}."
        )
    return f"Great fit: you already have all key ingredients for {best['title']}."


def _fetch_json(url, timeout=10):
    request = urllib.request.Request(url, headers={'Accept': 'application/json'})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode('utf-8'))


def _fetch_web_recipe_candidates(pantry_names, limit=5):
    scores = {}
    pantry = [name.strip() for name in pantry_names if name and name.strip()]
    if not pantry:
        return []

    # Query top pantry ingredients to build overlap score from a public recipe API.
    for ingredient in pantry[:4]:
        encoded = urllib.parse.quote(ingredient)
        data = _fetch_json(f'https://www.themealdb.com/api/json/v1/1/filter.php?i={encoded}')
        meals = data.get('meals') or []
        for meal in meals:
            meal_id = meal.get('idMeal')
            if not meal_id:
                continue
            entry = scores.setdefault(meal_id, {
                'id': meal_id,
                'title': meal.get('strMeal') or 'Untitled',
                'image_url': meal.get('strMealThumb'),
                'match_count': 0,
                'matching_ingredients': [],
            })
            entry['match_count'] += 1
            entry['matching_ingredients'].append(ingredient)

    ranked = sorted(scores.values(), key=lambda x: (-x['match_count'], x['title'].lower()))[:limit]
    enriched = []
    for item in ranked:
        try:
            lookup = _fetch_json(f"https://www.themealdb.com/api/json/v1/1/lookup.php?i={item['id']}")
            meal = (lookup.get('meals') or [None])[0]
            if not meal:
                continue
            source_url = meal.get('strSource') or meal.get('strYoutube') or ''
            enriched.append({
                'recipe_id': f"web-{item['id']}",
                'title': item['title'],
                'cuisine': meal.get('strArea') or meal.get('strCategory') or 'Global',
                'match_count': item['match_count'],
                'matching_ingredients': item['matching_ingredients'],
                'missing_ingredients': [],
                'source_type': 'web',
                'source_url': source_url,
                'image_url': item['image_url'],
            })
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError):
            continue
    return enriched


def _generate_ai_summary(pantry_names, matches):
    api_key = os.environ.get('OPENAI_API_KEY', '').strip()
    if not api_key:
        return _fallback_ai_summary(pantry_names, matches), False

    model = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini').strip()
    payload = {
        'model': model,
        'input': [
            {
                'role': 'system',
                'content': [
                    {
                        'type': 'input_text',
                        'text': (
                            "You are PantryPal's meal-planning assistant. "
                            "Give concise practical cooking guidance in under 120 words."
                        ),
                    }
                ],
            },
            {
                'role': 'user',
                'content': [
                    {
                        'type': 'input_text',
                        'text': (
                            f"Pantry items: {pantry_names}\n"
                            f"Top recipe matches: {matches}\n"
                            "Return a short paragraph with: best option, quick substitutions, and next shopping tip."
                        ),
                    }
                ],
            },
        ],
    }

    request = urllib.request.Request(
        'https://api.openai.com/v1/responses',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            body = json.loads(response.read().decode('utf-8'))
        summary = (body.get('output_text') or '').strip()
        if summary:
            return summary, True
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError):
        pass

    return _fallback_ai_summary(pantry_names, matches), False

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def run_migrations(request):
    supplied_key = request.headers.get('X-Migration-Key', '').strip()
    expected_key = os.environ.get('MIGRATION_KEY', os.environ.get('SECRET_KEY', '')).strip()
    if not expected_key or supplied_key != expected_key:
        return Response({'detail': 'Forbidden'}, status=403)

    output = StringIO()
    try:
        call_command('migrate', interactive=False, stdout=output, stderr=output, verbosity=1)
        return Response({'detail': 'Migrations completed.', 'output': output.getvalue()})
    except Exception as exc:
        return Response(
            {'detail': 'Migration failed.', 'error': str(exc), 'output': output.getvalue()},
            status=500,
        )

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    request.user.auth_token.delete()
    return Response({'message': 'Logged out.'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)

class PantryListCreate(generics.ListCreateAPIView):
    serializer_class = UserPantrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserPantry.objects.filter(user=self.request.user).select_related('ingredient')

class PantryDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserPantrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserPantry.objects.filter(user=self.request.user)

class SearchHistoryList(generics.ListAPIView):
    serializer_class = SearchHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SearchHistory.objects.filter(user=self.request.user)[:20]

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_search_history(request, pk):
    try:
        entry = SearchHistory.objects.get(pk=pk, user=request.user)
        entry.delete()
        return Response(status=204)
    except SearchHistory.DoesNotExist:
        return Response(status=404)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def pantry_ai_suggestions(request):
    pantry_items = UserPantry.objects.filter(user=request.user).select_related('ingredient')
    pantry_names = [item.ingredient.name for item in pantry_items if item.ingredient and item.ingredient.name]
    if not pantry_names:
        return Response({'error': 'Add pantry ingredients first.'}, status=400)

    local_matches = _recipe_match_candidates(pantry_names)
    try:
        web_matches = _fetch_web_recipe_candidates(pantry_names)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError):
        web_matches = []

    all_matches_for_summary = local_matches + web_matches
    summary, generated_with_ai = _generate_ai_summary(pantry_names, all_matches_for_summary)
    return Response({
        'pantry': pantry_names,
        'top_matches': local_matches,
        'web_matches': web_matches,
        'ai_summary': summary,
        'generated_with_ai': generated_with_ai,
    })
