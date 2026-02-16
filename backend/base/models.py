from django.db import models


# Proper typed models for schedule data
class Subject(models.Model):
	name = models.CharField(max_length=200)
	code = models.CharField(max_length=50, unique=True)
	block = models.CharField(max_length=100, blank=True)
	units = models.IntegerField()
	hours = models.IntegerField()
	# session identifier so we can associate data with a user's session
	owner_session = models.CharField(max_length=100, blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.code} - {self.name}"


class Professor(models.Model):
	name = models.CharField(max_length=200, unique=True)
	availability = models.TextField(blank=True)
	owner_session = models.CharField(max_length=100, blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.name


class Room(models.Model):
	ROOM_TYPES = [
		('LECTURE', 'Lecture'),
		('LAB', 'Lab'),
		('CONFERENCE', 'Conference'),
	]

	name = models.CharField(max_length=200, unique=True)
	capacity = models.IntegerField()
	room_type = models.CharField(max_length=20, choices=ROOM_TYPES)
	owner_session = models.CharField(max_length=100, blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.name


class Section(models.Model):
	name = models.CharField(max_length=200)
	department = models.CharField(max_length=200)
	year_level = models.IntegerField()
	owner_session = models.CharField(max_length=100, blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		unique_together = ('name', 'department', 'year_level')

	def __str__(self):
		return f"{self.name} ({self.department} - Year {self.year_level})"
