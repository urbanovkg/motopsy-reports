from django.urls import path
from . import views

urlpatterns = [
    path('', views.login, name='login'),
    path('index/', views.index, name='index'),
    path('list/', views.list, name='list'),
    path('list/<int:pk>/', views.report_create, name='report_create'),
    path('list/<int:pk>/pdf', views.pdf_create, name='pdf_create'),
    path('list/<int:pk>/contract', views.contract_create, name='contract_create'),
    path('list/<int:pk>/cash_document', views.cash_document, name='cash_document'),
]
