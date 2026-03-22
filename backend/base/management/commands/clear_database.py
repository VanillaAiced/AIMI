from django.core.management.base import BaseCommand
from base.models import (
    Department, SubDepartment, Building, Block, Room, RoomType, School, 
    TimeSlot, Professor, Course, Curriculum, ScheduleEntry
)


class Command(BaseCommand):
    help = 'Clear all dummy data from the database while keeping the structure intact'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion without prompting',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(self.style.WARNING(
                '⚠️  This will DELETE ALL data from the database!'
            ))
            response = input('Type "yes" to confirm: ')
            if response.lower() != 'yes':
                self.stdout.write(self.style.ERROR('Cancelled.'))
                return

        models_to_clear = [
            (ScheduleEntry, "Schedule Entries"),
            (Curriculum, "Curricula"),
            (Block, "Blocks"),
            (Course, "Courses"),
            (Professor, "Professors"),
            (TimeSlot, "TimeSlots"),
            (Room, "Rooms"),
            (RoomType, "Room Types"),
            (Building, "Buildings"),
            (SubDepartment, "Sub-Departments"),
            (Department, "Departments"),
            (School, "Schools"),
        ]

        self.stdout.write(self.style.SUCCESS('Clearing database...\n'))

        for model, model_name in models_to_clear:
            count = model.objects.count()
            model.objects.all().delete()
            self.stdout.write(f'✓ Deleted {count} {model_name}')

        self.stdout.write(self.style.SUCCESS('\n✅ Database cleared successfully!'))
