import React, { useState } from 'react';
import api from '../api';

export default function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/upload/', form);
      onUploaded?.(data);
      setFile(null);
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 16, alignItems: 'center', width: '100%', justifyContent: 'center' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: '#fff' }}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={!file || loading}>
        {loading ? (
          <>
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <span>Upload CSV</span>
          </>
        )}
      </button>
      {error && <span style={{ color: 'var(--danger-color)', fontWeight: 500 }}>{error}</span>}
    </form>
  );
}
