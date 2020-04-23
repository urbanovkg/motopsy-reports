from django.urls import path
from . import views

urlpatterns = [
    path('', views.login, name='login'),
    path('index/', views.index, name='index'),
    path('list/', views.list, name='list'),
    path('list/<int:pk>/', views.report_create, name='report_create'),
]
