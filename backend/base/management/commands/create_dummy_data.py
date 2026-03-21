from django.core.management.base import BaseCommand
from base import models
from datetime import time

class Command(BaseCommand):
    help = 'Create dummy data for testing the schedule generator'

    def handle(self, *args, **options):
        self.stdout.write("Creating dummy data...")

        # 1. Create Departments
        dept_se, _ = models.Department.objects.get_or_create(
            name='Software Engineering'
        )
        dept_coe, _ = models.Department.objects.get_or_create(
            name='Computer Engineering'
        )

        # 2. Create Sub-Departments
        subdept_cse, _ = models.SubDepartment.objects.get_or_create(
            name='Computing Systems',
            department=dept_se,
            defaults={'number': '1'}
        )
        subdept_cs, _ = models.SubDepartment.objects.get_or_create(
            name='Cybersecurity',
            department=dept_coe,
            defaults={'number': '1'}
        )

        # 3. Create Buildings
        bldg_a, _ = models.Building.objects.get_or_create(
            name='Building A'
        )

        # 4. Create Room Types
        lab_type, _ = models.RoomType.objects.get_or_create(name='Lab')
        classroom_type, _ = models.RoomType.objects.get_or_create(name='Classroom')

        # 5. Create Rooms
        room_101, _ = models.Room.objects.get_or_create(
            number='101',
            building=bldg_a,
            room_type=classroom_type,
            defaults={'name': 'Room 101', 'capacity': 40}
        )
        room_102, _ = models.Room.objects.get_or_create(
            number='102',
            building=bldg_a,
            room_type=lab_type,
            defaults={'name': 'Room 102', 'capacity': 25}
        )
        room_103, _ = models.Room.objects.get_or_create(
            number='103',
            building=bldg_a,
            room_type=classroom_type,
            defaults={'name': 'Room 103', 'capacity': 35}
        )

        # 6. Create Professors
        prof_john, _ = models.Professor.objects.get_or_create(
            name='Dr. John Smith',
            sub_department=subdept_cse,
            defaults={'user': None}
        )
        prof_jane, _ = models.Professor.objects.get_or_create(
            name='Prof. Jane Doe',
            sub_department=subdept_cs,
            defaults={'user': None}
        )
        prof_bob, _ = models.Professor.objects.get_or_create(
            name='Dr. Bob Wilson',
            sub_department=subdept_cse,
            defaults={'user': None}
        )

        # 7. Create Courses
        course_dsa, _ = models.Course.objects.get_or_create(
            code='DSA101',
            name='Data Structures & Algorithms',
            defaults={
                'duration_minutes': 60,
                'frequency_per_week': 3,
                'units': 4
            }
        )
        course_db, _ = models.Course.objects.get_or_create(
            code='DB201',
            name='Database Systems',
            defaults={
                'duration_minutes': 90,
                'frequency_per_week': 2,
                'units': 3,
                'room_requirement': classroom_type
            }
        )
        course_web, _ = models.Course.objects.get_or_create(
            code='WEB101',
            name='Web Development',
            defaults={
                'duration_minutes': 90,
                'frequency_per_week': 2,
                'units': 3,
                'room_requirement': lab_type
            }
        )
        course_os, _ = models.Course.objects.get_or_create(
            code='OS301',
            name='Operating Systems',
            defaults={
                'duration_minutes': 60,
                'frequency_per_week': 3,
                'units': 3
            }
        )

        # 8. Create Blocks (Year Levels + Sections)
        block_1a, _ = models.Block.objects.get_or_create(
            code='1A',
            year=1,
            sub_department=subdept_cse
        )
        block_2a, _ = models.Block.objects.get_or_create(
            code='2A',
            year=2,
            sub_department=subdept_cse
        )
        block_1b, _ = models.Block.objects.get_or_create(
            code='1B',
            year=1,
            sub_department=subdept_cs
        )

        # 9. Create TimeSlots
        time_slots_data = [
            ('Monday', time(8, 0), time(9, 0)),
            ('Monday', time(9, 0), time(10, 30)),
            ('Monday', time(10, 30), time(12, 0)),
            ('Tuesday', time(8, 0), time(9, 30)),
            ('Tuesday', time(9, 30), time(11, 0)),
            ('Tuesday', time(13, 0), time(14, 30)),
            ('Wednesday', time(8, 0), time(9, 0)),
            ('Wednesday', time(9, 0), time(10, 30)),
            ('Wednesday', time(10, 30), time(12, 0)),
            ('Thursday', time(8, 0), time(9, 30)),
            ('Thursday', time(13, 0), time(14, 30)),
            ('Friday', time(8, 0), time(9, 0)),
            ('Friday', time(9, 0), time(10, 30)),
        ]

        slots = []
        for day, start, end in time_slots_data:
            slot, _ = models.TimeSlot.objects.get_or_create(
                day=day,
                start_time=start,
                end_time=end
            )
            slots.append(slot)

        # 10. Create Curricula (link courses to blocks)
        curr_1a, _ = models.Curriculum.objects.get_or_create(
            name='Computing Systems - Year 1',
            sub_department=subdept_cse
        )
        curr_1a.courses.set([course_dsa, course_web])
        curr_1a.blocks.set([block_1a])

        curr_2a, _ = models.Curriculum.objects.get_or_create(
            name='Computing Systems - Year 2',
            sub_department=subdept_cse
        )
        curr_2a.courses.set([course_db, course_os])
        curr_2a.blocks.set([block_2a])

        curr_1b, _ = models.Curriculum.objects.get_or_create(
            name='Cybersecurity - Year 1',
            sub_department=subdept_cs
        )
        curr_1b.courses.set([course_dsa, course_db])
        curr_1b.blocks.set([block_1b])

        self.stdout.write(self.style.SUCCESS('✓ Departments created'))
        self.stdout.write(self.style.SUCCESS('✓ Sub-departments created'))
        self.stdout.write(self.style.SUCCESS('✓ Buildings and rooms created'))
        self.stdout.write(self.style.SUCCESS('✓ Professors created'))
        self.stdout.write(self.style.SUCCESS('✓ Courses created'))
        self.stdout.write(self.style.SUCCESS('✓ Blocks created'))
        self.stdout.write(self.style.SUCCESS('✓ Time slots created'))
        self.stdout.write(self.style.SUCCESS('✓ Curricula created'))
        self.stdout.write(self.style.SUCCESS('\n✅ All dummy data created successfully!'))
        self.stdout.write('Now go to Admin Dashboard and click "Generate Schedule" to test the scheduler.')
