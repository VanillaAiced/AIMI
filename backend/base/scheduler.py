"""Basic greedy scheduler for CourseOfferings.

This is a simple heuristic: for each CourseOffering, try to assign time slots
and rooms that satisfy room type and avoid conflicts for professor, room, and block.
It will create ScheduleEntry rows for assigned sessions.
"""
from collections import defaultdict
from datetime import datetime, timedelta
from . import models


def _timeslot_minutes(ts):
    return ts.start_time.hour * 60 + ts.start_time.minute


def _timeslot_duration_minutes(ts):
    start = datetime.combine(datetime.min, ts.start_time)
    end = datetime.combine(datetime.min, ts.end_time)
    if end < start:
        end += timedelta(days=1)
    return int((end - start).total_seconds() / 60)


def generate_schedule():
    """Generate schedule enforcing hard constraints and using simple heuristics.

    Hard constraints enforced:
    - No overlapping for same room/professor/block
    - Room must match course.room_requirement (if set)
    - Professor must match course.professor_requirement (if set)
    - Respect course.frequency_per_week and course.duration_minutes (timeslot must be long enough)

    Optional heuristics applied when choosing among valid options:
    - Prefer higher-unit courses first (scheduled earlier)
    - Avoid very early / very late timeslots
    - Prefer timeslots that reduce long gaps for the block
    - Prefer spreading sessions across different days for the same offering
    """
    created = 0
    details = []

    # resources
    timeslots = sorted(list(models.TimeSlot.objects.all()), key=lambda t: (t.day, t.start_time))
    rooms = list(models.Room.objects.filter())
    # Build offerings from Curriculum relations: for each Curriculum, pair its courses with its blocks
    offerings = []
    class _Off:
        def __init__(self, course, assigned_block, assigned_professor=None):
            self.course = course
            self.assigned_block = assigned_block
            self.assigned_professor = assigned_professor

    for curriculum in models.Curriculum.objects.prefetch_related('courses', 'blocks').all():
        for course in curriculum.courses.all():
            for block in curriculum.blocks.all():
                offerings.append(_Off(course=course, assigned_block=block, assigned_professor=None))

    # schedule larger/major subjects first
    offerings.sort(key=lambda o: getattr(o.course, 'units', 0), reverse=True)

    # existing occupied indexes
    existing_entries = list(models.ScheduleEntry.objects.all())
    occupied_room_times = set((e.room_id, e.time_slot_id) for e in existing_entries)
    occupied_prof_times = set((e.professor_id, e.time_slot_id) for e in existing_entries)
    occupied_block_times = set((e.block_id, e.time_slot_id) for e in existing_entries)

    # helper maps for gap calculations
    block_assigned_minutes = defaultdict(list)
    prof_assigned_minutes = defaultdict(list)
    offering_assigned_days = defaultdict(set)
    for e in existing_entries:
        try:
            ts = models.TimeSlot.objects.get(pk=e.time_slot_id)
            m = _timeslot_minutes(ts)
            block_assigned_minutes[e.block_id].append(m)
            if e.professor_id:
                prof_assigned_minutes[e.professor_id].append(m)
            # key by (course_id, block_id) since CourseOffering was removed
            offering_assigned_days[(e.course_id, e.block_id)].add(ts.day)
        except Exception:
            pass

    for off in offerings:
        needed = max(1, off.course.frequency_per_week)
        assigned_sessions = 0

        # track days used for this offering in this run (keyed by course+block)
        used_days = set(offering_assigned_days.get((off.course.id, off.assigned_block.id), set()))

        for ts in timeslots:
            if assigned_sessions >= needed:
                break

            # duration constraint (hard)
            ts_dur = _timeslot_duration_minutes(ts)
            if getattr(off.course, 'duration_minutes', 0) and ts_dur < off.course.duration_minutes:
                continue

            # block conflict (hard)
            if (off.assigned_block.id, ts.id) in occupied_block_times:
                continue

            best_choice = None
            best_score = None

            # iterate candidate rooms
            for r in rooms:
                # room type requirement (hard)
                if off.course.room_requirement and r.room_type_id != off.course.room_requirement_id:
                    continue
                # room/time occupied (hard)
                if (r.id, ts.id) in occupied_room_times:
                    continue

                # choose professor
                prof = off.assigned_professor
                if prof:
                    # assigned professor must be available and match requirement
                    if (prof.id, ts.id) in occupied_prof_times:
                        continue
                    if off.course.professor_requirement and prof.sub_department_id != off.course.professor_requirement_id:
                        continue
                    candidate_profs = [prof]
                else:
                    # pick any available professor that satisfies requirement (if set)
                    candidate_profs = []
                    for p in models.Professor.objects.all():
                        if (p.id, ts.id) in occupied_prof_times:
                            continue
                        if off.course.professor_requirement and p.sub_department_id != off.course.professor_requirement_id and not off.course.allow_any_professor:
                            continue
                        candidate_profs.append(p)
                    if not candidate_profs:
                        continue

                # evaluate each professor candidate and pick best (score lower is better)
                for p in candidate_profs:
                    # compute score
                    score = 0.0
                    # avoid very early / very late classes
                    h = ts.start_time.hour
                    if h < 8:
                        score += 10.0
                    if h >= 19:
                        score += 10.0

                    # gap penalty for block: prefer small gaps (avoid long gaps)
                    block_minutes = block_assigned_minutes.get(off.assigned_block.id, [])
                    if block_minutes:
                        gap = min(abs(_timeslot_minutes(ts) - m) for m in block_minutes)
                        score += gap / 60.0

                    # gap penalty for professor availability consistency
                    prof_minutes = prof_assigned_minutes.get(p.id, [])
                    if prof_minutes:
                        pgap = min(abs(_timeslot_minutes(ts) - m) for m in prof_minutes)
                        score += pgap / 120.0

                    # prefer spreading sessions across days for this offering
                    if ts.day not in used_days and assigned_sessions > 0:
                        score -= 5.0

                    # choose best
                    if best_score is None or score < best_score:
                        best_score = score
                        best_choice = (r, p)

            if not best_choice:
                continue

            room, prof = best_choice

            # final hard checks before creating
            if (room.id, ts.id) in occupied_room_times:
                continue
            if (prof.id if prof else None, ts.id) in occupied_prof_times:
                continue
            if (off.assigned_block.id, ts.id) in occupied_block_times:
                continue

            # create ScheduleEntry
            se = models.ScheduleEntry.objects.create(
                course=off.course,
                block=off.assigned_block,
                professor=prof,
                room=room,
                time_slot=ts,
            )

            # update occupied sets and helper maps
            occupied_room_times.add((room.id, ts.id))
            occupied_prof_times.add((prof.id if prof else None, ts.id))
            occupied_block_times.add((off.assigned_block.id, ts.id))
            m = _timeslot_minutes(ts)
            block_assigned_minutes[off.assigned_block.id].append(m)
            if prof:
                prof_assigned_minutes[prof.id].append(m)
            used_days.add(ts.day)

            assigned_sessions += 1
            created += 1
            details.append({'course': off.course.id, 'block': off.assigned_block.id, 'timeslot': ts.id, 'room': room.id, 'professor': prof.id if prof else None})

    return {'created': created, 'details': details}
