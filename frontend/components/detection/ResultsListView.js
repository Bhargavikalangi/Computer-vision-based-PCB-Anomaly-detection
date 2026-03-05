'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import { formatDistanceToNow, isValid } from 'date-fns';

const STATUS_COLORS = { pass: '#48bb78', fail: '#fc8181', processing: '#63b3ed' };

function safeDate(val) {
  const d = new Date(val);
  return isValid(d) ? d : new Date();
}

export default function ResultsListView() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 100, sort: 'desc' });
    if (filter !== 'all') params.append('status', filter);
    fetch(`http://localhost:8000/api/v1/results?${params}`)
      .then(r => r.json())
      .then(data => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const filtered = items.filter(r =>
    r.filename?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>
            Analysis <span className="gradient-text">Results</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>{filtered.length} records found</p>
        </div>
        <Link href="/upload"><button className="btn-primary">+ New Analysis</button></Link>
      </motion.div>

      <GlassCard delay={0.05} style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['all', 'pass', 'fail'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                  background: filter === f ? 'rgba(99,179,237,0.2)' : 'rgba(255,255,255,0.04)',
                  color: filter === f ? '#63b3ed' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.15s ease',
                }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <input placeholder="Search by filename..." value={search} onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
              padding: '8px 14px', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', outline: 'none',
            }} />
        </div>
      </GlassCard>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
      )}

      {!loading && filtered.length === 0 && (
        <GlassCard delay={0.1} style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', marginBottom: 6 }}>No results yet</p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', marginBottom: 20 }}>Upload a PCB image to run your first analysis</p>
          <Link href="/upload"><button className="btn-primary">Upload Image</button></Link>
        </GlassCard>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map((result, i) => (
          <Link key={result.id} href={`/results/${result.id}`} style={{ textDecoration: 'none' }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
              className="glass" style={{ padding: 18, cursor: 'pointer' }}
            >
              <div style={{
                height: 120, borderRadius: 10, marginBottom: 14, overflow: 'hidden',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              }}>
                {result.annotated_image_url ? (
                  <img src={result.annotated_image_url} alt={result.filename}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 32, color: 'rgba(255,255,255,0.1)' }}>⬡</span>
                )}
                <div style={{
                  position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%',
                  background: STATUS_COLORS[result.status] || '#63b3ed',
                  boxShadow: `0 0 8px ${STATUS_COLORS[result.status] || '#63b3ed'}`,
                }} />
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {result.filename}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
                {formatDistanceToNow(safeDate(result.created_at), { addSuffix: true })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge badge-${result.status === 'pass' ? 'pass' : 'critical'}`} style={{ fontSize: '0.65rem' }}>
                  {result.status?.toUpperCase()}
                </span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                    {result.total_defects ?? 0} defect{result.total_defects !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(99,179,237,0.7)' }}>
                    {result.overall_confidence?.toFixed(1)}%
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

