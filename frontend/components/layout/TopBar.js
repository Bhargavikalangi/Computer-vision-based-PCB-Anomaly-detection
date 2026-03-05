'use client';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSystemStatus } from '@/hooks/useSystemStatus';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', sub: 'System overview & metrics' },
  '/upload': { title: 'Analyze PCB', sub: 'Upload images for anomaly detection' },
  '/results': { title: 'Results', sub: 'Detection analysis results' },
  '/history': { title: 'History', sub: 'Past analysis records' },
  '/reports': { title: 'Reports', sub: 'Generated analysis reports' },
  '/settings': { title: 'Settings', sub: 'System configuration' },
};

export default function TopBar() {
  const pathname = usePathname();
  const { status } = useSystemStatus();

  const getPageInfo = () => {
    for (const [path, info] of Object.entries(pageTitles)) {
      if (pathname === path || pathname.startsWith(path + '/')) return info;
    }
    return { title: 'PCB Vision', sub: '' };
  };

  const { title, sub } = getPageInfo();

  return (
    <header style={{
      height: 64,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(6,9,18,0.8)',
      backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center',
      padding: '0 28px', gap: 16,
      position: 'sticky', top: 0, zIndex: 9,
      flexShrink: 0,
    }}>
      <div style={{ flex: 1 }}>
        <motion.div
          key={title}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1 }}>
            {title}
          </h1>
          {sub && (
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{sub}</p>
          )}
        </motion.div>
      </div>

      {/* System status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <StatusPill label="Model" status={status?.model || 'idle'} />
        <StatusPill label="API" status={status?.api || 'online'} />
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, cursor: 'pointer',
          color: 'rgba(255,255,255,0.5)',
        }}>⚇</div>
      </div>
    </header>
  );
}

function StatusPill({ label, status }) {
  const colors = { online: '#48bb78', idle: '#f6e05e', processing: '#63b3ed', offline: '#fc8181' };
  const color = colors[status] || colors.idle;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, padding: '4px 10px',
    }}>
      <motion.div
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}
