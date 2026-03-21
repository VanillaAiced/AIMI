from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from . import models
from . import scheduler


class SchedulerTests(TestCase):
    def setUp(self):
        # create user
        self.user = User.objects.create_user(username='testuser', password='pass')
        # create resources
        rt = models.RoomType.objects.create(name='LECTURE')
        bld = models.Building.objects.create(name='MAIN')
        r1 = models.Room.objects.create(name='R1', building=bld, number='101', floor=1, room_type=rt, capacity=40)
        ts1 = models.TimeSlot.objects.create(day='MONDAY', start_time='07:00', end_time='08:30')
        dept = models.Department.objects.create(name='SEA')
        sub = models.SubDepartment.objects.create(name='SEA-Computer Engineering', department=dept)
        block = models.Block.objects.create(code='CPE-101', sub_department=sub, year=1)
        course = models.Course.objects.create(name='Datastalgo', code='DATASTALGO', duration_minutes=90, frequency_per_week=1, units=3)
        prof = models.Professor.objects.create(name='Prof X')
        # assign course to block via curriculum
        curr = models.Curriculum.objects.create(name='C1', sub_department=sub)
        curr.courses.add(course)
        curr.blocks.add(block)

    def test_scheduler_creates_entries(self):
        before = models.ScheduleEntry.objects.count()
        res = scheduler.generate_schedule()
        after = models.ScheduleEntry.objects.count()
        self.assertGreaterEqual(res['created'], 0)
        self.assertEqual(after - before, res['created'])


class APIGenerationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='apiuser', password='pass')
        # make API user an admin so they can create resources in tests
        self.user.is_staff = True
        self.user.save()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_resources_and_trigger(self):
        # create room type
        rt = self.client.post('/api/room-types/', {'name': 'LECTURE'}, format='json')
        self.assertEqual(rt.status_code, 201)
        # create building
        bld = self.client.post('/api/buildings/', {'name': 'MAIN'}, format='json')
        self.assertEqual(bld.status_code, 201)
        # create room
        room = self.client.post('/api/rooms/', {'name': 'R1', 'building': bld.data['id'], 'number': '101', 'floor': 1, 'room_type': rt.data['id'], 'capacity': 40}, format='json')
        self.assertEqual(room.status_code, 201)
        # create timeslot
        ts = self.client.post('/api/timeslots/', {'day': 'MONDAY', 'start_time': '07:00', 'end_time': '08:30'}, format='json')
        self.assertEqual(ts.status_code, 201)
        # create department/sub/block/course/prof/offering
        dept = self.client.post('/api/departments/', {'name': 'SEA'}, format='json')
        sub = self.client.post('/api/subdepartments/', {'name': 'SEA-Computer Engineering', 'department': dept.data['id']}, format='json')
        block = self.client.post('/api/blocks/', {'code': 'CPE-101', 'sub_department': sub.data['id'], 'year': 1}, format='json')
        course = self.client.post('/api/courses/', {'name': 'Datastalgo', 'code': 'DATASTALGO', 'duration_minutes': 90, 'frequency_per_week': 1, 'units': 3}, format='json')
        prof = self.client.post('/api/professors/', {'name': 'Prof API'}, format='json')
        # create curriculum linking course and block
        curr = self.client.post('/api/curricula/', {'name': 'C1', 'sub_department': sub.data['id'], 'courses': [course.data['id']], 'blocks': [block.data['id']]}, format='json')
        self.assertEqual(curr.status_code, 201)

        # trigger generation
        gen = self.client.post('/api/schedule-entries/generate/', {}, format='json')
        self.assertEqual(gen.status_code, 200)
        self.assertIn('created', gen.data)