from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0009_profile_academic_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='Student',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.IntegerField(blank=True, null=True)),
                ('department', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, to='base.department')),
                ('sub_department', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, to='base.subdepartment')),
                ('block', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, to='base.block')),
                ('user', models.OneToOneField(on_delete=models.CASCADE, related_name='student', to='auth.user')),
            ],
        ),
    ]
