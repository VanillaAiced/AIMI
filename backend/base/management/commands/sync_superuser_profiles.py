from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Sync Profile.role to "admin" for users with is_superuser=True'

    def handle(self, *args, **options):
        updated = 0
        for u in User.objects.filter(is_superuser=True):
            try:
                profile = getattr(u, 'profile', None)
                if profile is None:
                    # create profile if missing
                    from base.models import Profile
                    Profile.objects.create(user=u, role='admin')
                    updated += 1
                else:
                    if profile.role != 'admin':
                        profile.role = 'admin'
                        profile.save()
                        updated += 1
            except Exception as e:
                self.stderr.write(f'Failed for user {u.username}: {e}')
        self.stdout.write(self.style.SUCCESS(f'Synced {updated} profiles to admin'))
