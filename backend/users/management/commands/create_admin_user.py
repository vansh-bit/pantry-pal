import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Create an admin (superuser) account if one does not already exist'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            default=os.environ.get('ADMIN_EMAIL', 'admin@pantrypal.com'),
            help='Admin email address (default: ADMIN_EMAIL env var or admin@pantrypal.com)',
        )
        parser.add_argument(
            '--password',
            default=os.environ.get('ADMIN_PASSWORD'),
            help='Admin password (required; use --password flag or set ADMIN_PASSWORD env var)',
        )
        parser.add_argument(
            '--name',
            default='Admin',
            help='Admin full name (default: Admin)',
        )

    def handle(self, *args, **options):
        User = get_user_model()
        email = options['email']
        password = options['password']
        full_name = options['name']

        if not password:
            raise CommandError(
                'Admin password is required. '
                'Provide it via --password flag or the ADMIN_PASSWORD environment variable.'
            )

        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'Admin user with email "{email}" already exists.')
            )
            return

        User.objects.create_superuser(
            email=email,
            password=password,
            full_name=full_name,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created admin user: {email}'
            )
        )
