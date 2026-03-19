from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0007_alter_block_id_alter_building_id_alter_course_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='subdepartment',
            name='number',
            field=models.CharField(max_length=50, null=True, blank=True),
        ),
    ]
