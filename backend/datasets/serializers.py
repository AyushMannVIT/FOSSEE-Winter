from rest_framework import serializers
from .models import Dataset


class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ['id', 'filename', 'uploaded_at', 'row_count', 'summary', 'csv_file']
