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

from base.models import Department, SubDepartment, Building, Block, Room, RoomType, School, TimeSlot, Professor, Course, Curriculum
from datetime import time

# Create School
school, _ = School.objects.get_or_create(
    name='Default School'
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

# Create Blocks (requires sub_department and year)
blocks = []
for subdept in SubDepartment.objects.all()[:3]:  # Create blocks for first 3 subdepts
    for year in range(1, 4):  # Years 1, 2, 3
        code = f"{subdept.code if hasattr(subdept, 'code') else subdept.id}-Y{year}"
        try:
            blk, _ = Block.objects.get_or_create(
                code=code,
                defaults={'sub_department': subdept, 'year': year}
            )
            blocks.append(blk)
            print(f"✓ Block: {blk.code} (Year {year})")
        except Exception as e:
            print(f"  ✗ Block creation failed: {e}")

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

# Create TimeSlots (Monday-Friday, morningand afternoon slots)
days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
time_slots = []
for day in days:
    # Morning slot: 8:00 AM - 10:00 AM
    ts1, _ = TimeSlot.objects.get_or_create(
        day=day,
        start_time=time(8, 0),
        defaults={'end_time': time(10, 0)}
    )
    time_slots.append(ts1)
    print(f"✓ TimeSlot: {day} 8:00-10:00")
    
    # Mid-morning slot: 10:00 AM - 12:00 PM
    ts2, _ = TimeSlot.objects.get_or_create(
        day=day,
        start_time=time(10, 0),
        defaults={'end_time': time(12, 0)}
    )
    time_slots.append(ts2)
    print(f"✓ TimeSlot: {day} 10:00-12:00")
    
    # Afternoon slot: 1:00 PM - 3:00 PM
    ts3, _ = TimeSlot.objects.get_or_create(
        day=day,
        start_time=time(13, 0),
        defaults={'end_time': time(15, 0)}
    )
    time_slots.append(ts3)
    print(f"✓ TimeSlot: {day} 13:00-15:00")
    
    # Late afternoon slot: 3:00 PM - 5:00 PM
    ts4, _ = TimeSlot.objects.get_or_create(
        day=day,
        start_time=time(15, 0),
        defaults={'end_time': time(17, 0)}
    )
    time_slots.append(ts4)
    print(f"✓ TimeSlot: {day} 15:00-17:00")

# Create Professors
professors = []
prof_names = ['Dr. Smith', 'Dr. Johnson', 'Dr. Brown', 'Dr. Davis', 'Dr. Wilson', 'Dr. Miller']
for idx, prof_name in enumerate(prof_names):
    subdept = SubDepartment.objects.all()[idx % SubDepartment.objects.count()]
    prof, _ = Professor.objects.get_or_create(
        name=prof_name,
        defaults={'sub_department': subdept}
    )
    professors.append(prof)
    print(f"✓ Professor: {prof_name}")

# Create Courses
courses = []
course_names = ['Programming 101', 'Data Structures', 'Web Development', 'Database Design', 'Software Engineering', 'Algorithms']
for idx, course_name in enumerate(course_names):
    course, _ = Course.objects.get_or_create(
        code=f"COURSE{idx+1:03d}",
        defaults={
            'name': course_name,
            'units': 3,
            'frequency_per_week': 2,  # 2 sessions per week
            'duration_minutes': 120  # 2 hours per session
        }
    )
    courses.append(course)
    print(f"✓ Course: {course_name}")

# Create Curricula and assign courses + blocks to them
curricula = []
subdepts = list(SubDepartment.objects.all())[:3]
for subdept in subdepts:
    for year in range(1, 4):
        curr_name = f"{subdept.name} - Year {year}"
        curriculum, _ = Curriculum.objects.get_or_create(
            name=curr_name,
            defaults={'sub_department': subdept}
        )
        
        # Add courses to this curriculum (select 2 per year from available courses)
        selected_courses = courses[(year-1)*2:(year-1)*2+2] if (year-1)*2 < len(courses) else courses[-2:]
        for course in selected_courses:
            curriculum.courses.add(course)
        
        # Add blocks to this curriculum
        blocks_for_subdept = Block.objects.filter(sub_department=subdept, year=year)
        for block in blocks_for_subdept:
            curriculum.blocks.add(block)
        
        curricula.append(curriculum)
        print(f"✓ Curriculum: {curr_name} with {curriculum.courses.count()} courses and {curriculum.blocks.count()} blocks")

print("\n✅ Database populated successfully!")
