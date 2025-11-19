from django.urls import path
from .views import UploadAPIView, DatasetListView, DatasetReportView

urlpatterns = [
    path('upload/', UploadAPIView.as_view(), name='upload'),
    path('datasets/', DatasetListView.as_view(), name='datasets-list'),
    path('datasets/<uuid:pk>/report/', DatasetReportView.as_view(), name='dataset-report'),
]
