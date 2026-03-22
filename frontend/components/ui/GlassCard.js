'use client';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', style = {}, hover = true, glow = false, delay = 0, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={hover ? { y: -2, boxShadow: glow ? '0 0 30px rgba(99,179,237,0.2)' : '0 8px 30px rgba(0,0,0,0.3)' } : {}}
      onClick={onClick}
      className={`glass ${className}`}
      style={{
        padding: 24,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Subtle inner highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 1,
        background: `linear-gradient(90deg, transparent, var(--glass-highlight), transparent)`,
        pointerEvents: 'none',
      }} />
      {children}
    </motion.div>
  );
}
