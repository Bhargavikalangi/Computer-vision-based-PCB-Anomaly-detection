'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, isValid } from 'date-fns';

function safeDate(val) {
  const d = new Date(val);
  return isValid(d) ? d : new Date();
}

export default function HistoryView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState([]);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/results?limit=50&sort=desc')
      .then(r => r.json())
      .then(data => {
        const list = data.items || [];
        setItems(list);
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const counts = days.map(d => ({ day: d, pass: 0, fail: 0 }));
        const now = new Date();
        list.forEach(item => {
          const d = safeDate(item.created_at);
          const diff = (now - d) / (1000 * 60 * 60 * 24);
          if (diff <= 7) {
            const idx = d.getDay();
            if (item.status === 'pass') counts[idx].pass++;
            else counts[idx].fail++;
          }
        });
        setWeekData(counts);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>
          Analysis <span className="gradient-text">History</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
          {items.length} record{items.length !== 1 ? 's' : ''} found
        </p>
      </motion.div>

      <GlassCard delay={0.1} style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}>This Week</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weekData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }} />
            <Bar dataKey="pass" fill="rgba(72,187,120,0.6)" radius={[4, 4, 0, 0]} name="Pass" />
            <Bar dataKey="fail" fill="rgba(252,129,129,0.6)" radius={[4, 4, 0, 0]} name="Fail" />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard delay={0.2}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', fontWeight: 600, marginBottom: 20 }}>Timeline</h3>
        {loading && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>Loading...</p>}
        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>◷</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>No analyses yet</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{ display: 'flex', gap: 16, paddingBottom: 16, position: 'relative' }}>
              {i < items.length - 1 && (
                <div style={{ position: 'absolute', left: 11, top: 24, bottom: 0, width: 1, background: 'rgba(255,255,255,0.06)' }} />
              )}
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                background: item.status === 'pass' ? 'rgba(72,187,120,0.15)' : 'rgba(252,129,129,0.15)',
                border: `1px solid ${item.status === 'pass' ? 'rgba(72,187,120,0.4)' : 'rgba(252,129,129,0.4)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                color: item.status === 'pass' ? '#48bb78' : '#fc8181', zIndex: 1,
              }}>
                {item.status === 'pass' ? '✓' : '!'}
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.83rem', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{item.filename}</span>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginLeft: 8 }}>
                    {format(safeDate(item.created_at), 'MMM d, HH:mm')}
                  </span>
                </div>
                <div style={{ marginTop: 4, display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: '0.7rem', color: item.status === 'pass' ? '#48bb78' : '#fc8181' }}>
                    {item.status === 'pass' ? 'Passed' : `${item.total_defects ?? 0} defects found`}
                  </span>
                  {item.processing_time && <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>{item.processing_time}s</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

