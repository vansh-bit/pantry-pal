from django.contrib.auth import get_user_model
from recipes.models import Ingredient
from rest_framework.authtoken.models import Token

User = get_user_model()
users = list(User.objects.all())
print(f"Users: {len(users)}")
for u in users:
    try:
        token = Token.objects.get(user=u)
        print(f"  - {u.email} (token: {token.key})")
    except:
        print(f"  - {u.email} (NO TOKEN - creating...)")
        token = Token.objects.create(user=u)
        print(f"    Created token: {token.key}")

ingr = list(Ingredient.objects.all())
print(f"Ingredients: {len(ingr)}")
