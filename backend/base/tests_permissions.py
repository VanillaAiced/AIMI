from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status


class PermissionsTests(TestCase):
    def setUp(self):
        User = get_user_model()
        # normal user
        self.user = User.objects.create_user(username='user1', password='pass')
        # admin user
        self.admin = User.objects.create_user(username='admin1', password='pass')
        # promote admin via profile or is_staff
        try:
            self.admin.profile.role = 'admin'
            self.admin.profile.save()
        except Exception:
            # fallback to staff
            self.admin.is_staff = True
            self.admin.save()

        self.client = APIClient()

    def test_non_admin_cannot_create_department(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.post('/api/departments/', {'name': 'New Dept'}, format='json')
        self.assertIn(resp.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_admin_can_create_department(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post('/api/departments/', {'name': 'New Dept'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
