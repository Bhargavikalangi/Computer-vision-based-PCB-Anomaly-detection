'use client';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-secondary)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: '0.8rem', color: p.color, fontWeight: 500 }}>
          {p.name === 'analyses' ? '◎ Analyses' : '⚠ Defects'}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function DefectTrendChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/stats/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.trend && d.trend.length > 0) {
          setData(d.trend.map(t => ({
            day: t.day,
            analyses: t.analyses,
            defects: t.defects,
          })));
        }
      })
      .catch(() => setData([]));
  }, []);

  if (data.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No trend data yet — upload more images</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="analysisGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#63b3ed" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#63b3ed" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="defectGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fc8181" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#fc8181" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
        <XAxis dataKey="day" tick={{ fill: 'var(--chart-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--chart-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="analyses" stroke="#63b3ed" strokeWidth={2} fill="url(#analysisGrad)" name="analyses" dot={false} />
        <Area type="monotone" dataKey="defects" stroke="#fc8181" strokeWidth={2} fill="url(#defectGrad)" name="defects" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

