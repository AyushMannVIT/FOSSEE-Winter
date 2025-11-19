from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
import io


SAMPLE_CSV = b"""
Equipment Name,Type,Flowrate,Pressure,Temperature
Pump-1,Pump,120,5.2,110
Compressor-1,Compressor,95,8.4,95
Valve-1,Valve,60,4.1,105
HeatExchanger-1,HeatExchanger,150,6.2,130
Pump-2,Pump,132,5.6,118
Valve-2,Valve,58,4,102
Reactor-1,Reactor,140,7.5,140
Pump-3,Pump,125,5.3,115
Condenser-1,Condenser,160,6.8,125
Compressor-2,Compressor,100,8,98
HeatExchanger-2,HeatExchanger,155,6.3,132
Valve-3,Valve,62,4.2,107
Pump-4,Pump,130,5.9,119
Reactor-2,Reactor,145,7.2,138
Condenser-2,Condenser,165,6.9,128
""".strip()


class UploadTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_upload_and_summary(self):
        url = reverse('upload')
        f = io.BytesIO(SAMPLE_CSV)
        f.name = 'sample_equipment_data.csv'
        response = self.client.post(url, {'file': f}, format='multipart')
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn('id', data)
        self.assertIn('summary', data)
        self.assertEqual(data['row_count'], 15)

    def test_pdf_report_generation(self):
        # Upload first
        upload_url = reverse('upload')
        f = io.BytesIO(SAMPLE_CSV)
        f.name = 'sample_equipment_data.csv'
        upload_resp = self.client.post(upload_url, {'file': f}, format='multipart')
        self.assertEqual(upload_resp.status_code, 201)
        ds_id = upload_resp.json()['id']

        # Request report
        report_url = reverse('dataset-report', kwargs={'pk': ds_id})
        report_resp = self.client.get(report_url)
        self.assertEqual(report_resp.status_code, 200)
        self.assertEqual(report_resp['Content-Type'], 'application/pdf')
        self.assertGreater(len(report_resp.content), 1000)
