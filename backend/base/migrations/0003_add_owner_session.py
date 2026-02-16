"""Add owner_session field to schedule models.

Generated manually.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0002_professor_room_section_subject_delete_scheduledata'),
    ]

    operations = [
        migrations.AddField(
            model_name='subject',
            name='owner_session',
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='professor',
            name='owner_session',
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='room',
            name='owner_session',
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='section',
            name='owner_session',
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
    ]
