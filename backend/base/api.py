from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from . import models, serializers
from . import scheduler


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = models.School.objects.all()
    serializer_class = serializers.SchoolSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = models.Department.objects.all()
    serializer_class = serializers.DepartmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class SubDepartmentViewSet(viewsets.ModelViewSet):
    queryset = models.SubDepartment.objects.all()
    serializer_class = serializers.SubDepartmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class BlockViewSet(viewsets.ModelViewSet):
    queryset = models.Block.objects.all()
    serializer_class = serializers.BlockSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class BuildingViewSet(viewsets.ModelViewSet):
    queryset = models.Building.objects.all()
    serializer_class = serializers.BuildingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class RoomTypeViewSet(viewsets.ModelViewSet):
    queryset = models.RoomType.objects.all()
    serializer_class = serializers.RoomTypeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class RoomViewSet(viewsets.ModelViewSet):
    queryset = models.Room.objects.all()
    serializer_class = serializers.RoomSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class TimeSlotViewSet(viewsets.ModelViewSet):
    queryset = models.TimeSlot.objects.all()
    serializer_class = serializers.TimeSlotSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CourseViewSet(viewsets.ModelViewSet):
    queryset = models.Course.objects.all()
    serializer_class = serializers.CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CourseOfferingViewSet(viewsets.ModelViewSet):
    queryset = models.CourseOffering.objects.all()
    serializer_class = serializers.CourseOfferingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CurriculumViewSet(viewsets.ModelViewSet):
    queryset = models.Curriculum.objects.all()
    serializer_class = serializers.CurriculumSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class YearLevelViewSet(viewsets.ModelViewSet):
    queryset = models.YearLevel.objects.all()
    serializer_class = serializers.YearLevelSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ProfessorViewSet(viewsets.ModelViewSet):
    queryset = models.Professor.objects.all()
    serializer_class = serializers.ProfessorSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ScheduleEntryViewSet(viewsets.ModelViewSet):
    queryset = models.ScheduleEntry.objects.all()
    serializer_class = serializers.ScheduleEntrySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def generate(self, request):
        """Trigger schedule generation. Returns summary of created entries."""
        summary = scheduler.generate_schedule()
        return Response(summary, status=status.HTTP_200_OK)
