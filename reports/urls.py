from django.urls import path
from django.contrib.auth import views as auth_views   # ← добавь
from . import views

urlpatterns = [
    # было: path('', views.login, name='login'),
    path('login/',  auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'),        name='logout'),
    path('index/', views.index, name='index'),

    path('list/', views.reports_list, name='reports_list'),
    path('list/<int:pk>/', views.report_create, name='report_create'),
    path('list/<int:pk>/contract', views.contract_create, name='contract_create'),
    path('list/<int:pk>/cash_document', views.cash_document, name='cash_document'),

    path('api/reports/<int:pk>/', views.report_json, name='report_json'),
    path('edit/<int:pk>/', views.edit, name='edit'),

    path('photos/<int:report_id>/', views.photos_json, name='photos_json'),
    path('photos/upload/<int:report_id>/', views.photos_upload, name='photos_upload'),
    # (опционально) сделать корень сайта формой логина:
    path('', auth_views.LoginView.as_view(template_name='login.html')),
]


from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)