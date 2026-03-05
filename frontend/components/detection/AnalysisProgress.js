'use client';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';

const STAGES = [
  { id: 'upload', label: 'Uploading images', icon: '⬆' },
  { id: 'preprocess', label: 'Preprocessing & normalization', icon: '◈' },
  { id: 'inference', label: 'Running detection model', icon: '⬡' },
  { id: 'postprocess', label: 'Post-processing results', icon: '◎' },
  { id: 'save', label: 'Saving to database', icon: '◻' },
];

export default function AnalysisProgress({ progress, fileCount }) {
  const currentStageIndex = STAGES.findIndex(s => s.id === progress?.stage) ?? 0;
  const pct = progress?.percent ?? 0;

  return (
    <div style={{ maxWidth: 600, margin: '60px auto' }}>
      <GlassCard style={{ textAlign: 'center', padding: 48 }}>
        {/* Animated scanner icon */}
        <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 32px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 0, border: '2px solid transparent',
              borderTopColor: '#63b3ed', borderRadius: '50%',
            }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 8, border: '2px solid transparent',
              borderTopColor: '#9f7aea', borderRadius: '50%',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontSize: '1.3rem', fontWeight: 700, color: '#63b3ed',
          }}>
            {pct.toFixed(0)}%
          </div>
        </div>

        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>
          Analyzing PCB Images
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: 32 }}>
          Processing {fileCount} image{fileCount > 1 ? 's' : ''} with AI detection model
        </p>

        {/* Progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 6, marginBottom: 32, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #63b3ed, #9f7aea)', borderRadius: 999, position: 'relative' }}
          >
            <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translate(50%, -50%)', width: 10, height: 10, borderRadius: '50%', background: '#9f7aea', boxShadow: '0 0 10px #9f7aea' }} />
          </motion.div>
        </div>

        {/* Stage list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
          {STAGES.map((stage, i) => {
            const done = i < currentStageIndex;
            const active = i === currentStageIndex;
            return (
              <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: done ? 'rgba(72,187,120,0.15)' : active ? 'rgba(99,179,237,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${done ? 'rgba(72,187,120,0.3)' : active ? 'rgba(99,179,237,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                  color: done ? '#48bb78' : active ? '#63b3ed' : 'rgba(255,255,255,0.2)',
                }}>
                  {done ? '✓' : active ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>◎</motion.span>
                  ) : stage.icon}
                </div>
                <span style={{ fontSize: '0.82rem', color: done ? '#48bb78' : active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)', fontWeight: active ? 500 : 400 }}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
