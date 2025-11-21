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
    <div className="app-container">
      <header className="app-header">
        <h2>Chemical Equipment Parameter Visualizer</h2>
        <h3>Analyze and Visualize Your Chemical Equipment Data</h3>
        <p>Upload a CSV, view summary and charts, and download a PDF report.</p>
      </header>

      <div className="upload-section">
        <UploadForm onUploaded={onUploaded} />
      </div>

      <div className="dashboard-grid">
        <aside className="sidebar">
          <h3>Recent Uploads</h3>
          <HistoryList onSelect={setSelected} />
        </aside>
        <main className="main-content">
          {selected ? (
            <div className="analysis-container">
              <div className="card summary-card">
                <SummaryPanel dataset={selected} />
              </div>
              <div className="card charts-card">
                <Charts summary={selected.summary} dataset={selected} />
              </div>
              {selected.csv_file && (
                <div className="card table-card">
                  <h3>Data Table</h3>
                  <DataTable csvUrl={selected.csv_file} />
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>Select an uploaded dataset from the sidebar to view details.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
