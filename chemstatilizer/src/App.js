import './App.css';
import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import HistoryList from './components/HistoryList';
import SummaryPanel from './components/SummaryPanel';
import Charts from './components/Charts';
import DataTable from './components/DataTable';

function App() {
  const [selected, setSelected] = useState(null);

  const onUploaded = (ds) => {
    setSelected(ds);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 16px' }}>
      <h2>Chemical Equipment Parameter Visualizer</h2>
      <h3>Analyze and Visualize Your Chemical Equipment Data</h3>
      <p style={{ color: '#666', marginTop: -8 }}>Upload a CSV, view summary and charts, and download a PDF report.</p>

      <div style={{ marginBottom: 16 }}>
        <UploadForm onUploaded={onUploaded} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        <div>
          <h3 style={{ marginTop: 0 }}>Recent Uploads</h3>
          <HistoryList onSelect={setSelected} />
        </div>
        <div>
          {selected ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                <SummaryPanel dataset={selected} />
                <Charts summary={selected.summary} dataset={selected} />
                {selected.csv_file && (
                  <div>
                    <h3>Data Table</h3>
                    <DataTable csvUrl={selected.csv_file} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ color: '#777' }}>Select an uploaded dataset to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
