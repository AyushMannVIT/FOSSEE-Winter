import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';

export default function DataTable({ csvUrl }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!csvUrl) return;
    setError('');
    setRows([]);
    fetch(csvUrl)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch CSV');
        return r.text();
      })
      .then((text) => {
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        if (parsed.errors?.length) {
          // still display what we can
          console.warn('CSV parse errors:', parsed.errors);
        }
        setRows(parsed.data || []);
      })
      .catch((e) => setError(e.message));
  }, [csvUrl]);

  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

  if (!csvUrl) return null;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!rows.length) return <div>Loading table…</div>;

  return (
    <div style={{ overflow: 'auto', maxHeight: 360, border: '1px solid #eee', borderRadius: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} style={thTdStyle}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((c) => (
                <td key={c} style={thTdStyle}>{row[c]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thTdStyle = {
  borderBottom: '1px solid #f0f0f0',
  padding: '6px 8px',
  textAlign: 'left'
};
