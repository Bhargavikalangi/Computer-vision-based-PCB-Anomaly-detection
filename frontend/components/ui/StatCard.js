'use client';
import { motion, useMotionValue, useSpring, useEffect } from 'framer-motion';
import GlassCard from './GlassCard';

function AnimatedNumber({ value, decimals = 0 }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={value}
    >
      {typeof value === 'number'
        ? value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : value}
    </motion.span>
  );
}

export default function StatCard({ label, value, unit = '', change, icon, color = '#63b3ed', delay = 0, description }) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <GlassCard delay={delay} glow style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background accent */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {icon}
        </div>

        {change !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 6,
            background: isPositive ? 'rgba(72,187,120,0.1)' : isNegative ? 'rgba(252,129,129,0.1)' : 'var(--panel-bg)',
            fontSize: '0.7rem', fontWeight: 500,
            color: isPositive ? '#48bb78' : isNegative ? '#fc8181' : 'var(--text-muted)',
          }}>
            {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(change)}%
          </div>
        )}
      </div>

      <div style={{ marginBottom: 4 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
          }}
        >
          <AnimatedNumber value={value} decimals={typeof value === 'number' && value % 1 !== 0 ? 1 : 0} />
          {unit && (
            <span
              style={{
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                fontWeight: 400,
              }}
            >
              {unit}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          fontWeight: 400,
        }}
      >
        {label}
      </div>
      {description && (
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            marginTop: 4,
          }}
        >
          {description}
        </div>
      )}
    </GlassCard>
  );
}
