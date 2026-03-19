from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from . import api

router = DefaultRouter()
router.register('schools', api.SchoolViewSet)
router.register('departments', api.DepartmentViewSet)
router.register('subdepartments', api.SubDepartmentViewSet)
router.register('blocks', api.BlockViewSet)
router.register('buildings', api.BuildingViewSet)
router.register('room-types', api.RoomTypeViewSet)
router.register('rooms', api.RoomViewSet)
router.register('timeslots', api.TimeSlotViewSet)
router.register('courses', api.CourseViewSet)
router.register('course-offerings', api.CourseOfferingViewSet)
router.register('curricula', api.CurriculumViewSet)
router.register('year-levels', api.YearLevelViewSet)
router.register('professors', api.ProfessorViewSet)
router.register('students', api.StudentViewSet)
router.register('schedule-entries', api.ScheduleEntryViewSet)

urlpatterns = [
	path('ping/', views.ping, name='ping'),
	path('data/', views.data_view, name='data'),
	path('auth/signup/', views.signup_view, name='signup'),
	path('auth/login/', views.login_view, name='login'),
	path('auth/me/', views.me_view, name='me'),
	path('auth/logout/', views.logout_view, name='logout'),
	path('admin/users/', views.admin_users_view, name='admin_users'),
	path('auth/clear-data/', views.clear_data_view, name='clear_data'),
	# Router-provided API for CRUD on new models
	path('', include(router.urls)),
	# Generic model listing endpoints, e.g. /api/subjects/ or /api/room/
	path('<str:model>/', views.model_view, name='model'),
]
