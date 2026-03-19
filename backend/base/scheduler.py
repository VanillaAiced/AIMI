"""Basic greedy scheduler for CourseOfferings.

This is a simple heuristic: for each CourseOffering, try to assign time slots
and rooms that satisfy room type and avoid conflicts for professor, room, and block.
It will create ScheduleEntry rows for assigned sessions.
"""
from collections import defaultdict
from . import models


def generate_schedule():
    created = 0
    details = []

    # grab available resources
    timeslots = list(models.TimeSlot.objects.all())
    rooms = list(models.Room.objects.filter())
    offerings = list(models.CourseOffering.objects.select_related('course', 'assigned_block', 'assigned_professor').all())

    # quick indexes to check conflicts
    occupied_room_times = set((e.room_id, e.time_slot_id) for e in models.ScheduleEntry.objects.all())
    occupied_prof_times = set((e.professor_id, e.time_slot_id) for e in models.ScheduleEntry.objects.all())
    occupied_block_times = set((e.block_id, e.time_slot_id) for e in models.ScheduleEntry.objects.all())

    # naive ordering
    for off in offerings:
        needed = max(1, off.course.frequency_per_week)
        assigned_sessions = 0

        for ts in timeslots:
            if assigned_sessions >= needed:
                break

            # find candidate rooms matching requirement
            candidates = []
            for r in rooms:
                # match room type if course has requirement
                if off.course.room_requirement and r.room_type_id != off.course.room_requirement_id:
                    continue
                # check room/time free
                if (r.id, ts.id) in occupied_room_times:
                    continue
                candidates.append(r)

            if not candidates:
                continue

            # check professor availability: if assigned, prefer assigned; otherwise pick any professor not occupied
            prof = off.assigned_professor
            if prof:
                if (prof.id, ts.id) in occupied_prof_times:
                    continue
            else:
                # pick any professor from same sub_department if requirement exists, else any available
                profs = list(models.Professor.objects.all())
                prof = None
                for p in profs:
                    if (p.id, ts.id) in occupied_prof_times:
                        continue
                    prof = p
                    break
                if prof is None:
                    continue

            # check block conflict
            if (off.assigned_block_id, ts.id) in occupied_block_times:
                continue

            # assign first candidate room
            room = candidates[0]

            # create ScheduleEntry
            se = models.ScheduleEntry.objects.create(
                course_offering=off,
                course=off.course,
                block=off.assigned_block,
                professor=prof,
                room=room,
                time_slot=ts,
            )

            occupied_room_times.add((room.id, ts.id))
            occupied_prof_times.add((prof.id if prof else None, ts.id))
            occupied_block_times.add((off.assigned_block_id, ts.id))

            assigned_sessions += 1
            created += 1
            details.append({'offering': off.id, 'timeslot': ts.id, 'room': room.id, 'professor': prof.id if prof else None})

    return {'created': created, 'details': details}
