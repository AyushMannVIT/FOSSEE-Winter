import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Charts({ summary }) {
  const typeDist = summary?.type_distribution || {};
  const averages = summary?.averages || {};

  const typeData = useMemo(() => {
    const labels = Object.keys(typeDist);
    const values = Object.values(typeDist);
    return {
      labels,
      datasets: [{
        label: 'Count',
        data: values,
        backgroundColor: '#4e79a7'
      }]
    };
  }, [typeDist]);

  const avgData = useMemo(() => {
    const labels = ['Flowrate', 'Pressure', 'Temperature'];
    const values = labels.map((k) => averages[k] ?? null);
    return {
      labels,
      datasets: [{
        label: 'Average',
        data: values,
        backgroundColor: '#59a14f'
      }]
    };
  }, [averages]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div>
        <h3 style={{ marginTop: 0 }}>Type Distribution</h3>
        <Bar data={typeData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
      </div>
      <div>
        <h3 style={{ marginTop: 0 }}>Averages</h3>
        <Bar data={avgData} options={{ indexAxis: 'y', responsive: true }} />
      </div>
    </div>
  );
}
