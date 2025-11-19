import io
from django.conf import settings
from django.core.files.base import ContentFile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from .models import Dataset
from .serializers import DatasetSerializer
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from django.http import HttpResponse


REQUIRED_COLUMNS = ['Equipment Name', 'Type', 'Flowrate', 'Pressure', 'Temperature']
NUMERIC_COLUMNS = ['Flowrate', 'Pressure', 'Temperature']


def _normalize_columns(df):
    # Map case-insensitive columns to expected names if possible
    col_map = {}
    lower_to_col = {c.lower(): c for c in df.columns}
    for rc in REQUIRED_COLUMNS:
        if rc in df.columns:
            col_map[rc] = rc
        elif rc.lower() in lower_to_col:
            col_map[lower_to_col[rc.lower()]] = rc
    if col_map:
        df = df.rename(columns=col_map)
    return df


class UploadAPIView(APIView):
    """Accept CSV upload, parse with pandas, compute summary, save Dataset."""

    def post(self, request, format=None):
        if 'file' not in request.FILES:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        upload = request.FILES['file']
        # optional size cap (10MB)
        if upload.size > 10 * 1024 * 1024:
            return Response({'detail': 'File too large (max 10MB).'}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

        try:
            # read CSV into pandas
            df = pd.read_csv(upload)
        except Exception as e:
            return Response({'detail': f'Failed to read CSV: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        df = _normalize_columns(df)

        missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
        if missing:
            return Response({'detail': f'Missing required columns: {missing}'}, status=status.HTTP_400_BAD_REQUEST)

        # Coerce numeric columns
        numeric_cols = ['Flowrate', 'Pressure', 'Temperature']
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        # Check NaN ratio
        for col in numeric_cols:
            nan_ratio = df[col].isna().mean()
            if nan_ratio > 0.2:
                return Response({'detail': f'Column {col} has >20% non-numeric values.'}, status=status.HTTP_400_BAD_REQUEST)

        # Compute summary
        summary = {}
        summary['count'] = int(len(df))
        summary['averages'] = {c: float(df[c].mean()) for c in numeric_cols}
        summary['min'] = {c: float(df[c].min()) for c in numeric_cols}
        summary['max'] = {c: float(df[c].max()) for c in numeric_cols}
        summary['type_distribution'] = df['Type'].fillna('Unknown').value_counts().to_dict()

        # Save dataset record
        ds = Dataset(filename=upload.name, row_count=len(df), summary=summary)
        # Need to save file content - write CSV from dataframe to bytes then save
        csv_bytes = df.to_csv(index=False).encode('utf-8')
        ds.csv_file.save(upload.name, ContentFile(csv_bytes))
        ds.save()

        # enforce retention of last 5
        all_ds = Dataset.objects.order_by('-uploaded_at')
        if all_ds.count() > 5:
            for old in all_ds[5:]:
                try:
                    old.csv_file.delete(save=False)
                except Exception:
                    pass
                old.delete()

        serializer = DatasetSerializer(ds)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DatasetListView(generics.ListAPIView):
    queryset = Dataset.objects.all().order_by('-uploaded_at')[:5]
    serializer_class = DatasetSerializer


class DatasetReportView(APIView):
    """Generate a PDF report for a dataset: summary + charts."""

    def get(self, request, pk, format=None):
        try:
            ds = Dataset.objects.get(pk=pk)
        except Dataset.DoesNotExist:
            return Response({'detail': 'Dataset not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            df = pd.read_csv(ds.csv_file.path)
        except Exception as e:
            return Response({'detail': f'Failed to read dataset CSV: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Ensure expected columns naming for plotting
        df = _normalize_columns(df)
        # Coerce numeric
        for col in NUMERIC_COLUMNS:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Build PDF in-memory
        buf = io.BytesIO()
        with PdfPages(buf) as pdf:
            # Page 1: textual summary
            fig1, ax1 = plt.subplots(figsize=(8.27, 11.69))  # A4 portrait inches
            ax1.axis('off')

            summary = ds.summary or {}
            lines = [
                f"Report: {ds.filename}",
                f"Uploaded: {ds.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')}",
                f"Rows: {summary.get('count', len(df))}",
                "",
                "Averages:",
            ]
            for col in NUMERIC_COLUMNS:
                val = summary.get('averages', {}).get(col)
                if val is not None:
                    lines.append(f"  {col}: {val:.3f}")
            lines.append("")
            lines.append("Min:")
            for col in NUMERIC_COLUMNS:
                val = summary.get('min', {}).get(col)
                if val is not None:
                    lines.append(f"  {col}: {val}")
            lines.append("")
            lines.append("Max:")
            for col in NUMERIC_COLUMNS:
                val = summary.get('max', {}).get(col)
                if val is not None:
                    lines.append(f"  {col}: {val}")

            text = "\n".join(lines)
            ax1.text(0.05, 0.95, text, va='top', ha='left', fontsize=12, family='monospace')
            pdf.savefig(fig1)
            plt.close(fig1)

            # Page 2: Type distribution bar chart
            type_counts = summary.get('type_distribution')
            if not type_counts and 'Type' in df.columns:
                type_counts = df['Type'].fillna('Unknown').value_counts().to_dict()
            if type_counts:
                labels = list(type_counts.keys())
                values = list(type_counts.values())
                fig2, ax2 = plt.subplots(figsize=(11.69, 8.27))  # A4 landscape
                ax2.bar(labels, values, color='#4e79a7')
                ax2.set_title('Equipment Type Distribution')
                ax2.set_xlabel('Type')
                ax2.set_ylabel('Count')
                ax2.grid(axis='y', alpha=0.3)
                plt.setp(ax2.get_xticklabels(), rotation=30, ha='right')
                pdf.savefig(fig2)
                plt.close(fig2)

            # Page 3: Histograms for numeric columns (if available)
            available_numeric = [c for c in NUMERIC_COLUMNS if c in df.columns]
            if available_numeric:
                fig3, axes = plt.subplots(1, len(available_numeric), figsize=(11.69, 4))
                if len(available_numeric) == 1:
                    axes = [axes]
                for ax, col in zip(axes, available_numeric):
                    series = df[col].dropna()
                    if len(series) > 0:
                        ax.hist(series, bins=10, color='#59a14f', edgecolor='white')
                        ax.set_title(f'{col} Distribution')
                        ax.set_xlabel(col)
                        ax.set_ylabel('Frequency')
                        ax.grid(axis='y', alpha=0.3)
                    else:
                        ax.text(0.5, 0.5, f'No data for {col}', ha='center', va='center')
                        ax.axis('off')
                fig3.tight_layout()
                pdf.savefig(fig3)
                plt.close(fig3)

        pdf_bytes = buf.getvalue()
        buf.close()
        resp = HttpResponse(pdf_bytes, content_type='application/pdf')
        resp['Content-Disposition'] = f'inline; filename="report_{ds.id}.pdf"'
        return resp
