from django.contrib import admin
from .models import Dataset


@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ('filename', 'uploaded_at', 'row_count')
    readonly_fields = ('uploaded_at',)
