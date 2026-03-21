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
    pass


class CurriculumViewSet(viewsets.ModelViewSet):
    queryset = models.Curriculum.objects.all()
    serializer_class = serializers.CurriculumSerializer
    permission_classes = [IsAdminOrReadOnly]





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

    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrReadOnly])
    def analyze(self, request):
        """Analyze the current schedule and provide AI-powered recommendations."""
        from django.db.models import Count, Q
        from datetime import datetime, timedelta

        entries = self.get_queryset()
        
        if not entries.exists():
            return Response({
                'efficiency': 0,
                'insights': [
                    {
                        'type': 'info',
                        'category': 'Schedule Status',
                        'message': 'No schedule entries found',
                        'impact': 'Cannot perform analysis',
                        'suggestion': 'Generate a schedule first to receive AI analysis'
                    }
                ]
            })

        insights = []
        efficiency_score = 100

        # 1. Analyze room utilization
        room_usage = entries.values('room').annotate(count=Count('id'))
        total_entries = entries.count()
        
        for room_data in room_usage:
            room_id = room_data['room']
            if room_id:
                usage_rate = (room_data['count'] / max(total_entries, 1)) * 100
                room = models.Room.objects.filter(id=room_id).first()
                if room:
                    room_name = room.name or f"Room {room.id}"
                    if usage_rate > 80:
                        insights.append({
                            'type': 'success',
                            'category': 'Room Utilization',
                            'message': f'{room_name} is well-utilized with {int(usage_rate)}% occupancy rate',
                            'impact': 'Efficient use of resources',
                            'suggestion': 'No changes recommended'
                        })
                    elif usage_rate < 40:
                        efficiency_score -= 5
                        insights.append({
                            'type': 'warning',
                            'category': 'Room Utilization',
                            'message': f'{room_name} is underutilized at {int(usage_rate)}% capacity',
                            'impact': 'Wasted resource potential',
                            'suggestion': 'Consider scheduling additional sessions in this room'
                        })

        # 2. Analyze professor workload
        professor_workload = entries.values('professor').annotate(count=Count('id'))
        
        for prof_data in professor_workload:
            prof_id = prof_data['professor']
            if prof_id:
                prof = models.Professor.objects.filter(id=prof_id).first()
                if prof:
                    workload = prof_data['count']
                    max_units = prof.max_units or 21
                    if workload > max_units * 1.2:
                        efficiency_score -= 10
                        insights.append({
                            'type': 'warning',
                            'category': 'Workload Balance',
                            'message': f'Professor {prof.name} has {workload} classes (exceeds recommended {max_units})',
                            'impact': 'Potential teacher fatigue and burnout',
                            'suggestion': 'Redistribute some classes to other professors'
                        })
                    elif workload < max_units * 0.5:
                        insights.append({
                            'type': 'info',
                            'category': 'Workload Balance',
                            'message': f'Professor {prof.name} has lighter workload ({workload} classes)',
                            'impact': 'Underutilized teaching resource',
                            'suggestion': 'Consider assigning additional classes if available'
                        })

        # 3. Analyze day distribution
        day_entries = entries.values('time_slot__day').annotate(count=Count('id'))
        day_names = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
        
        for day_data in day_entries:
            day = day_data['time_slot__day']
            count = day_data['count']
            avg_per_day = total_entries / len([d for d in day_entries])
            
            if count > avg_per_day * 1.3:
                insights.append({
                    'type': 'info',
                    'category': 'Schedule Distribution',
                    'message': f'{day} has higher class load ({count} classes)',
                    'impact': 'Uneven distribution',
                    'suggestion': 'Consider balancing classes more evenly across weekdays'
                })

        # 4. Course coverage analysis
        courses_scheduled = entries.values('course').distinct().count()
        total_courses = models.Course.objects.count()
        coverage = (courses_scheduled / max(total_courses, 1)) * 100
        
        if coverage < 80:
            efficiency_score -= 15
            insights.append({
                'type': 'warning',
                'category': 'Course Coverage',
                'message': f'Only {int(coverage)}% of courses are scheduled',
                'impact': 'Some courses may not have assigned schedule slots',
                'suggestion': 'Schedule the remaining courses or verify if they need scheduling'
            })
        elif coverage == 100:
            insights.append({
                'type': 'success',
                'category': 'Course Coverage',
                'message': 'All courses are scheduled',
                'impact': 'Complete curriculum coverage',
                'suggestion': 'Excellent schedule coverage'
            })

        # 5. Block assignment analysis
        blocks_scheduled = entries.values('block').distinct().count()
        total_blocks = models.Block.objects.count()
        
        if blocks_scheduled > 0:
            block_coverage = (blocks_scheduled / max(total_blocks, 1)) * 100
            if block_coverage < 100:
                efficiency_score -= 5
                insights.append({
                    'type': 'info',
                    'category': 'Block Coverage',
                    'message': f'{int(block_coverage)}% of blocks have assigned schedules',
                    'impact': 'Some blocks may need schedule updates',
                    'suggestion': 'Verify all blocks have appropriate schedules'
                })

        # Ensure efficiency score doesn't go below 0 or above 100
        efficiency_score = max(0, min(100, efficiency_score))

        return Response({
            'efficiency': int(efficiency_score),
            'insights': insights
        })
