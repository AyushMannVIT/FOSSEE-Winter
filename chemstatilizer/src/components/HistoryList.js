import React, { useEffect, useState } from 'react';
import api from '../api';

export default function HistoryList({ onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/datasets/');
      setItems(data);
    } catch (e) {
      setError(e?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div>Loading history…</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  if (!items.length) return <div>No uploads yet.</div>;

  const [downloadingId, setDownloadingId] = useState(null);

  const handlePdf = async (id) => {
    setDownloadingId(id);
    try {
      const resp = await api.get(`/datasets/${id}/report/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF report', err);
      alert('Failed to download PDF report');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((d) => (
        <div key={d.id} style={{
          border: '1px solid #ddd', padding: 8, borderRadius: 6,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 600 }}>{d.filename}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Rows: {d.row_count}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onSelect?.(d)}>Open</button>
            <button
              onClick={() => handlePdf(d.id)}
              disabled={downloadingId === d.id}
            >
              {downloadingId === d.id ? 'Downloading…' : 'PDF Report'}
            </button>
            {d.csv_file && (
              <a href={d.csv_file} target="_blank" rel="noreferrer">CSV</a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
