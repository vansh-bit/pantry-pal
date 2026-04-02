from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from recipes.models import Ingredient, Tag, Recipe, RecipeIngredient, RecipeTag
from rest_framework.authtoken.models import Token

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with sample data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')

        # Tags
        tag_names = ['Vegan', 'Vegetarian', 'Quick', 'Healthy', 'Spicy', 'Comfort Food', 'Gluten-Free', 'Low-Calorie']
        tags = {name: Tag.objects.get_or_create(tag_name=name)[0] for name in tag_names}
        self.stdout.write(f'  Created {len(tags)} tags')

        # Ingredients
        ingredients_data = [
            ('Pasta', 'Grains'), ('Tomato Sauce', 'Sauces'), ('Garlic', 'Vegetables'),
            ('Olive Oil', 'Oils'), ('Parmesan', 'Dairy'), ('Eggs', 'Dairy'),
            ('Chicken Breast', 'Meat'), ('Rice', 'Grains'), ('Onion', 'Vegetables'),
            ('Bell Pepper', 'Vegetables'), ('Cumin', 'Spices'), ('Coriander', 'Spices'),
            ('Coconut Milk', 'Dairy'), ('Lemon', 'Fruits'), ('Butter', 'Dairy'),
            ('Flour', 'Grains'), ('Sugar', 'Baking'), ('Vanilla Extract', 'Baking'),
            ('Black Beans', 'Legumes'), ('Avocado', 'Fruits'),
        ]
        ingredients = {}
        for name, category in ingredients_data:
            ing, _ = Ingredient.objects.get_or_create(name=name, defaults={'category': category})
            ingredients[name] = ing
        self.stdout.write(f'  Created {len(ingredients)} ingredients')

        # Admin user
        admin, created = User.objects.get_or_create(
            email='admin@pantrypal.com',
            defaults={'full_name': 'Admin User', 'is_staff': True, 'is_superuser': True}
        )
        if created:
            admin.set_password('admin123')
            admin.save()
        Token.objects.get_or_create(user=admin)

        # Demo user
        demo, created = User.objects.get_or_create(
            email='chef@pantrypal.com',
            defaults={'full_name': 'Chef Demo'}
        )
        if created:
            demo.set_password('demo1234')
            demo.save()
        Token.objects.get_or_create(user=demo)
        self.stdout.write('  Created admin and demo users')

        # Recipes
        recipes_data = [
            {
                'title': 'Classic Spaghetti Bolognese',
                'instructions': 'Step 1: Boil pasta until al dente.\nStep 2: In a pan, heat olive oil and sauté garlic and onion.\nStep 3: Add tomato sauce and simmer for 20 minutes.\nStep 4: Serve pasta topped with sauce and grated parmesan.',
                'cuisine': 'Italian', 'prep_time_mins': 30, 'calories': 520,
                'approval_status': 'approved',
                'ings': [('Pasta','200','grams',''), ('Tomato Sauce','150','ml',''), ('Garlic','3','cloves','minced'), ('Olive Oil','2','tbsp',''), ('Parmesan','30','grams','grated')],
                'tags': ['Comfort Food'],
            },
            {
                'title': 'Quick Lemon Garlic Chicken',
                'instructions': 'Step 1: Season chicken with salt and pepper.\nStep 2: Heat butter in pan over medium-high heat.\nStep 3: Cook chicken 6 minutes per side until golden.\nStep 4: Add garlic and lemon juice, cook 2 more minutes.\nStep 5: Rest 5 minutes before serving.',
                'cuisine': 'American', 'prep_time_mins': 20, 'calories': 380,
                'approval_status': 'approved',
                'ings': [('Chicken Breast','200','grams',''), ('Lemon','1','piece','juiced'), ('Garlic','4','cloves',''), ('Butter','2','tbsp','')],
                'tags': ['Quick', 'Healthy'],
            },
            {
                'title': 'Creamy Coconut Rice',
                'instructions': 'Step 1: Rinse rice until water runs clear.\nStep 2: Combine rice, coconut milk and a pinch of salt in a pot.\nStep 3: Bring to a boil, then reduce to low heat.\nStep 4: Cook covered for 18 minutes until rice absorbs liquid.\nStep 5: Fluff with a fork and serve.',
                'cuisine': 'Thai', 'prep_time_mins': 25, 'calories': 310,
                'approval_status': 'approved',
                'ings': [('Rice','200','grams','rinsed'), ('Coconut Milk','200','ml',''), ('Onion','1','piece','diced')],
                'tags': ['Vegan', 'Gluten-Free'],
            },
            {
                'title': 'Spicy Black Bean Tacos',
                'instructions': 'Step 1: Drain and rinse black beans.\nStep 2: Sauté onion and bell pepper in olive oil.\nStep 3: Add beans, cumin, and coriander. Cook 5 minutes.\nStep 4: Mash half the beans for texture.\nStep 5: Serve in warm tortillas with sliced avocado.',
                'cuisine': 'Mexican', 'prep_time_mins': 15, 'calories': 290,
                'approval_status': 'approved',
                'ings': [('Black Beans','1','can','drained'), ('Bell Pepper','1','piece','diced'), ('Onion','1','piece',''), ('Cumin','1','tsp',''), ('Coriander','1','tsp',''), ('Avocado','1','piece','sliced')],
                'tags': ['Vegan', 'Spicy', 'Quick'],
            },
        ]

        for data in recipes_data:
            recipe, created = Recipe.objects.get_or_create(
                title=data['title'],
                defaults={
                    'instructions': data['instructions'],
                    'cuisine': data['cuisine'],
                    'prep_time_mins': data['prep_time_mins'],
                    'calories': data['calories'],
                    'approval_status': data['approval_status'],
                    'author': demo,
                }
            )
            if created:
                for ing_name, qty, unit, notes in data['ings']:
                    if ing_name in ingredients:
                        RecipeIngredient.objects.create(
                            recipe=recipe, ingredient=ingredients[ing_name],
                            quantity_required=qty, ri_unit=unit, ri_notes=notes
                        )
                for tag_name in data['tags']:
                    if tag_name in tags:
                        RecipeTag.objects.get_or_create(recipe=recipe, tag=tags[tag_name])

        self.stdout.write(f'  Created {len(recipes_data)} recipes')
        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!\n'))
        self.stdout.write('  Admin login:  admin@pantrypal.com / admin123')
        self.stdout.write('  Demo login:   chef@pantrypal.com  / demo1234')
