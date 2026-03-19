from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from . import models, serializers
from . import scheduler
from .permissions import IsAdminOrReadOnly


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = models.School.objects.all()
    serializer_class = serializers.SchoolSerializer
    permission_classes = [IsAdminOrReadOnly]


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = models.Department.objects.all()
    serializer_class = serializers.DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]


class SubDepartmentViewSet(viewsets.ModelViewSet):
    queryset = models.SubDepartment.objects.all()
    serializer_class = serializers.SubDepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        dept = self.request.query_params.get('department')
        if dept:
            return qs.filter(department__id=dept)
        return qs


class BlockViewSet(viewsets.ModelViewSet):
    queryset = models.Block.objects.all()
    serializer_class = serializers.BlockSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        sub = self.request.query_params.get('sub_department')
        year = self.request.query_params.get('year')
        if sub:
            qs = qs.filter(sub_department__id=sub)
        if year:
            try:
                y = int(year)
                qs = qs.filter(year=y)
            except ValueError:
                pass
        return qs


class BuildingViewSet(viewsets.ModelViewSet):
    queryset = models.Building.objects.all()
    serializer_class = serializers.BuildingSerializer
    permission_classes = [IsAdminOrReadOnly]


class RoomTypeViewSet(viewsets.ModelViewSet):
    queryset = models.RoomType.objects.all()
    serializer_class = serializers.RoomTypeSerializer
    permission_classes = [IsAdminOrReadOnly]


class RoomViewSet(viewsets.ModelViewSet):
    queryset = models.Room.objects.all()
    serializer_class = serializers.RoomSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        b = self.request.query_params.get('building')
        if b:
            return qs.filter(building__id=b)
        return qs


class TimeSlotViewSet(viewsets.ModelViewSet):
    queryset = models.TimeSlot.objects.all()
    serializer_class = serializers.TimeSlotSerializer
    permission_classes = [IsAdminOrReadOnly]


class CourseViewSet(viewsets.ModelViewSet):
    queryset = models.Course.objects.all()
    serializer_class = serializers.CourseSerializer
    permission_classes = [IsAdminOrReadOnly]


class CourseOfferingViewSet(viewsets.ModelViewSet):
    queryset = models.CourseOffering.objects.all()
    serializer_class = serializers.CourseOfferingSerializer
    permission_classes = [IsAdminOrReadOnly]


class CurriculumViewSet(viewsets.ModelViewSet):
    queryset = models.Curriculum.objects.all()
    serializer_class = serializers.CurriculumSerializer
    permission_classes = [IsAdminOrReadOnly]


class YearLevelViewSet(viewsets.ModelViewSet):
    queryset = models.YearLevel.objects.all()
    serializer_class = serializers.YearLevelSerializer
    permission_classes = [IsAdminOrReadOnly]
    def get_queryset(self):
        qs = super().get_queryset()
        sub = self.request.query_params.get('sub_department')
        dept = self.request.query_params.get('department')
        if sub:
            # YearLevels that are explicitly linked to blocks under this sub-department
            qs = qs.filter(blocks__sub_department__id=sub).distinct()
            # also include YearLevels that match by numeric year in their name where matching blocks exist
            try:
                sub_id = int(sub)
                from django.db.models import Q
                # find numeric years present in blocks for this sub-department
                years = models.Block.objects.filter(sub_department__id=sub_id).values_list('year', flat=True).distinct()
                q = Q()
                for y in years:
                    q |= Q(name__iregex=rf"\b{y}\b")
                if q:
                    qs = qs.union(models.YearLevel.objects.filter(q))
            except Exception:
                pass
        if dept:
            qs = qs.filter(curriculum__sub_department__department__id=dept)
        return qs


class ProfessorViewSet(viewsets.ModelViewSet):
    queryset = models.Professor.objects.all()
    serializer_class = serializers.ProfessorSerializer
    permission_classes = [IsAdminOrReadOnly]


class StudentViewSet(viewsets.ModelViewSet):
    queryset = models.Student.objects.all()
    serializer_class = serializers.StudentSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        dept = self.request.query_params.get('department')
        sub = self.request.query_params.get('sub_department')
        year = self.request.query_params.get('year')
        if dept:
            qs = qs.filter(department__id=dept)
        if sub:
            qs = qs.filter(sub_department__id=sub)
        if year:
            try:
                qs = qs.filter(year=int(year))
            except Exception:
                pass
        return qs


class ScheduleEntryViewSet(viewsets.ModelViewSet):
    queryset = models.ScheduleEntry.objects.all()
    serializer_class = serializers.ScheduleEntrySerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrReadOnly])
    def generate(self, request):
        """Trigger schedule generation. Returns summary of created entries."""
        # Only admins should be able to trigger generation
        # scheduler.generate_schedule may be expensive and will create ScheduleEntry rows
        summary = scheduler.generate_schedule()
        return Response(summary, status=status.HTTP_200_OK)
