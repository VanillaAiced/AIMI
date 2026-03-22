from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver


# School / Admin level
class School(models.Model):
	name = models.CharField(max_length=255, unique=True)

	def __str__(self):
		return self.name


class Department(models.Model):
	name = models.CharField(max_length=200)
	# allow school to be optional to simplify migrations from legacy flat data
	school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='departments', null=True, blank=True)

	class Meta:
		unique_together = ('name', 'school')

	def __str__(self):
		return f"{self.name}"


class SubDepartment(models.Model):
	name = models.CharField(max_length=200)
	department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='subdepartments')
	# optional numeric identifier / code for the sub-department
	number = models.CharField(max_length=50, null=True, blank=True)

	class Meta:
		unique_together = ('name', 'department')

	def __str__(self):
		return f"{self.name}"


# Blocks (e.g. CPE-101)
class Block(models.Model):
	code = models.CharField(max_length=50, unique=True)
	sub_department = models.ForeignKey(SubDepartment, on_delete=models.CASCADE, related_name='blocks')
	year = models.IntegerField()
	# compatibility fields
	owner_session = models.CharField(max_length=100, blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.code


# Buildings, Rooms and Room Types
class Building(models.Model):
	name = models.CharField(max_length=100, unique=True)

	def __str__(self):
		return self.name


class RoomType(models.Model):
	name = models.CharField(max_length=100, unique=True)

	def __str__(self):
		return self.name


class Room(models.Model):
	# allow existing rows without a building to avoid one-off migration defaults
	building = models.ForeignKey(Building, on_delete=models.SET_NULL, null=True, blank=True, related_name='rooms')
	# allow floor to be null for existing rows during migration
	floor = models.IntegerField(null=True, blank=True)
	number = models.CharField(max_length=20, null=True, blank=True)
	# compatibility: keep legacy `name` used by frontend/imports
	name = models.CharField(max_length=200, null=True, blank=True)
	room_type = models.ForeignKey(RoomType, on_delete=models.SET_NULL, null=True, blank=True)
	capacity = models.IntegerField(null=True, blank=True)
	owner_session = models.CharField(max_length=100, blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		unique_together = ('building', 'floor', 'number')

	def __str__(self):
		return f"{self.building.name}-{self.floor}{self.number}"


# Time slots
class TimeSlot(models.Model):
	TYPE_CHOICES = [
		('LECTURE', 'Lecture'),
		('LAB', 'Lab'),
	]
	DAY_CHOICES = [
		('MONDAY', 'Monday'),
		('TUESDAY', 'Tuesday'),
		('WEDNESDAY', 'Wednesday'),
		('THURSDAY', 'Thursday'),
		('FRIDAY', 'Friday'),
		('SATURDAY', 'Saturday'),
		('SUNDAY', 'Sunday'),
	]

	day = models.CharField(max_length=20, choices=DAY_CHOICES)
	start_time = models.TimeField()
	end_time = models.TimeField()
	type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='LECTURE')

	class Meta:
		unique_together = ('day', 'start_time', 'end_time', 'type')

	def __str__(self):
		return f"{self.get_day_display()} {self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')} ({self.get_type_display()})"


# Courses and offerings
class Course(models.Model):
	name = models.CharField(max_length=255)
	code = models.CharField(max_length=50, unique=True)
	room_requirement = models.ForeignKey(RoomType, on_delete=models.SET_NULL, null=True, blank=True)
	# If professor_requirement is null and `allow_any_professor` is True, then any professor can teach
	professor_requirement = models.ForeignKey(SubDepartment, on_delete=models.SET_NULL, null=True, blank=True)
	allow_any_professor = models.BooleanField(default=False)
	duration_minutes = models.IntegerField(help_text='Duration in minutes per session')
	frequency_per_week = models.IntegerField(default=1)
	units = models.IntegerField(default=0)
	# compatibility fields
	owner_session = models.CharField(max_length=100, blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.code} - {self.name}"


# CourseOffering removed: courses are linked to blocks via `Curriculum` instead.


# Curriculum and YearLevels
class Curriculum(models.Model):
	name = models.CharField(max_length=255)
	sub_department = models.ForeignKey(SubDepartment, on_delete=models.CASCADE, related_name='curricula')
	courses = models.ManyToManyField(Course, blank=True, related_name='curricula')
	blocks = models.ManyToManyField(Block, blank=True, related_name='curricula')

	def __str__(self):
		return self.name


# YearLevel model removed: handled via migrations when deleting from DB


# Professors
class Professor(models.Model):
	name = models.CharField(max_length=200)
	# link to Django user for easy lookup in admin and programmatic linking
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='professor_profile')
	email = models.EmailField(blank=True, null=True)
	department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='professors')
	sub_department = models.ForeignKey(SubDepartment, on_delete=models.SET_NULL, null=True, blank=True, related_name='professors')
	max_units = models.IntegerField(default=21)
	max_hours = models.IntegerField(null=True, blank=True)
	owner_session = models.CharField(max_length=100, blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.name


class Student(models.Model):
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student')
	department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
	sub_department = models.ForeignKey(SubDepartment, on_delete=models.SET_NULL, null=True, blank=True)
	year = models.IntegerField(null=True, blank=True)
	block = models.ForeignKey(Block, on_delete=models.SET_NULL, null=True, blank=True)

	def __str__(self):
		return f"{self.user.username} (Student)"


# Schedule entries (one per scheduled class session)
class ScheduleEntry(models.Model):
	course = models.ForeignKey(Course, on_delete=models.CASCADE)
	block = models.ForeignKey(Block, on_delete=models.CASCADE)
	professor = models.ForeignKey(Professor, on_delete=models.SET_NULL, null=True, blank=True)
	room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
	time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE)

	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		unique_together = ('room', 'time_slot')

	def __str__(self):
		return f"{self.course} @ {self.time_slot} in {self.room}"


# Backwards-compatibility aliases for existing views/endpoints
# These keep older imports (Subject, Section) working while frontend/api is migrated.
Subject = Course
Section = Block


# Simple user profile to store authoritative role information server-side
class Profile(models.Model):
	ROLE_CHOICES = [
		('admin', 'Admin'),
		('professor', 'Professor'),
		('student', 'Student'),
	]
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
	role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
	# optional academic links for students/professors
	department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
	sub_department = models.ForeignKey(SubDepartment, on_delete=models.SET_NULL, null=True, blank=True)
	year = models.IntegerField(null=True, blank=True)
	block = models.ForeignKey(Block, on_delete=models.SET_NULL, null=True, blank=True)

	def __str__(self):
		return f"{self.user.username} ({self.role})"


# Ensure a Profile exists for each new user
@receiver(post_save, sender=get_user_model())
def create_user_profile(sender, instance, created, **kwargs):
	if created:
		# If a superuser is created (e.g., via `createsuperuser`), make them admin.
		role = 'admin' if getattr(instance, 'is_superuser', False) else 'student'
		Profile.objects.create(user=instance, role=role)
