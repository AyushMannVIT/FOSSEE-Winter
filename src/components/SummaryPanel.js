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
    <div>
      <h3>Summary Statistics</h3>
      <div style={{ marginBottom: '1rem' }}>
        <div className="stat-label">Total Rows</div>
        <div className="stat-value">{count}</div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-box">
          <div className="stat-label">Avg Flowrate</div>
          <div className="stat-value">{fmt(averages.Flowrate)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Avg Pressure</div>
          <div className="stat-value">{fmt(averages.Pressure)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Avg Temp</div>
          <div className="stat-value">{fmt(averages.Temperature)}</div>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <strong>Type Distribution</strong>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {Object.entries(type_distribution).map(([k, v]) => (
            <span key={k} style={{ 
              background: 'var(--bg-color)', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}>
              {k}: <strong>{v}</strong>
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={handleDownload} disabled={downloading || !dataset?.id}>
          {downloading ? 'Generating PDF...' : 'Download Full PDF Report'}
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
