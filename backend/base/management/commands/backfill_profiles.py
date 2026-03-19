from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from base.models import Professor


class Command(BaseCommand):
    help = 'Backfill Profile.department/sub_department/year/block where possible from existing models.'

    def handle(self, *args, **options):
        User = get_user_model()
        updated = 0
        for u in User.objects.all():
            profile = getattr(u, 'profile', None)
            if not profile:
                continue
            # Only backfill empty fields
            changed = False
            # Try to match a Professor entry for this user (by username or full name)
            try:
                prof = Professor.objects.filter(name__iexact=u.username).first()
                if not prof and u.first_name:
                    prof = Professor.objects.filter(name__iexact=u.first_name).first()
                if prof:
                    if not profile.department and prof.department:
                        profile.department = prof.department
                        changed = True
                    if not profile.sub_department and prof.sub_department:
                        profile.sub_department = prof.sub_department
                        changed = True
                if changed:
                    profile.save()
                    updated += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error processing user {u.username}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Profiles updated: {updated}'))
