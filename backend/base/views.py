from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Subject, Professor, Room, Section
import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponseBadRequest


# Simple health endpoint for frontend integration testing
def ping(request):
	return JsonResponse({'status': 'ok'})


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def data_view(request):
	"""GET: list recent items for each model
	   POST: accept JSON payload with keys subjects, professors, rooms, sections
			 and create/update model instances accordingly
	"""
	if request.method == 'GET':
		# return only items created in this session (if session exists), otherwise return recent global
		session_key = request.session.session_key
		if session_key:
			subjects = list(Subject.objects.filter(owner_session=session_key).order_by('-created_at')[:50].values())
			professors = list(Professor.objects.filter(owner_session=session_key).order_by('-created_at')[:50].values())
			rooms = list(Room.objects.filter(owner_session=session_key).order_by('-created_at')[:50].values())
			sections = list(Section.objects.filter(owner_session=session_key).order_by('-created_at')[:50].values())
		else:
			subjects = list(Subject.objects.order_by('-created_at')[:50].values())
			professors = list(Professor.objects.order_by('-created_at')[:50].values())
			rooms = list(Room.objects.order_by('-created_at')[:50].values())
			sections = list(Section.objects.order_by('-created_at')[:50].values())
		return JsonResponse({'subjects': subjects, 'professors': professors, 'rooms': rooms, 'sections': sections})

	# POST: parse JSON
	try:
		payload = json.loads(request.body.decode('utf-8'))
	except Exception:
		return HttpResponseBadRequest('Invalid JSON')

	# basic validation
	required_keys = {'subjects', 'professors', 'rooms', 'sections'}
	if not required_keys.issubset(set(payload.keys())):
		return HttpResponseBadRequest('Missing required keys')

	created = {'subjects': 0, 'professors': 0, 'rooms': 0, 'sections': 0}

	# ensure session key exists so we can associate records
	session_key = request.session.session_key
	if not session_key:
		request.session.create()
		session_key = request.session.session_key

	# Subjects: use code as unique identifier
	for s in payload.get('subjects', []):
		code = s.get('code')
		if not code:
			continue
		defaults = {
			'name': s.get('name', ''),
			'block': s.get('block', ''),
			'units': int(s.get('units') or 0),
			'hours': int(s.get('hours') or 0),
			'owner_session': session_key,
		}
		obj, created_flag = Subject.objects.update_or_create(code=code, defaults=defaults)
		if created_flag:
			created['subjects'] += 1

	# Professors: unique by name
	for p in payload.get('professors', []):
		name = p.get('name')
		if not name:
			continue
		defaults = {'availability': p.get('availability', ''), 'owner_session': session_key}
		obj, created_flag = Professor.objects.update_or_create(name=name, defaults=defaults)
		if created_flag:
			created['professors'] += 1

	# Rooms: unique by name
	for r in payload.get('rooms', []):
		name = r.get('name')
		if not name:
			continue
		defaults = {
			'capacity': int(r.get('capacity') or 0),
			'room_type': r.get('type') or r.get('room_type') or 'LECTURE',
			'owner_session': session_key,
		}
		obj, created_flag = Room.objects.update_or_create(name=name, defaults=defaults)
		if created_flag:
			created['rooms'] += 1

	# Sections: unique by name+department+year
	for sec in payload.get('sections', []):
		name = sec.get('name')
		department = sec.get('department')
		year = sec.get('yearLevel') or sec.get('year_level')
		if not name or not department or not year:
			continue
		defaults = {'year_level': int(year), 'owner_session': session_key}
		obj, created_flag = Section.objects.update_or_create(name=name, department=department, year_level=int(year), defaults=defaults)
		if created_flag:
			created['sections'] += 1

	return JsonResponse({'status': 'ok', 'created': created})


@csrf_exempt
@require_http_methods(['POST'])
def signup_view(request):
	try:
		payload = json.loads(request.body.decode('utf-8'))
	except Exception:
		return HttpResponseBadRequest('Invalid JSON')

	username = payload.get('username') or payload.get('email')
	email = payload.get('email')
	password = payload.get('password')
	if not username or not password:
		return HttpResponseBadRequest('username and password required')

	if User.objects.filter(username=username).exists():
		return JsonResponse({'status': 'error', 'message': 'username taken'}, status=400)

	user = User.objects.create_user(username=username, email=email, password=password)
	return JsonResponse({'status': 'created', 'username': user.username, 'id': user.id})


@csrf_exempt
@require_http_methods(['POST'])
def login_view(request):
	try:
		payload = json.loads(request.body.decode('utf-8'))
	except Exception:
		return HttpResponseBadRequest('Invalid JSON')

	username = payload.get('username') or payload.get('email')
	password = payload.get('password')
	if not username or not password:
		return HttpResponseBadRequest('username and password required')

	# Try to authenticate first
	user = authenticate(request, username=username, password=password)
	created_flag = False

	# If authentication failed, but the user does not exist, create the user (sign-up-on-login)
	if user is None:
		if not User.objects.filter(username=username).exists():
			# create new user and authenticate
			user = User.objects.create_user(username=username, email=payload.get('email') or '', password=password)
			created_flag = True
			user = authenticate(request, username=username, password=password)
			if user is None:
				return JsonResponse({'status': 'error', 'message': 'could not create user'}, status=500)
		else:
			# user exists but wrong credentials
			return JsonResponse({'status': 'error', 'message': 'invalid credentials'}, status=401)

	login(request, user)
	return JsonResponse({'status': 'ok', 'username': user.username, 'id': user.id, 'created': created_flag})


@csrf_exempt
@require_http_methods(['POST'])
def logout_view(request):
	# Delete only session-owned schedule-related data so admin data is preserved
	session_key = request.session.session_key
	if not session_key:
		# nothing associated with this session
		logout(request)
		return JsonResponse({'status': 'ok', 'deleted': {}})

	subj_qs = Subject.objects.filter(owner_session=session_key)
	prof_qs = Professor.objects.filter(owner_session=session_key)
	room_qs = Room.objects.filter(owner_session=session_key)
	section_qs = Section.objects.filter(owner_session=session_key)

	subj_count = subj_qs.count()
	prof_count = prof_qs.count()
	room_count = room_qs.count()
	section_count = section_qs.count()

	subj_qs.delete()
	prof_qs.delete()
	room_qs.delete()
	section_qs.delete()

	logout(request)
	return JsonResponse({
		'status': 'ok',
		'deleted': {
			'subjects': subj_count,
			'professors': prof_count,
			'rooms': room_count,
			'sections': section_count,
		}
	})


def model_view(request, model):
	"""Return JSON list for a given model name.

	Accessible paths (case-insensitive):
	  /api/subjects/  -> Subject
	  /api/subject/   -> Subject
	  /api/professors/ -> Professor
	  /api/professor/  -> Professor
	  /api/rooms/ -> Room
	  /api/room/  -> Room
	  /api/sections/ -> Section
	  /api/section/  -> Section
	"""
	if request.method != 'GET':
		return JsonResponse({'status': 'error', 'message': 'method not allowed'}, status=405)

	key = (model or '').strip().lower()
	mapping = {
		'subject': Subject,
		'subjects': Subject,
		'professor': Professor,
		'professors': Professor,
		'room': Room,
		'rooms': Room,
		'section': Section,
		'sections': Section,
	}

	Model = mapping.get(key)
	if not Model:
		return JsonResponse({'status': 'error', 'message': f'unknown model: {model}'}, status=400)

	# optional limit query param
	try:
		limit = int(request.GET.get('limit', '0'))
	except Exception:
		limit = 0

	qs = Model.objects.order_by('-created_at')
	if limit and limit > 0:
		qs = qs[:limit]

	data = list(qs.values())
	return JsonResponse({model: data})
