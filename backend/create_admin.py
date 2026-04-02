from django.contrib.auth import get_user_model
User = get_user_model()

if User.objects.filter(email='admin@example.com').exists():
    print("Admin user already exists")
else:
    User.objects.create_superuser(email='admin@example.com', full_name='Admin', password='admin123')
    print("Created superuser: admin@example.com / password: admin123")
