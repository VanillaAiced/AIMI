from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from base.models import Profile

User = get_user_model()


class Command(BaseCommand):
    help = 'Make a user an admin'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to promote to admin')

    def handle(self, *args, **options):
        username = options['username']
        try:
            user = User.objects.get(username=username)
            user.is_staff = True
            user.is_superuser = True
            user.save()

            # Also set profile role to admin
            try:
                profile = user.profile
            except Profile.DoesNotExist:
                profile = Profile.objects.create(user=user)
            
            profile.role = 'admin'
            profile.save()

            self.stdout.write(
                self.style.SUCCESS(f'Successfully made "{username}" an admin')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User "{username}" does not exist')
            )
