from django.contrib.auth import get_user_model
from recipes.models import Ingredient, Tag

# Create common ingredients
ingredients_data = [
    # Fruits
    {"name": "Apple", "category": "Fruits"},
    {"name": "Banana", "category": "Fruits"},
    {"name": "Orange", "category": "Fruits"},
    {"name": "Mango", "category": "Fruits"},
    {"name": "Lemon", "category": "Fruits"},
    
    # Vegetables
    {"name": "Tomato", "category": "Vegetables"},
    {"name": "Onion", "category": "Vegetables"},
    {"name": "Garlic", "category": "Vegetables"},
    {"name": "Potato", "category": "Vegetables"},
    {"name": "Carrot", "category": "Vegetables"},
    {"name": "Spinach", "category": "Vegetables"},
    {"name": "Broccoli", "category": "Vegetables"},
    {"name": "Bell Pepper", "category": "Vegetables"},
    
    # Proteins
    {"name": "Chicken Breast", "category": "Proteins"},
    {"name": "Ground Beef", "category": "Proteins"},
    {"name": "Salmon", "category": "Proteins"},
    {"name": "Eggs", "category": "Proteins"},
    {"name": "Paneer", "category": "Proteins"},
    {"name": "Lentils", "category": "Proteins"},
    
    # Dairy
    {"name": "Milk", "category": "Dairy"},
    {"name": "Yogurt", "category": "Dairy"},
    {"name": "Cheese", "category": "Dairy"},
    {"name": "Butter", "category": "Dairy"},
    
    # Grains
    {"name": "Rice", "category": "Grains"},
    {"name": "Wheat Flour", "category": "Grains"},
    {"name": "Pasta", "category": "Grains"},
    {"name": "Oats", "category": "Grains"},
    
    # Spices
    {"name": "Salt", "category": "Spices"},
    {"name": "Black Pepper", "category": "Spices"},
    {"name": "Cumin", "category": "Spices"},
    {"name": "Turmeric", "category": "Spices"},
    {"name": "Coriander", "category": "Spices"},
    {"name": "Ginger", "category": "Spices"},
    
    # Oils & Condiments
    {"name": "Olive Oil", "category": "Oils"},
    {"name": "Vegetable Oil", "category": "Oils"},
    {"name": "Soy Sauce", "category": "Condiments"},
]

tags_data = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Quick",
    "Healthy",
    "Dessert",
    "Breakfast",
    "Lunch",
    "Dinner",
    "Snack",
    "Comfort Food",
    "Low-Carb",
]

# Add ingredients
added_count = 0
for ing in ingredients_data:
    obj, created = Ingredient.objects.get_or_create(
        name=ing["name"],
        defaults={"category": ing.get("category", "")}
    )
    if created:
        added_count += 1

print(f"Added {added_count} ingredients")

# Add tags
tag_count = 0
for tag_name in tags_data:
    obj, created = Tag.objects.get_or_create(tag_name=tag_name)
    if created:
        tag_count += 1

print(f"Added {tag_count} tags")
print("✓ Database seeded successfully!")
