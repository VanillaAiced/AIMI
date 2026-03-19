from rest_framework import serializers
from . import models
from django.db import transaction


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.School
        fields = '__all__'


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Department
        fields = '__all__'


class SubDepartmentSerializer(serializers.ModelSerializer):
    # expose department name for convenience in API responses
    department_name = serializers.CharField(source='department.name', read_only=True)
    class Meta:
        model = models.SubDepartment
        fields = '__all__'


class BlockSerializer(serializers.ModelSerializer):
    # helpful display fields
    sub_department_name = serializers.CharField(source='sub_department.name', read_only=True)
    department_name = serializers.CharField(source='sub_department.department.name', read_only=True)
    class Meta:
        model = models.Block
        fields = '__all__'


class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Building
        fields = '__all__'


class RoomTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.RoomType
        fields = '__all__'


class RoomSerializer(serializers.ModelSerializer):
    # accept room_type as a string name or as an object; we handle creation in create/update
    room_type = serializers.CharField(allow_null=True, required=False)
    # expose room_type name for frontend convenience
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    building = serializers.PrimaryKeyRelatedField(queryset=models.Building.objects.all(), allow_null=True, required=False)

    class Meta:
        model = models.Room
        fields = '__all__'

    def validate(self, data):
        # require either name or building+number to identify a room
        if not data.get('name') and not (data.get('building') and data.get('number')):
            raise serializers.ValidationError('Room must have a `name` or both `building` and `number`.')
        return data

    @transaction.atomic
    def create(self, validated_data):
        # handle nested room_type creation if dict provided
        rt = validated_data.pop('room_type', None)
        bd = validated_data.pop('building', None)

        # if caller passed nested dicts (not typical with PKRelatedField), handle gracefully
        # allow rt as dict, string name, or already-resolved instance
        if isinstance(rt, dict):
            rt_obj, _ = models.RoomType.objects.get_or_create(**rt)
            validated_data['room_type'] = rt_obj
        elif isinstance(rt, str):
            rt_obj, _ = models.RoomType.objects.get_or_create(name=rt)
            validated_data['room_type'] = rt_obj
        elif rt is not None:
            validated_data['room_type'] = rt

        if isinstance(bd, dict):
            bd_obj, _ = models.Building.objects.get_or_create(**bd)
            validated_data['building'] = bd_obj
        elif bd is not None:
            validated_data['building'] = bd

        room = super().create(validated_data)
        return room

    @transaction.atomic
    def update(self, instance, validated_data):
        # similar nested handling on update
        rt = validated_data.pop('room_type', None)
        bd = validated_data.pop('building', None)
        if isinstance(rt, dict):
            rt_obj, _ = models.RoomType.objects.get_or_create(**rt)
            validated_data['room_type'] = rt_obj
        elif isinstance(rt, str):
            rt_obj, _ = models.RoomType.objects.get_or_create(name=rt)
            validated_data['room_type'] = rt_obj
        elif rt is not None:
            validated_data['room_type'] = rt

        if isinstance(bd, dict):
            bd_obj, _ = models.Building.objects.get_or_create(**bd)
            validated_data['building'] = bd_obj
        elif bd is not None:
            validated_data['building'] = bd

        return super().update(instance, validated_data)


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TimeSlot
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    room_requirement = serializers.PrimaryKeyRelatedField(queryset=models.RoomType.objects.all(), allow_null=True, required=False)

    class Meta:
        model = models.Course
        fields = '__all__'

    def validate(self, data):
        # enforce sensible defaults and types
        if 'duration_minutes' in data and data['duration_minutes'] <= 0:
            raise serializers.ValidationError('duration_minutes must be > 0')
        return data

    @transaction.atomic
    def create(self, validated_data):
        # allow nested room_requirement dict to be created
        rr = validated_data.get('room_requirement')
        if isinstance(rr, dict):
            rr_obj, _ = models.RoomType.objects.get_or_create(**rr)
            validated_data['room_requirement'] = rr_obj
        return super().create(validated_data)


class CourseOfferingSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(queryset=models.Course.objects.all())
    assigned_block = serializers.PrimaryKeyRelatedField(queryset=models.Block.objects.all())
    assigned_professor = serializers.PrimaryKeyRelatedField(queryset=models.Professor.objects.all(), allow_null=True, required=False)

    class Meta:
        model = models.CourseOffering
        fields = '__all__'

    def validate(self, data):
        # ensure frequency and duration make sense on the related course
        return data

    @transaction.atomic
    def create(self, validated_data):
        # support nested dicts in incoming payloads
        course = validated_data.get('course')
        block = validated_data.get('assigned_block')
        prof = validated_data.get('assigned_professor')

        # if caller used nested dicts instead of PKs, create/get
        if isinstance(course, dict):
            course_obj, _ = models.Course.objects.get_or_create(code=course.get('code'), defaults=course)
            validated_data['course'] = course_obj
        if isinstance(block, dict):
            # block requires sub_department; allow minimal creation
            sub = block.get('sub_department')
            if isinstance(sub, dict):
                dep_obj, _ = models.Department.objects.get_or_create(name=sub.get('name'))
                sub_obj, _ = models.SubDepartment.objects.get_or_create(name=sub.get('name'), department=dep_obj)
                block['sub_department'] = sub_obj
            block_obj, _ = models.Block.objects.get_or_create(code=block.get('code'), defaults=block)
            validated_data['assigned_block'] = block_obj
        if isinstance(prof, dict):
            prof_obj, _ = models.Professor.objects.get_or_create(name=prof.get('name'), defaults=prof)
            validated_data['assigned_professor'] = prof_obj

        return super().create(validated_data)


class CurriculumSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Curriculum
        fields = '__all__'


class YearLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.YearLevel
        fields = '__all__'


class ProfessorSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    sub_department_name = serializers.CharField(source='sub_department.name', read_only=True)
    class Meta:
        model = models.Professor
        fields = '__all__'

    def validate_max_units(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('max_units must be non-negative')
        return value


class ScheduleEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ScheduleEntry
        fields = '__all__'
