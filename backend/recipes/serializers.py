from rest_framework import serializers
from .models import Recipe, Ingredient, Tag, RecipeIngredient, RecipeTag, Review
from django.db.models import Avg

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'tag_name']

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'category', 'purchase_link', 'image_url']

class RecipeIngredientSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer(read_only=True)
    ingredient_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ['id', 'ingredient', 'ingredient_id', 'quantity_required', 'ri_unit', 'ri_notes']

    def create(self, validated_data):
        ingredient_id = validated_data.pop('ingredient_id')
        ingredient = Ingredient.objects.get(id=ingredient_id)
        return RecipeIngredient.objects.create(ingredient=ingredient, **validated_data)

class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_email = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'author_name', 'author_email', 'rating', 'comment', 'review_date']
        read_only_fields = ['id', 'review_date']

    def get_author_name(self, obj):
        return obj.author.full_name

    def get_author_email(self, obj):
        return obj.author.email

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        recipe_id = self.context['recipe_id']
        validated_data['recipe_id'] = recipe_id
        return super().create(validated_data)

class RecipeListSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Recipe
        fields = ['id', 'title', 'cuisine', 'prep_time_mins', 'calories',
                  'approval_status', 'author_name', 'avg_rating', 'review_count',
                  'tags', 'image_url', 'created_at']

    def get_author_name(self, obj):
        return obj.author.full_name

    def get_avg_rating(self, obj):
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else None

    def get_review_count(self, obj):
        return obj.reviews.count()

class RecipeDetailSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_id = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    recipe_ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Recipe
        fields = ['id', 'title', 'instructions', 'cuisine', 'prep_time_mins', 'calories',
                  'approval_status', 'author_name', 'author_id', 'avg_rating', 'review_count',
                  'tags', 'recipe_ingredients', 'reviews', 'image_url', 'created_at']

    def get_author_name(self, obj):
        return obj.author.full_name

    def get_author_id(self, obj):
        return obj.author.id

    def get_avg_rating(self, obj):
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else None

    def get_review_count(self, obj):
        return obj.reviews.count()

class RecipeCreateSerializer(serializers.ModelSerializer):
    recipe_ingredients = RecipeIngredientSerializer(many=True, required=False)
    tag_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Recipe
        fields = ['id', 'title', 'instructions', 'cuisine', 'prep_time_mins',
                  'calories', 'recipe_ingredients', 'tag_ids', 'image_url']

    def create(self, validated_data):
        ingredients_data = validated_data.pop('recipe_ingredients', [])
        tag_ids = validated_data.pop('tag_ids', [])
        validated_data['author'] = self.context['request'].user
        validated_data['approval_status'] = 'pending'
        recipe = Recipe.objects.create(**validated_data)
        
        for ing_data in ingredients_data:
            ingredient_id = ing_data.pop('ingredient_id')
            try:
                ingredient = Ingredient.objects.get(id=ingredient_id)
                RecipeIngredient.objects.create(recipe=recipe, ingredient=ingredient, **ing_data)
            except Ingredient.DoesNotExist:
                pass
        
        for tag_id in tag_ids:
            try:
                tag = Tag.objects.get(id=tag_id)
                RecipeTag.objects.create(recipe=recipe, tag=tag)
            except Tag.DoesNotExist:
                pass
        
        return recipe

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop('recipe_ingredients', None)
        tag_ids = validated_data.pop('tag_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if ingredients_data is not None:
            instance.recipe_ingredients.all().delete()
            for ing_data in ingredients_data:
                ingredient_id = ing_data.pop('ingredient_id')
                try:
                    ingredient = Ingredient.objects.get(id=ingredient_id)
                    RecipeIngredient.objects.create(recipe=instance, ingredient=ingredient, **ing_data)
                except Ingredient.DoesNotExist:
                    pass
        if tag_ids is not None:
            RecipeTag.objects.filter(recipe=instance).delete()
            for tag_id in tag_ids:
                try:
                    tag = Tag.objects.get(id=tag_id)
                    RecipeTag.objects.create(recipe=instance, tag=tag)
                except Tag.DoesNotExist:
                    pass
        return instance
