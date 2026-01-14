"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
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
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from back import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', views.login, name='login'),
    path('api/user/profile/<int:user_id>/', views.get_profile, name='get_profile'),
    path('api/user/avatar/<int:user_id>/', views.upload_avatar, name='upload_avatar'),
    path('api/users/', views.get_users, name='get_users'),
    path('api/requests/create/', views.create_request, name='create_request'),
    path('api/requests/<int:user_id>/', views.get_requests, name='get_requests'),
    path('api/requests/archive/', views.get_archive_requests, name='get_archive_requests'),
    path('api/requests/<int:request_id>/update/', views.update_request, name='update_request'),
    path('api/requests/<int:request_id>/status/', views.update_request_status, name='update_request_status'),
    path('api/offices/filters/', views.get_office_filters, name='get_office_filters'),
    path('api/notifications/<int:user_id>/', views.get_notifications, name='get_notifications'),
    path('api/notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
]

# Добавляем URL для медиа файлов в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
