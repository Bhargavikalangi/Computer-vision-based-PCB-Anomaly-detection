'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: '◈', label: 'Dashboard' },
  { href: '/upload', icon: '⬆', label: 'Analyze' },
  { href: '/results', icon: '◎', label: 'Results' },
  { href: '/history', icon: '◷', label: 'History' },
  { href: '/reports', icon: '◻', label: 'Reports' },
  { href: '/settings', icon: '⚙', label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '8px 12px 32px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #63b3ed, #9f7aea)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0, boxShadow: '0 0 20px rgba(99,179,237,0.3)'
          }}>⬡</div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'rgba(255,255,255,0.95)', lineHeight: 1.1 }}>PCB Vision</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>ANOMALY DETECTOR</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 12px', borderRadius: 12, cursor: 'pointer',
                  background: isActive ? 'rgba(99,179,237,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(99,179,237,0.2)' : '1px solid transparent',
                  color: isActive ? '#63b3ed' : 'rgba(255,255,255,0.45)',
                  transition: 'all 0.2s ease', overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%',
                      width: 3, background: '#63b3ed', borderRadius: '0 3px 3px 0',
                    }}
                  />
                )}
                <span style={{ fontSize: 16, flexShrink: 0, marginLeft: isActive ? 4 : 0 }}>{item.icon}</span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: isActive ? 500 : 400, whiteSpace: 'nowrap' }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
          color: 'rgba(255,255,255,0.35)', fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        <motion.span animate={{ rotate: collapsed ? 180 : 0 }}>{'←'}</motion.span>
      </button>
    </motion.aside>
  );
}
