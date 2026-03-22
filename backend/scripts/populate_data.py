"""
Populate database with sample departments, blocks, buildings, and rooms.
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

from base.models import Department, SubDepartment, Building, Block, Room, RoomType, School

# Create School
school, _ = School.objects.get_or_create(
    name='Default School',
    defaults={'code': 'DEFAULT'}
)
print("✓ School created")

# Create Departments
dept_names = ['Computer Science', 'Engineering', 'Business', 'Arts', 'Science']
departments = []
for dept_name in dept_names:
    dept, _ = Department.objects.get_or_create(
        name=dept_name,
        defaults={'school': school}
    )
    departments.append(dept)
    print(f"✓ Department: {dept_name}")

# Create SubDepartments for each department
subdept_names = ['Core', 'Advanced', 'Electives']
for dept in departments:
    for subdept_name in subdept_names:
        subdept, _ = SubDepartment.objects.get_or_create(
            name=f"{dept.name} - {subdept_name}",
            department=dept
        )
        print(f"  ✓ Sub-department: {subdept.name}")

# Create Buildings
building_names = ['Building A', 'Building B', 'Building C']
buildings = []
for bldg_name in building_names:
    bldg, _ = Building.objects.get_or_create(name=bldg_name)
    buildings.append(bldg)
    print(f"✓ Building: {bldg_name}")

# Create Blocks
block_names = ['Block 1', 'Block 2', 'Block 3']
blocks = []
for blk_name in block_names:
    blk, _ = Block.objects.get_or_create(name=blk_name)
    blocks.append(blk)
    print(f"✓ Block: {blk_name}")

# Create Room Types
room_types_data = ['Lecture Hall', 'Lab', 'Classroom', 'Conference Room']
room_types = []
for rt_name in room_types_data:
    rt, _ = RoomType.objects.get_or_create(name=rt_name)
    room_types.append(rt)
    print(f"✓ Room Type: {rt_name}")

# Create Rooms
for idx, building in enumerate(buildings):
    for room_num in range(101, 106):
        room_name = f"{building.name} - Room {room_num}"
        room, _ = Room.objects.get_or_create(
            name=room_name,
            defaults={
                'building': building,
                'capacity': 30 + (room_num % 20),
                'room_type': room_types[idx % len(room_types)]
            }
        )
        print(f"  ✓ Room: {room_name}")

print("\n✅ Database populated successfully!")
