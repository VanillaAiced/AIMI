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
        from datetime import time
        
        # Auto-create TimeSlots if none exist
        timeslot_count = models.TimeSlot.objects.count()
        if timeslot_count == 0:
            # Create default TimeSlots
            time_slots = [
                # LECTURES (1h 30m) - Monday to Friday
                ('MONDAY', '08:00', '09:30', 'LECTURE'),
                ('MONDAY', '09:35', '11:05', 'LECTURE'),
                ('MONDAY', '11:10', '12:40', 'LECTURE'),
                ('MONDAY', '12:45', '14:15', 'LECTURE'),
                ('MONDAY', '14:20', '15:50', 'LECTURE'),
                ('TUESDAY', '08:00', '09:30', 'LECTURE'),
                ('TUESDAY', '09:35', '11:05', 'LECTURE'),
                ('TUESDAY', '11:10', '12:40', 'LECTURE'),
                ('TUESDAY', '12:45', '14:15', 'LECTURE'),
                ('TUESDAY', '14:20', '15:50', 'LECTURE'),
                ('WEDNESDAY', '08:00', '09:30', 'LECTURE'),
                ('WEDNESDAY', '09:35', '11:05', 'LECTURE'),
                ('WEDNESDAY', '11:10', '12:40', 'LECTURE'),
                ('WEDNESDAY', '12:45', '14:15', 'LECTURE'),
                ('WEDNESDAY', '14:20', '15:50', 'LECTURE'),
                ('THURSDAY', '08:00', '09:30', 'LECTURE'),
                ('THURSDAY', '09:35', '11:05', 'LECTURE'),
                ('THURSDAY', '11:10', '12:40', 'LECTURE'),
                ('THURSDAY', '12:45', '14:15', 'LECTURE'),
                ('THURSDAY', '14:20', '15:50', 'LECTURE'),
                ('FRIDAY', '08:00', '09:30', 'LECTURE'),
                ('FRIDAY', '09:35', '11:05', 'LECTURE'),
                ('FRIDAY', '11:10', '12:40', 'LECTURE'),
                ('FRIDAY', '12:45', '14:15', 'LECTURE'),
                ('FRIDAY', '14:20', '15:50', 'LECTURE'),
                # LABS (3 hours) - Monday to Friday
                ('MONDAY', '08:00', '11:00', 'LAB'),
                ('MONDAY', '11:05', '14:05', 'LAB'),
                ('TUESDAY', '08:00', '11:00', 'LAB'),
                ('TUESDAY', '11:05', '14:05', 'LAB'),
                ('WEDNESDAY', '08:00', '11:00', 'LAB'),
                ('WEDNESDAY', '11:05', '14:05', 'LAB'),
                ('THURSDAY', '08:00', '11:00', 'LAB'),
                ('THURSDAY', '11:05', '14:05', 'LAB'),
                ('FRIDAY', '08:00', '11:00', 'LAB'),
                ('FRIDAY', '11:05', '14:05', 'LAB'),
            ]
            for day, start_str, end_str, slot_type in time_slots:
                start_time = time.fromisoformat(start_str)
                end_time = time.fromisoformat(end_str)
                models.TimeSlot.objects.get_or_create(
                    day=day,
                    start_time=start_time,
                    end_time=end_time,
                    type=slot_type
                )
        
        # Check prerequisites
        timeslot_count = models.TimeSlot.objects.count()
        room_count = models.Room.objects.count()
        curriculum_count = models.Curriculum.objects.count()
        course_count = models.Course.objects.count()
        professor_count = models.Professor.objects.count()
        
        # Count curricula with courses and blocks linked
        curricula_with_data = 0
        for curr in models.Curriculum.objects.all():
            if curr.courses.exists() and curr.blocks.exists():
                curricula_with_data += 1
        
        # Build error message if prerequisites missing
        missing = []
        if room_count == 0:
            missing.append('Rooms (create at least one room)')
        if professor_count == 0:
            missing.append('Professors (add at least one professor)')
        if curricula_with_data == 0:
            missing.append('Curricula with courses & blocks linked (attach courses and blocks to curricula)')
        
        if missing:
            return Response({
                'created': 0,
                'details': [],
                'error': 'Cannot generate schedule. Missing prerequisites: ' + ', '.join(missing),
                'status': {
                    'time_slots': timeslot_count,
                    'rooms': room_count,
                    'professors': professor_count,
                    'curricula_with_data': curricula_with_data
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Clear existing schedule entries before generating new ones
        models.ScheduleEntry.objects.all().delete()
        
        summary = scheduler.generate_schedule()
        
        # If no schedule was created, provide helpful feedback
        if summary.get('created', 0) == 0:
            return Response({
                **summary,
                'warning': 'No schedule entries were created. This might mean no valid combinations of courses, blocks, rooms, and time slots could be scheduled. Check room type requirements and professor availability.'
            }, status=status.HTTP_200_OK)
        
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


from rest_framework.views import APIView
from .aimi_assistant import AIScheduleAssistant


class AIMIOptimizeView(APIView):
    """AIMI - AI Schedule Optimization Endpoint"""
    permission_classes = [IsAdminOrReadOnly]
    
    def get(self, request):
        """Get AI optimization suggestions for current schedule"""
        issue = request.query_params.get('issue', '')
        result = AIScheduleAssistant.analyze_schedule_for_optimization(issue or None)
        return Response(result, status=status.HTTP_200_OK if result.get('success') else status.HTTP_400_BAD_REQUEST)
    
    def post(self, request):
        """Post a specific schedule issue for AI analysis"""
        issue = request.data.get('issue', '')
        result = AIScheduleAssistant.analyze_schedule_for_optimization(issue)
        return Response(result, status=status.HTTP_200_OK if result.get('success') else status.HTTP_400_BAD_REQUEST)


class AIMIChatView(APIView):
    """AIMI - Chat Interface for Schedule Discussions"""
    permission_classes = []  # Allow unauthenticated access for now
    
    def post(self, request):
        """Send a message to AIMI"""
        try:
            message = request.data.get('message', '').strip()
            history = request.data.get('history', [])
            
            if not message:
                return Response({
                    'success': False,
                    'error': 'Message cannot be empty'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            result = AIScheduleAssistant.chat_about_schedule(message, history)
            return Response(result, status=status.HTTP_200_OK if result.get('success') else status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in AIMIChatView.post: {type(e).__name__}: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Server error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
