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

# Create essential default data (required for schedule generation)
print("\nCreating essential resources...")

# Create default RoomType if needed
room_type, _ = RoomType.objects.get_or_create(
    name='Lecture Hall'
)

# Create default Building if needed
building, _ = Building.objects.get_or_create(
    name='Main Building',
    defaults={'school': school}
)

# Create a sample Room for testing (users should add their own)
room, created = Room.objects.get_or_create(
    name='101',
    defaults={
        'building': building,
        'capacity': 50,
        'room_type': room_type
    }
)
if created:
    print("✓ Sample Room (Main Building - 101) created")

# Create standard TimeSlots (Monday-Friday, standard academic hours)
days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
time_slots_created = 0

for day in days:
    for hour in [8, 9, 10, 11, 13, 14, 15, 16]:  # 8am-5pm with lunch break
        start_time = time(hour, 0)
        end_time = time(hour + 1, 0)
        ts, created = TimeSlot.objects.get_or_create(
            day=day,
            start_time=start_time,
            end_time=end_time
        )
        if created:
            time_slots_created += 1

print(f"✓ TimeSlots: {time_slots_created} created (Mon-Fri, 8am-6pm)")

# All dummy data has been removed. Add your real data below:
# 
# Example: Create a Department
# dept, _ = Department.objects.get_or_create(
#     name='Your Department Name',
#     defaults={'school': school}
# )
# print(f"✓ Department: {dept.name}")

print("\n✅ Setup complete! Database is ready for your data.")
