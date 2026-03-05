'use client';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#fc8181','#ed8936','#f6e05e','#63b3ed','#9f7aea','#48bb78'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px' }}>
      <p style={{ fontSize: '0.8rem', color: item.payload.color, fontWeight: 600 }}>{item.name}</p>
      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{item.value}%</p>
    </div>
  );
};

export default function DefectDistributionChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/stats/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.defect_distribution && d.defect_distribution.length > 0) {
          setData(d.defect_distribution.map((item, i) => ({
            ...item,
            color: COLORS[i % COLORS.length],
          })));
        }
      })
      .catch(() => setData([]));
  }, []);

  if (data.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem', textAlign: 'center' }}>No defects detected yet</p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map(item => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{item.name}</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

