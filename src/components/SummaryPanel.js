import React, { useState } from 'react';
import api from '../api';

export default function SummaryPanel({ summary, dataset }) {
  const [downloading, setDownloading] = useState(false);
  // Accept either `summary` (legacy) or `dataset` (preferred)
  const s = dataset?.summary || summary;
  if (!s) return null;
  const { count, averages = {}, min = {}, max = {}, type_distribution = {} } = s;

  const handleDownload = async () => {
    if (!dataset?.id) return;
    setDownloading(true);
    try {
      const resp = await api.get(`/datasets/${dataset.id}/report/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${dataset.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Report download failed', err);
      alert('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };
  return (
    <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Summary</h3>
      <div>Total rows: {count}</div>
      <div style={{ marginTop: 8 }}>
        <strong>Averages</strong>
        <div>Flowrate: {fmt(averages.Flowrate)}</div>
        <div>Pressure: {fmt(averages.Pressure)}</div>
        <div>Temperature: {fmt(averages.Temperature)}</div>
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Min</strong>
        <div>Flowrate: {fmt(min.Flowrate)}</div>
        <div>Pressure: {fmt(min.Pressure)}</div>
        <div>Temperature: {fmt(min.Temperature)}</div>
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Max</strong>
        <div>Flowrate: {fmt(max.Flowrate)}</div>
        <div>Pressure: {fmt(max.Pressure)}</div>
        <div>Temperature: {fmt(max.Temperature)}</div>
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Type Distribution</strong>
        <div style={{ fontSize: 12, color: '#555' }}>
          {Object.entries(type_distribution).map(([k, v]) => (
            <span key={k} style={{ marginRight: 10 }}>{k}: {v}</span>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={handleDownload} disabled={downloading || !dataset?.id}>
          {downloading ? 'Downloading…' : 'Download PDF Report'}
        </button>
      </div>
    </div>
  );
}

function fmt(v) {
  if (v === undefined || v === null || Number.isNaN(v)) return '-';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(3) : String(v);
}
