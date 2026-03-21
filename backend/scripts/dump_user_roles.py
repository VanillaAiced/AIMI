import os
import sys
from pathlib import Path
import django
# Ensure project root is on sys.path so `backend` settings module can be imported
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
for u in User.objects.all():
    profile = getattr(u, 'profile', None)
    role = getattr(profile, 'role', None) if profile else None
    print(f'{u.username}\tsuper={u.is_superuser}\trole={role}')
