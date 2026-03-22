'use client';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

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
  const { theme, toggleTheme } = useTheme();

  const getPageInfo = () => {
    for (const [path, info] of Object.entries(pageTitles)) {
      if (pathname === path || pathname.startsWith(path + '/')) return info;
    }
    return { title: 'PCB Vision', sub: '' };
  };

  const { title, sub } = getPageInfo();

  return (
    <header
      style={{
        height: 64,
        borderBottom: '1px solid var(--border-glass)',
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 9,
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1 }}>
        <motion.div
          key={title}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {title}
          </h1>
          {sub && (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginTop: 3,
              }}
            >
              {sub}
            </p>
          )}
        </motion.div>
      </div>

      {/* System status + theme toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <EnginePill label="Engine" value={status?.detection_engine || 'OpenCV Rule-Based'} />
        <StatusPill label="API" status={status?.api || 'online'} />
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            transition: 'background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
          }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
}

function EnginePill({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        borderRadius: 8,
        padding: '4px 10px',
        maxWidth: 220,
      }}
    >
      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span
        style={{
          fontSize: '0.65rem',
          color: 'var(--text-primary)',
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function StatusPill({ label, status }) {
  const colors = { online: '#48bb78', idle: '#f6e05e', processing: '#63b3ed', offline: '#fc8181' };
  const color = colors[status] || colors.idle;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        borderRadius: 8,
        padding: '4px 10px',
      }}
    >
      <motion.div
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span
        style={{
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
}
