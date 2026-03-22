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

from base.models import Department, SubDepartment, Building, Block, Room, RoomType, School, TimeSlot, Professor, Course, Curriculum
from datetime import time

# Create School (required for operations)
school, created = School.objects.get_or_create(
    name='Default School'
)
if created:
    print("✓ School created")
else:
    print("✓ School already exists")

# All dummy data has been removed. Add your real data below:
# 
# Example: Create a Department
# dept, _ = Department.objects.get_or_create(
#     name='Your Department Name',
#     defaults={'school': school}
# )
# print(f"✓ Department: {dept.name}")

print("\n✅ Setup complete! Database is ready for your data.")
