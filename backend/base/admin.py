from django.contrib import admin

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
	list_display = ('name', 'department')
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


@admin.register(ScheduleEntry)
class ScheduleEntryAdmin(admin.ModelAdmin):
	list_display = ('course_offering', 'course', 'block', 'professor', 'room', 'time_slot')
	search_fields = ('course__code', 'course__name')
