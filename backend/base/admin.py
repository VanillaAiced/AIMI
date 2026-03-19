from django.contrib import admin
from django.contrib.auth import get_user_model

# Register your models here.
from .models import (
	School,
	Department,
	SubDepartment,
	Block,
	Building,
	RoomType,
	Room,
	TimeSlot,
	Course,
	CourseOffering,
	Curriculum,
	YearLevel,
	Professor,
	Student,
	ScheduleEntry,
)


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
	list_display = ('name',)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
	list_display = ('name', 'school')
	search_fields = ('name',)


@admin.register(SubDepartment)
class SubDepartmentAdmin(admin.ModelAdmin):
	list_display = ('name', 'department', 'number')
	search_fields = ('name',)


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
	list_display = ('code', 'sub_department', 'year')
	search_fields = ('code',)


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
	list_display = ('name',)


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
	list_display = ('name',)


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
	list_display = ('building', 'floor', 'number', 'room_type', 'capacity')
	search_fields = ('building__name', 'number')


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
	list_display = ('day', 'start_time', 'end_time')


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
	list_display = ('code', 'name', 'units', 'duration_minutes', 'frequency_per_week')
	search_fields = ('code', 'name')


@admin.register(CourseOffering)
class CourseOfferingAdmin(admin.ModelAdmin):
	list_display = ('name', 'course', 'assigned_block', 'assigned_professor')
	search_fields = ('name',)


@admin.register(Curriculum)
class CurriculumAdmin(admin.ModelAdmin):
	list_display = ('name', 'sub_department')


@admin.register(YearLevel)
class YearLevelAdmin(admin.ModelAdmin):
	list_display = ('name', 'curriculum')


@admin.register(Professor)
class ProfessorAdmin(admin.ModelAdmin):
	list_display = ('name', 'email', 'department', 'sub_department', 'max_units', 'max_hours')
	search_fields = ('name', 'email')
	actions_on_top = True
	actions_on_bottom = True

	actions = ['delete_with_user']

	def delete_with_user(self, request, queryset):
		User = get_user_model()
		users_to_delete = []
		for prof in queryset:
			# try to find a corresponding User by email or username
			user = None
			try:
				if prof.email:
					user = User.objects.filter(email__iexact=prof.email).first()
				if not user:
					user = User.objects.filter(username__iexact=prof.name).first()
			except Exception:
				user = None
			if user:
				users_to_delete.append(user)
		# delete professors first
		queryset.delete()
		# then delete matched users
		for u in users_to_delete:
			try:
				u.delete()
			except Exception:
				pass
	delete_with_user.short_description = 'Delete selected professors and linked users (if found)'


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
	list_display = ('user', 'department', 'sub_department', 'year', 'block')
	search_fields = ('user__username', 'user__email')
	actions_on_top = True
	actions_on_bottom = True

	actions = ['delete_with_user']

	def delete_with_user(self, request, queryset):
		users = [s.user for s in queryset if getattr(s, 'user', None)]
		# delete student records first
		queryset.delete()
		# then delete corresponding User objects
		for u in users:
			try:
				u.delete()
			except Exception:
				pass
	delete_with_user.short_description = 'Delete selected students and their linked user accounts'


@admin.register(ScheduleEntry)
class ScheduleEntryAdmin(admin.ModelAdmin):
	list_display = ('course_offering', 'course', 'block', 'professor', 'room', 'time_slot')
	search_fields = ('course__code', 'course__name')
