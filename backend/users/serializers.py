from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .models import CustomUser, UserPantry, SearchHistory
from recipes.serializers import IngredientSerializer

class UserSerializer(serializers.ModelSerializer): #convert data to json(for frontend)
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'full_name', 'created_at', 'is_staff']
        read_only_fields = ['id', 'created_at', 'is_staff']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    class Meta:
        model = CustomUser
        fields = ['email', 'password', 'full_name']

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name']
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user = CustomUser.objects.get(email=data['email'])
            if not user.check_password(data['password']):
                raise serializers.ValidationError('Invalid credentials.')
            if not user.is_active:
                raise serializers.ValidationError('Account disabled.')
            data['user'] = user
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials.')
        return data

class UserPantrySerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer(read_only=True)
    ingredient_id = serializers.IntegerField(write_only=True) #id to obj

    class Meta:
        model = UserPantry
        fields = ['id', 'ingredient', 'ingredient_id', 'quantity', 'unit', 'added_at']
        read_only_fields = ['id', 'added_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = ['id', 'search_query', 'searched_on']
        read_only_fields = ['id', 'searched_on']
