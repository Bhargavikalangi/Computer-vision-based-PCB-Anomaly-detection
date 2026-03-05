'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow, isValid } from 'date-fns';

function safeDate(val) {
  const d = new Date(val);
  return isValid(d) ? d : new Date();
}

export default function RecentAnalysisList() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/results?limit=5&sort=desc')
      .then(r => r.json())
      .then(data => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>No analyses yet</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <Link key={item.id} href={`/results/${item.id}`} style={{ textDecoration: 'none' }}>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ x: 3, background: 'rgba(255,255,255,0.05)' }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: item.status === 'pass' ? '#48bb78' : '#fc8181',
              boxShadow: `0 0 8px ${item.status === 'pass' ? '#48bb78' : '#fc8181'}`,
            }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.filename}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                {formatDistanceToNow(safeDate(item.created_at), { addSuffix: true })}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '0.75rem', color: item.total_defects > 0 ? '#fc8181' : '#48bb78', fontWeight: 500 }}>
                {item.total_defects > 0 ? `${item.total_defects} defects` : 'Clean'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                {item.overall_confidence?.toFixed(1)}%
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}

