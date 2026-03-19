"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.views.generic import TemplateView
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('base.urls')),
]

# If the frontend has been built, serve its `index.html` at the site root.
# `FRONTEND_BUILD_DIR` is added to TEMPLATES[0]['DIRS'] in settings.py when present,
# so TemplateView will find `index.html` there.
if getattr(settings, 'FRONTEND_BUILD_DIR', None) and settings.FRONTEND_BUILD_DIR.exists():
    urlpatterns = [
        path('', TemplateView.as_view(template_name='index.html')),
    ] + urlpatterns

# Serve static and media files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
