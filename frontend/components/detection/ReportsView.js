'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';

const REPORT_ICONS = { weekly: '◷', batch: '◎', monthly: '◻', custom: '◈' };

export default function ReportsView() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/reports')
      .then(r => r.json())
      .then(data => setReports(data || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (type) => {
    setGenerating(type);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      // Refresh list
      const updated = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/reports').then(r => r.json());
      setReports(updated || []);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = (report) => {
    window.open(`http://localhost:8000/static/results/report_${report.id}.pdf`, '_blank');
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: 6, color: 'var(--text-primary)' }}>
          Analysis <span className="gradient-text">Reports</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Generate and download comprehensive analysis reports</p>
      </motion.div>

      {/* Generate new report */}
      <GlassCard delay={0.1} style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, marginBottom: 18, color: 'var(--text-primary)' }}>Generate Report</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { type: 'weekly', label: 'Weekly Summary', icon: '◷' },
            { type: 'monthly', label: 'Monthly Overview', icon: '◻' },
            { type: 'custom', label: 'Custom Range', icon: '◈' },
          ].map((item) => (
            <motion.button key={item.type}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => handleGenerate(item.type)}
              disabled={generating === item.type}
              style={{
                background: generating === item.type ? 'rgba(99,179,237,0.1)' : 'var(--panel-bg)',
                border: `1px solid ${generating === item.type ? 'rgba(99,179,237,0.3)' : 'var(--border-glass)'}`,
                borderRadius: 14, padding: '20px 16px', cursor: generating ? 'wait' : 'pointer',
                textAlign: 'center', transition: 'all 0.2s ease',
              }}>
              <div style={{ fontSize: 28, marginBottom: 8, color: 'var(--text-primary)' }}>
                {generating === item.type ? '⟳' : item.icon}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {generating === item.type ? 'Generating...' : item.label}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PDF + CSV</div>
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Reports list */}
      <GlassCard delay={0.2}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Generated Reports</h3>

        {loading && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>Loading...</p>
        )}

        {!loading && reports.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 10, color: 'var(--text-muted)' }}>◻</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No reports generated yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>Click a button above to generate your first report</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map((report, i) => (
            <motion.div key={report.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 12,
                background: 'var(--panel-bg)',
                border: '1px solid var(--border-glass)',
              }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--text-primary)',
              }}>
                {REPORT_ICONS[report.type] || '◻'}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{report.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {report.analyses} analyses · {report.pass_rate?.toFixed(1)}% pass rate · {report.size ? (report.size / 1024).toFixed(1) + ' KB' : 'N/A'}
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => handleDownload(report)}
                style={{
                  background: 'rgba(99,179,237,0.12)', border: '1px solid rgba(99,179,237,0.2)',
                  borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
                  color: '#63b3ed', fontSize: '0.78rem', fontWeight: 500,
                }}>
                ↓ Download
              </motion.button>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

