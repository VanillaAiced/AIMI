from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0008_add_subdepartment_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='department',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name=None, to='base.department'),
        ),
        migrations.AddField(
            model_name='profile',
            name='sub_department',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name=None, to='base.subdepartment'),
        ),
        migrations.AddField(
            model_name='profile',
            name='year',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='block',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name=None, to='base.block'),
        ),
    ]
