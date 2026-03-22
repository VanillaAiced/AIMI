"""
Clear all populated dummy data from the database.
Run from backend directory: python scripts/clear_data.py
"""
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from base.models import (
    Department, SubDepartment, Building, Block, Room, RoomType, School, 
    TimeSlot, Professor, Course, Curriculum, ScheduleEntry
)

def clear_data():
    """Delete all records from database (keeps structure, clears data)."""
    
    models_to_clear = [
        (ScheduleEntry, "Schedule Entries"),
        (Curriculum, "Curricula"),
        (Block, "Blocks"),
        (Course, "Courses"),
        (Professor, "Professors"),
        (TimeSlot, "TimeSlots"),
        (Room, "Rooms"),
        (RoomType, "Room Types"),
        (Building, "Buildings"),
        (SubDepartment, "Sub-Departments"),
        (Department, "Departments"),
        (School, "Schools"),
    ]
    
    print("Clearing database...\n")
    
    for model, model_name in models_to_clear:
        count = model.objects.count()
        model.objects.all().delete()
        print(f"✓ Deleted {count} {model_name}")
    
    print("\n✅ Database cleared successfully!")
    print("You can now input real data via the admin panel or API.")

if __name__ == '__main__':
    try:
        clear_data()
    except Exception as e:
        print(f"❌ Error clearing data: {e}")
        sys.exit(1)
