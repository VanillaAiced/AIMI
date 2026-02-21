from django.urls import path
from . import views


urlpatterns = [
	path('ping/', views.ping, name='ping'),
	path('data/', views.data_view, name='data'),
	path('auth/signup/', views.signup_view, name='signup'),
	path('auth/login/', views.login_view, name='login'),
	path('auth/logout/', views.logout_view, name='logout'),
	path('auth/clear-data/', views.clear_data_view, name='clear_data'),
	# Generic model listing endpoints, e.g. /api/subjects/ or /api/room/
	path('<str:model>/', views.model_view, name='model'),
]
