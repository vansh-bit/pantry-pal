from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from recipes.models import Ingredient, Tag, Recipe, RecipeIngredient, RecipeTag

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with sample data'

    def handle(self, *args, **kwargs):
        # Tags
        tag_names = ['Vegan','Vegetarian','Quick','Spicy','Healthy','Comfort Food','Gluten-Free','Dairy-Free','High-Protein','Low-Carb']
        tags = {name: Tag.objects.get_or_create(tag_name=name)[0] for name in tag_names}
        self.stdout.write('Created tags.')

        # Ingredients
        ingredients_data = [
            ('Pasta','Grains'),('Tomatoes','Vegetables'),('Garlic','Vegetables'),('Olive Oil','Oils'),
            ('Onion','Vegetables'),('Chicken Breast','Meat'),('Rice','Grains'),('Eggs','Dairy'),
            ('Butter','Dairy'),('Milk','Dairy'),('Flour','Grains'),('Salt','Spices'),
            ('Black Pepper','Spices'),('Basil','Herbs'),('Mozzarella','Dairy'),
            ('Parmesan','Dairy'),('Spinach','Vegetables'),('Bell Pepper','Vegetables'),
            ('Mushrooms','Vegetables'),('Lemon','Fruits'),('Ginger','Spices'),('Cumin','Spices'),
            ('Coriander','Spices'),('Chickpeas','Legumes'),('Coconut Milk','Dairy'),
            ('Soy Sauce','Condiments'),('Sesame Oil','Oils'),('Broccoli','Vegetables'),
            ('Carrot','Vegetables'),('Potato','Vegetables'),
            # Indian staples
            ('Toor Dal','Legumes'),('Masoor Dal','Legumes'),('Moong Dal','Legumes'),
            ('Urad Dal','Legumes'),('Chana Dal','Legumes'),('Rajma','Legumes'),
            ('Kala Chana','Legumes'),('Kabuli Chana','Legumes'),
            ('Basmati Rice','Grains'),('Poha','Grains'),('Sooji','Grains'),
            ('Besan','Grains'),('Atta','Grains'),
            ('Paneer','Dairy'),('Ghee','Dairy'),('Curd','Dairy'),
            ('Mustard Oil','Oils'),
            ('Green Chili','Vegetables'),('Curry Leaves','Herbs'),
            ('Coriander Leaves','Herbs'),('Mint Leaves','Herbs'),
            ('Turmeric','Spices'),('Garam Masala','Spices'),
            ('Red Chili Powder','Spices'),('Kashmiri Chili Powder','Spices'),
            ('Mustard Seeds','Spices'),('Cumin Seeds','Spices'),
            ('Fenugreek Seeds','Spices'),('Asafoetida (Hing)','Spices'),
            ('Ajwain','Spices'),('Kasuri Methi','Spices'),
            ('Cardamom','Spices'),('Cloves','Spices'),
            ('Cinnamon','Spices'),('Bay Leaf','Spices'),
            ('Tamarind','Condiments'),('Jaggery','Sweeteners'),
        ]
        ings = {}
        for name, cat in ingredients_data:
            ing, _ = Ingredient.objects.get_or_create(name=name, defaults={'category': cat})
            ings[name] = ing
        self.stdout.write('Created ingredients.')

        # Admin user
        admin, created = User.objects.get_or_create(email='admin@pantrypal.com', defaults={'full_name':'Admin User','is_staff':True,'is_superuser':True})
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write('Created admin: admin@pantrypal.com / admin123')

        # Demo user
        demo, created = User.objects.get_or_create(email='demo@pantrypal.com', defaults={'full_name':'Demo Chef'})
        if created:
            demo.set_password('demo1234')
            demo.save()
            self.stdout.write('Created demo: demo@pantrypal.com / demo1234')

        # Sample recipes
        recipes_data = [
            {
                'title': 'Classic Spaghetti Marinara',
                'instructions': 'Step 1: Boil salted water and cook pasta al dente.\nStep 2: Sauté garlic in olive oil for 2 minutes.\nStep 3: Add crushed tomatoes, salt, pepper, and basil. Simmer 15 min.\nStep 4: Toss pasta with sauce and serve with parmesan.',
                'cuisine': 'Italian', 'prep_time_mins': 25, 'calories': 420,
                'tags': ['Vegetarian','Comfort Food'],
                'ingredients': [('Pasta','200','grams',''),('Tomatoes','400','grams','crushed'),('Garlic','3','cloves','minced'),('Olive Oil','2','tbsp',''),('Basil','1','handful','fresh'),('Parmesan','30','grams','grated')],
            },
            {
                'title': 'Spicy Chicken Stir-Fry',
                'instructions': 'Step 1: Slice chicken thin and marinate in soy sauce for 10 min.\nStep 2: Heat sesame oil in wok on high.\nStep 3: Cook chicken until golden. Add vegetables, ginger, garlic.\nStep 4: Stir-fry 5 minutes. Serve over rice.',
                'cuisine': 'Chinese', 'prep_time_mins': 20, 'calories': 380,
                'tags': ['Spicy','High-Protein','Quick'],
                'ingredients': [('Chicken Breast','300','grams','sliced thin'),('Soy Sauce','3','tbsp',''),('Sesame Oil','1','tbsp',''),('Ginger','1','tsp','grated'),('Garlic','2','cloves',''),('Broccoli','150','grams',''),('Carrot','1','piece','julienned'),('Rice','150','grams','cooked')],
            },
            {
                'title': 'Creamy Mushroom Risotto',
                'instructions': 'Step 1: Sauté onion and garlic in butter until soft.\nStep 2: Add rice and toast 2 minutes.\nStep 3: Add hot stock ladle by ladle, stirring constantly.\nStep 4: Stir in mushrooms, parmesan, and butter. Season and serve.',
                'cuisine': 'Italian', 'prep_time_mins': 40, 'calories': 520,
                'tags': ['Vegetarian','Comfort Food'],
                'ingredients': [('Rice','250','grams','arborio'),('Mushrooms','200','grams','sliced'),('Onion','1','piece','diced'),('Butter','50','grams',''),('Parmesan','50','grams','grated'),('Garlic','2','cloves',''),('Olive Oil','2','tbsp','')],
            },
            {
                'title': 'Chickpea Coconut Curry',
                'instructions': 'Step 1: Fry onion, garlic, ginger until golden.\nStep 2: Add cumin, coriander, cook 1 minute.\nStep 3: Add chickpeas, tomatoes, coconut milk. Simmer 20 min.\nStep 4: Garnish with fresh coriander. Serve with rice.',
                'cuisine': 'Indian', 'prep_time_mins': 30, 'calories': 390,
                'tags': ['Vegan','Healthy','Gluten-Free'],
                'ingredients': [('Chickpeas','400','grams','cooked'),('Coconut Milk','200','ml',''),('Tomatoes','300','grams',''),('Onion','1','piece',''),('Garlic','3','cloves',''),('Ginger','1','tsp','grated'),('Cumin','1','tsp',''),('Coriander','1','tsp','ground')],
            },
            {
                'title': 'Fluffy Scrambled Eggs',
                'instructions': 'Step 1: Whisk eggs with a splash of milk, salt and pepper.\nStep 2: Melt butter in a non-stick pan on low heat.\nStep 3: Pour in eggs, fold gently with a spatula as they set.\nStep 4: Remove just before fully cooked. They finish on the plate.',
                'cuisine': 'American', 'prep_time_mins': 10, 'calories': 280,
                'tags': ['Vegetarian','Quick','High-Protein'],
                'ingredients': [('Eggs','3','pieces',''),('Butter','15','grams',''),('Milk','2','tbsp',''),('Salt','1','pinch',''),('Black Pepper','1','pinch','')],
            },
            {
                'title': 'Greek Lemon Roasted Potatoes',
                'instructions': 'Step 1: Preheat oven to 200°C. Cut potatoes into wedges.\nStep 2: Toss with olive oil, lemon juice, garlic, salt and pepper.\nStep 3: Roast 45 minutes, turning halfway, until golden and crispy.',
                'cuisine': 'Mediterranean', 'prep_time_mins': 55, 'calories': 310,
                'tags': ['Vegan','Gluten-Free','Healthy'],
                'ingredients': [('Potato','600','grams','cut in wedges'),('Lemon','2','pieces','juiced'),('Garlic','4','cloves',''),('Olive Oil','4','tbsp',''),('Salt','1','tsp',''),('Black Pepper','half','tsp','')],
            },
        ]

        for rd in recipes_data:
            if Recipe.objects.filter(title=rd['title']).exists():
                continue
            recipe = Recipe.objects.create(
                title=rd['title'], instructions=rd['instructions'], cuisine=rd['cuisine'],
                prep_time_mins=rd['prep_time_mins'], calories=rd['calories'],
                author=admin, approval_status='approved'
            )
            for iname, qty, unit, notes in rd['ingredients']:
                if iname in ings:
                    RecipeIngredient.objects.create(recipe=recipe, ingredient=ings[iname], quantity_required=qty, ri_unit=unit, ri_notes=notes)
            for tname in rd['tags']:
                if tname in tags:
                    RecipeTag.objects.create(recipe=recipe, tag=tags[tname])

        self.stdout.write(self.style.SUCCESS('✅ Seed data created successfully!'))
        self.stdout.write('Admin: admin@pantrypal.com / admin123')
        self.stdout.write('Demo:  demo@pantrypal.com  / demo1234')
