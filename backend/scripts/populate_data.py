"""
Populate database with initial setup.
This script now serves as a template for data creation.
To add your own data, uncomment and modify the sections below.
Run from backend directory: python scripts/populate_data.py
"""
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from base.models import School

# Create School (required for operations)
school, created = School.objects.get_or_create(
    name='Default School'
)
if created:
    print("✓ School created")
else:
    print("✓ School already exists")

print("\n✅ Setup complete! Database is ready for your data.")
print("\nTo add initial data:")
print("1. Create TimeSlots in admin or via API")
print("2. Create Rooms in admin or via API")
print("3. Create Professors in admin or via API")
print("4. Create Departments and SubDepartments")
print("5. Create Courses and link them to Curricula with Blocks")
print("6. Then generate schedules")

