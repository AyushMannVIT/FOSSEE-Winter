import React, { useEffect, useState } from 'react';
import api from '../api';

export default function HistoryList({ onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/datasets/');
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && Array.isArray(data.results)) {
        // Handle potential pagination response
        setItems(data.results);
      } else {
        console.error('Unexpected API response:', data);
        throw new Error('Invalid response format from server');
      }
    } catch (e) {
      console.error('History load error:', e);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((d) => (
        <div key={d.id} className="history-item">
          <div className="history-info">
            <div className="history-filename">{d.filename}</div>
            <div className="history-meta">Rows: {d.row_count}</div>
          </div>
          <div className="history-actions">
            <button className="btn btn-sm btn-secondary" onClick={() => onSelect?.(d)}>Open</button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => handlePdf(d.id)}
              disabled={downloadingId === d.id}
            >
              {downloadingId === d.id ? '...' : 'PDF'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
