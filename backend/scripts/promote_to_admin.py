import os
import sys
from pathlib import Path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
email = 'admin@gmail.com'
try:
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        # Create admin account if it doesn't exist
        user = User.objects.create_superuser(
            username=email,
            email=email,
            password='admin123'
        )
        print(f'Created new admin account: {email} with password: admin123')
    else:
        # Promote existing user
        user.is_superuser = True
        user.is_staff = True
        user.save()
        print(f'Promoted {user.username} to admin')
    
    # Ensure profile exists
    profile = getattr(user, 'profile', None)
    from base.models import Profile
    if profile is None:
        Profile.objects.create(user=user, role='admin')
        print(f'Created Profile for {user.username}')
except Exception as e:
    print('Error promoting user:', e)
    sys.exit(0)
    
    # Ensure profile exists
    profile = getattr(user, 'profile', None)
    from base.models import Profile
    if profile is None:
        Profile.objects.create(user=user, role='admin')
        print(f'Created Profile for {user.username}')
except Exception as e:
    print('Error promoting user:', e)
    sys.exit(0)
