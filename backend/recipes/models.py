from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings

class Tag(models.Model):
    tag_name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.tag_name

class Ingredient(models.Model):
    name = models.CharField(max_length=200, unique=True)
    category = models.CharField(max_length=100, blank=True)
    purchase_link = models.URLField(null=True, blank=True)
    image_url = models.URLField(null=True, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Recipe(models.Model):
    STATUS_CHOICES = [('pending','Pending'),('approved','Approved'),('rejected','Rejected')]
    title = models.CharField(max_length=255)
    instructions = models.TextField()
    cuisine = models.CharField(max_length=100)
    prep_time_mins = models.PositiveIntegerField()
    calories = models.PositiveIntegerField(null=True, blank=True)
    approval_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recipes')
    ingredients = models.ManyToManyField(Ingredient, through='RecipeIngredient', blank=True)
    tags = models.ManyToManyField(Tag, through='RecipeTag', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    image_url = models.URLField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='recipe_ingredients')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity_required = models.CharField(max_length=100)
    ri_unit = models.CharField(max_length=50)
    ri_notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.recipe.title} - {self.ingredient.name}"

class RecipeTag(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('recipe', 'tag')

class Review(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='reviews')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    review_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('recipe', 'author')
        ordering = ['-review_date']

    def __str__(self):
        return f"{self.author.email} - {self.recipe.title} ({self.rating}★)"
