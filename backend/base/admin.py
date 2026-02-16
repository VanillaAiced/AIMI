from django.contrib import admin

# Register your models here.
from .models import Subject, Professor, Room, Section


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
	list_display = ('code', 'name', 'block', 'units', 'hours', 'created_at')
	search_fields = ('code', 'name')
	readonly_fields = ('created_at',)


@admin.register(Professor)
class ProfessorAdmin(admin.ModelAdmin):
	list_display = ('name', 'created_at')
	search_fields = ('name',)
	readonly_fields = ('created_at',)


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
	list_display = ('name', 'room_type', 'capacity', 'created_at')
	search_fields = ('name',)
	readonly_fields = ('created_at',)


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
	list_display = ('name', 'department', 'year_level', 'created_at')
	search_fields = ('name', 'department')
	readonly_fields = ('created_at',)
