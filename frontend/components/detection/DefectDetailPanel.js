'use client';
import { motion, AnimatePresence } from 'framer-motion';

const SEVERITY_COLORS = { critical: '#fc8181', high: '#ed8936', medium: '#f6e05e', low: '#48bb78' };
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function DefectDetailPanel({ defects = [], selectedDefect, onSelect }) {
  const sorted = [...defects].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4));

  if (!sorted.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
        <p style={{ color: '#48bb78', fontSize: '0.85rem', fontWeight: 500 }}>No defects detected</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>PCB passed quality check</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.map((defect, i) => {
        const color = SEVERITY_COLORS[defect.severity] || '#63b3ed';
        const isSelected = selectedDefect?.id === defect.id;

        return (
          <motion.div
            key={defect.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => onSelect(isSelected ? null : defect)}
            style={{
              padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
              background: isSelected ? `${color}12` : 'var(--bg-card)',
              border: `1px solid ${isSelected ? color + '40' : 'var(--border-glass)'}`,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{defect.type}</span>
              </div>
              <span className={`badge badge-${defect.severity}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                {defect.severity}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12, paddingLeft: 16 }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Confidence: </span>
                <span style={{ fontSize: '0.7rem', color: color, fontWeight: 500 }}>{defect.confidence?.toFixed(1)}%</span>
              </div>
              {defect.location && (
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Location: </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{defect.location}</span>
                </div>
              )}
            </div>

            <AnimatePresence>
              {isSelected && defect.description && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 8, paddingLeft: 16, lineHeight: 1.5 }}>
                  {defect.description}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
