from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None):
        user = self.create_user(email, full_name, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

class CustomUser(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = CustomUserManager()

    def __str__(self):
        return self.email

class UserPantry(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='pantry_items')
    ingredient = models.ForeignKey('recipes.Ingredient', on_delete=models.CASCADE)
    quantity = models.CharField(max_length=100)
    unit = models.CharField(max_length=50)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'ingredient') # same user does not add multiple ingredients
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.email} - {self.ingredient.name}"

class SearchHistory(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='search_history')
    search_query = models.CharField(max_length=500)
    searched_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-searched_on']

    def __str__(self):
        return f"{self.user.email}: {self.search_query}"
