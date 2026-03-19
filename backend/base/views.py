from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest
from .models import Course, Professor, Room, Block, Department, SubDepartment, RoomType
import json
from django.contrib.auth import authenticate, logout
from django.contrib.auth.models import User

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_GET


# Simple health endpoint for frontend integration testing
def ping(request):
	return JsonResponse({'status': 'ok'})


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def data_view(request):
	"""GET: list recent items for each model
	   POST: accept JSON payload with keys subjects, professors, rooms, sections
			 and create/update model instances accordingly
	"""
	if request.method == 'GET':
		# return only items created by this user
		username = request.user.username
		subjects = list(Course.objects.filter(owner_session=username).order_by('-created_at')[:50].values())
		professors = list(Professor.objects.filter(owner_session=username).order_by('-created_at')[:50].values())
		rooms = list(Room.objects.filter(owner_session=username).order_by('-created_at')[:50].values())
		sections = list(Block.objects.filter(owner_session=username).order_by('-created_at')[:50].values())
		return JsonResponse({'subjects': subjects, 'professors': professors, 'rooms': rooms, 'sections': sections})

	# POST: parse JSON
	try:
		payload = request.data if hasattr(request, 'data') else json.loads(request.body.decode('utf-8'))
	except Exception:
		return HttpResponseBadRequest('Invalid JSON')

	# basic validation
	required_keys = {'subjects', 'professors', 'rooms', 'sections'}
	if not required_keys.issubset(set(payload.keys())):
		return HttpResponseBadRequest('Missing required keys')

	created = {'subjects': 0, 'professors': 0, 'rooms': 0, 'sections': 0}

	# identify owner by username (JWT-authenticated user)
	owner = request.user.username

	# Subjects -> Course: use code as unique identifier
	for s in payload.get('subjects', []):
		code = s.get('code')
		if not code:
			continue
		hours = int(s.get('hours') or 0)
		defaults = {
			'name': s.get('name', ''),
			'units': int(s.get('units') or 0),
			'duration_minutes': hours * 60,
			'owner_session': owner,
		}
		obj, created_flag = Course.objects.update_or_create(code=code, defaults=defaults)
		if created_flag:
			created['subjects'] += 1

	# Professors: unique by name
	for p in payload.get('professors', []):
		name = p.get('name')
		if not name:
			continue
		defaults = {
			'availability': p.get('availability', ''),
			'owner_session': owner,
		}
		obj, created_flag = Professor.objects.update_or_create(name=name, defaults=defaults)
		if created_flag:
			created['professors'] += 1

	# Rooms: unique by name (legacy) — map room.type to RoomType
	for r in payload.get('rooms', []):
		name = r.get('name')
		if not name:
			continue
		cap = int(r.get('capacity') or 0)
		type_key = (r.get('type') or r.get('room_type') or '').upper()
		room_type_obj = None
		if type_key:
			room_type_obj, _ = RoomType.objects.get_or_create(name=type_key)

		defaults = {
			'capacity': cap,
			'room_type': room_type_obj,
			'owner_session': owner,
			'name': name,
		}
		obj, created_flag = Room.objects.update_or_create(name=name, defaults=defaults)
		if created_flag:
			created['rooms'] += 1

	# Sections -> Block: create Department/SubDepartment/Block as needed
	for sec in payload.get('sections', []):
		name = sec.get('name')
		department_name = sec.get('department')
		year = sec.get('yearLevel') or sec.get('year_level')
		if not name or not department_name or not year:
			continue

		# find or create Department (school optional)
		dept_obj, _ = Department.objects.get_or_create(name=department_name)
		subdept_obj, _ = SubDepartment.objects.get_or_create(name=department_name, department=dept_obj)

		defaults = {'year': int(year), 'owner_session': owner}
		obj, created_flag = Block.objects.update_or_create(code=name, sub_department=subdept_obj, defaults=defaults)
		if created_flag:
			created['sections'] += 1

	return JsonResponse({'status': 'ok', 'created': created})


@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
	try:
		payload = request.data if hasattr(request, 'data') else json.loads(request.body.decode('utf-8'))
	except Exception:
		return Response({'detail': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

	username = payload.get('username') or payload.get('email')
	email = payload.get('email')
	password = payload.get('password')
	if not username or not password:
		return Response({'detail': 'username and password required'}, status=status.HTTP_400_BAD_REQUEST)

	if User.objects.filter(username=username).exists():
		return Response({'status': 'error', 'message': 'username taken'}, status=status.HTTP_400_BAD_REQUEST)

	user = User.objects.create_user(username=username, email=email, password=password)
	# set provided full name if given
	try:
		name = payload.get('name')
		if name:
			user.first_name = name
			user.save()
	except Exception:
		pass
	# optionally set role on Profile if provided
	role = payload.get('role')
	# Only allow non-admin role assignment from self-service signup
	try:
		profile = getattr(user, 'profile', None)
		if profile and role in ('professor', 'student'):
			profile.role = role
			# persist optional academic fields if provided in signup
			dept = payload.get('department')
			sub = payload.get('sub_department')
			yr = payload.get('year')
			blk = payload.get('block')
			try:
				from .models import Department, SubDepartment, Block
				if dept:
					if isinstance(dept, int) or (isinstance(dept, str) and dept.isdigit()):
						profile.department = Department.objects.filter(id=int(dept)).first()
					else:
						profile.department = Department.objects.filter(name=dept).first()
				if sub:
					if isinstance(sub, int) or (isinstance(sub, str) and sub.isdigit()):
						profile.sub_department = SubDepartment.objects.filter(id=int(sub)).first()
					else:
						profile.sub_department = SubDepartment.objects.filter(name=sub).first()
				if yr:
					try:
						profile.year = int(yr)
					except Exception:
						pass
				if blk:
					if isinstance(blk, int) or (isinstance(blk, str) and blk.isdigit()):
						profile.block = Block.objects.filter(id=int(blk)).first()
					else:
						profile.block = Block.objects.filter(code=blk).first()
			except Exception:
				# ignore lookup errors
				pass
			profile.save()
			
			# Ensure a Professor row exists for professor signups (mirror Student creation logic)
			if role == 'professor':
				try:
					from .models import Professor
					prof_defaults = {
						'availability': '',
						'department': profile.department,
						'sub_department': profile.sub_department,
						'email': user.email,
						'owner_session': user.username,
					}
					prof_name = user.first_name or user.username
					if user.email:
						prof, _ = Professor.objects.update_or_create(email=user.email, defaults={**prof_defaults, 'name': prof_name})
					else:
						prof, _ = Professor.objects.update_or_create(name=prof_name, defaults=prof_defaults)
					# link to the created User for admin convenience
					prof.user = user
					prof.save()
				except Exception:
					# don't block signup if professor creation fails
					pass
	except Exception:
		# don't block signup if profile handling fails
		pass

	# create JWT tokens
	refresh = RefreshToken.for_user(user)
	# If signup included academic info and role=student, create Student record
	try:
		if getattr(user, 'profile', None) and getattr(user.profile, 'role', None) == 'student':
			from .models import Student, Department, SubDepartment, Block
			dept = payload.get('department')
			sub = payload.get('sub_department')
			yr = payload.get('year')
			blk = payload.get('block')
			student_kwargs = {'user': user}
			if dept:
				if isinstance(dept, int) or (isinstance(dept, str) and dept.isdigit()):
					student_kwargs['department'] = Department.objects.filter(id=int(dept)).first()
				else:
					student_kwargs['department'] = Department.objects.filter(name=dept).first()
			if sub:
				if isinstance(sub, int) or (isinstance(sub, str) and sub.isdigit()):
					student_kwargs['sub_department'] = SubDepartment.objects.filter(id=int(sub)).first()
				else:
					student_kwargs['sub_department'] = SubDepartment.objects.filter(name=sub).first()
			if yr:
				try:
					student_kwargs['year'] = int(yr)
				except Exception:
					pass
			if blk:
				if isinstance(blk, int) or (isinstance(blk, str) and blk.isdigit()):
					student_kwargs['block'] = Block.objects.filter(id=int(blk)).first()
				else:
					student_kwargs['block'] = Block.objects.filter(code=blk).first()
			# create or update
			Student.objects.update_or_create(user=user, defaults=student_kwargs)
	except Exception:
		pass
	return Response({'status': 'created', 'username': user.username, 'id': user.id, 'access': str(refresh.access_token), 'refresh': str(refresh), 'role': getattr(user.profile, 'role', 'student')})


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
	try:
		payload = request.data if hasattr(request, 'data') else json.loads(request.body.decode('utf-8'))
	except Exception:
		return Response({'detail': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

	username = payload.get('username') or payload.get('email')
	password = payload.get('password')
	if not username or not password:
		return Response({'detail': 'username and password required'}, status=status.HTTP_400_BAD_REQUEST)

	# Try to authenticate; do NOT auto-create accounts here — require explicit signup
	user = authenticate(request, username=username, password=password)
	if user is None:
		return Response({'status': 'error', 'message': 'invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

	# return JWT tokens and role
	refresh = RefreshToken.for_user(user)
	role = getattr(getattr(user, 'profile', None), 'role', 'student')
	return Response({'status': 'ok', 'username': user.username, 'id': user.id, 'created': False, 'access': str(refresh.access_token), 'refresh': str(refresh), 'role': role})


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def logout_view(request):
	# For JWT we don't manage server-side session logout here; client should discard tokens.
	# Previously this endpoint deleted objects created during testing. That behavior
	# is disabled for production: do not delete any user data on logout.
	return Response({'status': 'ok', 'message': 'logout acknowledged; no server-side data deleted'})





@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def me_view(request):
	"""Return current authenticated user info including authoritative role."""
	user = request.user
	role = getattr(getattr(user, 'profile', None), 'role', None)
	return Response({'username': user.username, 'id': user.id, 'role': role})


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
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
		'subject': Course,
		'subjects': Course,
		'professor': Professor,
		'professors': Professor,
		'room': Room,
		'rooms': Room,
		'section': Block,
		'sections': Block,
	}

	Model = mapping.get(key)
	if not Model:
		return JsonResponse({'status': 'error', 'message': f'unknown model: {model}'}, status=400)

	# optional limit query param
	try:
		limit = int(request.GET.get('limit', '0'))
	except Exception:
		limit = 0

	# restrict to items owned by this user
	owner = request.user.username
	qs = Model.objects.filter(owner_session=owner).order_by('-created_at')
	if limit and limit > 0:
		qs = qs[:limit]

	data = list(qs.values())
	return JsonResponse({model: data})


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_users_view(request):
	"""Return list of users and their profile roles for admin dashboard.

	Only accessible to admin users (is_staff or profile.role == 'admin').
	"""
	user = request.user
	role = getattr(getattr(user, 'profile', None), 'role', None)
	if not (getattr(user, 'is_staff', False) or role == 'admin'):
		return Response({'detail': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

	User = get_user_model()
	users = []
	for u in User.objects.order_by('username').all():
		prof = getattr(u, 'profile', None)
		dept_name = None
		sub_name = None
		year = None
		block_code = None
		try:
			if prof:
				if prof.department: dept_name = prof.department.name
				if prof.sub_department: sub_name = prof.sub_department.name
				year = prof.year
				if prof.block: block_code = prof.block.code
		except Exception:
			pass
		users.append({
			'id': u.id,
			'username': u.username,
			'email': u.email,
			'is_superuser': u.is_superuser,
			'is_staff': u.is_staff,
			'role': getattr(getattr(u, 'profile', None), 'role', None),
			'department_name': dept_name,
			'sub_department_name': sub_name,
			'year': year,
			'block_code': block_code,
		})
	return Response({'users': users}, status=status.HTTP_200_OK)
