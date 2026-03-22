"""
Populate database with initial setup.
This script now serves as a template for data creation.
To add your own data, uncomment and modify the sections below.
Run from backend directory: python scripts/populate_data.py
"""
import os
import sys
from pathlib import Path
from datetime import time

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from base.models import School, TimeSlot

# Create School (required for operations)
school, created = School.objects.get_or_create(
    name='Default School'
)
if created:
    print("✓ School created")
else:
    print("✓ School already exists")

# Create default TimeSlots with 5 min break intervals
# Lectures: 1 hour 30 mins, Labs: 3 hours
time_slots = [
    # LECTURES (1h 30m) - Monday to Friday
    ('MONDAY', '08:00', '09:30', 'LECTURE'),
    ('MONDAY', '09:35', '11:05', 'LECTURE'),
    ('MONDAY', '11:10', '12:40', 'LECTURE'),
    ('MONDAY', '12:45', '14:15', 'LECTURE'),
    ('MONDAY', '14:20', '15:50', 'LECTURE'),
    ('TUESDAY', '08:00', '09:30', 'LECTURE'),
    ('TUESDAY', '09:35', '11:05', 'LECTURE'),
    ('TUESDAY', '11:10', '12:40', 'LECTURE'),
    ('TUESDAY', '12:45', '14:15', 'LECTURE'),
    ('TUESDAY', '14:20', '15:50', 'LECTURE'),
    ('WEDNESDAY', '08:00', '09:30', 'LECTURE'),
    ('WEDNESDAY', '09:35', '11:05', 'LECTURE'),
    ('WEDNESDAY', '11:10', '12:40', 'LECTURE'),
    ('WEDNESDAY', '12:45', '14:15', 'LECTURE'),
    ('WEDNESDAY', '14:20', '15:50', 'LECTURE'),
    ('THURSDAY', '08:00', '09:30', 'LECTURE'),
    ('THURSDAY', '09:35', '11:05', 'LECTURE'),
    ('THURSDAY', '11:10', '12:40', 'LECTURE'),
    ('THURSDAY', '12:45', '14:15', 'LECTURE'),
    ('THURSDAY', '14:20', '15:50', 'LECTURE'),
    ('FRIDAY', '08:00', '09:30', 'LECTURE'),
    ('FRIDAY', '09:35', '11:05', 'LECTURE'),
    ('FRIDAY', '11:10', '12:40', 'LECTURE'),
    ('FRIDAY', '12:45', '14:15', 'LECTURE'),
    ('FRIDAY', '14:20', '15:50', 'LECTURE'),
    
    # LABS (3 hours) - Monday to Friday
    ('MONDAY', '08:00', '11:00', 'LAB'),
    ('MONDAY', '11:05', '14:05', 'LAB'),
    ('TUESDAY', '08:00', '11:00', 'LAB'),
    ('TUESDAY', '11:05', '14:05', 'LAB'),
    ('WEDNESDAY', '08:00', '11:00', 'LAB'),
    ('WEDNESDAY', '11:05', '14:05', 'LAB'),
    ('THURSDAY', '08:00', '11:00', 'LAB'),
    ('THURSDAY', '11:05', '14:05', 'LAB'),
    ('FRIDAY', '08:00', '11:00', 'LAB'),
    ('FRIDAY', '11:05', '14:05', 'LAB'),
]

for day, start_str, end_str, slot_type in time_slots:
    start_time = time.fromisoformat(start_str)
    end_time = time.fromisoformat(end_str)
    slot, created = TimeSlot.objects.get_or_create(
        day=day,
        start_time=start_time,
        end_time=end_time,
        type=slot_type
    )
    if created:
        print(f"✓ TimeSlot created: {day} {start_str}-{end_str} ({slot_type})")

print("\n✅ Setup complete! Database is ready for your data.")

