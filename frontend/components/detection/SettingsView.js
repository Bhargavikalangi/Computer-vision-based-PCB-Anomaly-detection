'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import toast from 'react-hot-toast';

export default function SettingsView() {
  const [settings, setSettings] = useState({
    defaultConfidence: 50,
    autoAnnotate: true, saveOriginal: true,
    notifyOnFail: true, batchSize: 4,
    dbRetention: 90, apiKey: '',
  });

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const handleSave = () => toast.success('Settings saved');

  const ToggleSwitch = ({ value, onChange }) => (
    <div onClick={onChange} style={{
      width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
      background: value ? '#63b3ed' : 'var(--input-bg)',
      border: `1px solid ${value ? '#63b3ed' : 'var(--input-border)'}`,
      position: 'relative', transition: 'all 0.2s ease', flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', top: 4, left: value ? 23 : 4, width: 14, height: 14, borderRadius: '50%', background: 'var(--bg-secondary)', transition: 'left 0.2s ease' }} />
    </div>
  );

  const Section = ({ title, children, delay }) => (
    <GlassCard delay={delay} style={{ marginBottom: 16 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </GlassCard>
  );

  const Row = ({ label, description, children }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
      <div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 400 }}>{label}</div>
        {description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: 6, color: 'var(--text-primary)' }}>
          System <span className="gradient-text">Settings</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Configure detection settings and system behavior</p>
  </motion.div>

      <Section title="Detection" delay={0.1}>
        <Row label="Engine" description="Fixed pipeline for all analyses">
          <div
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 10,
              padding: '8px 14px',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
            }}
          >
            Engine: OpenCV (Rule-Based)
          </div>
        </Row>
        <Row label={`Confidence Threshold: ${settings.defaultConfidence}%`} description="Minimum confidence to report a defect">
          <input type="range" min="20" max="95" value={settings.defaultConfidence} onChange={e => set('defaultConfidence', Number(e.target.value))}
            style={{ width: 160, accentColor: '#63b3ed' }} />
        </Row>
        <Row label="Batch Size" description="Images processed simultaneously">
          <input type="number" min="1" max="16" value={settings.batchSize} onChange={e => set('batchSize', Number(e.target.value))}
            style={{ width: 80, background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 10, padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.82rem', textAlign: 'center' }} />
        </Row>
      </Section>

      <Section title="Output Options" delay={0.15}>
        <Row label="Auto-annotate results" description="Draw bounding boxes on output images">
          <ToggleSwitch value={settings.autoAnnotate} onChange={() => set('autoAnnotate', !settings.autoAnnotate)} />
        </Row>
        <Row label="Save original images" description="Keep unmodified uploads in storage">
          <ToggleSwitch value={settings.saveOriginal} onChange={() => set('saveOriginal', !settings.saveOriginal)} />
        </Row>
        <Row label="Notify on failure" description="Alert when defects are detected">
          <ToggleSwitch value={settings.notifyOnFail} onChange={() => set('notifyOnFail', !settings.notifyOnFail)} />
        </Row>
      </Section>

      <Section title="Database" delay={0.2}>
        <Row label={`Data retention: ${settings.dbRetention} days`} description="Auto-delete records older than this">
          <input type="range" min="7" max="365" value={settings.dbRetention} onChange={e => set('dbRetention', Number(e.target.value))}
            style={{ width: 160, accentColor: '#63b3ed' }} />
        </Row>
      </Section>

      <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
        className="btn-primary" onClick={handleSave}
        style={{ width: '100%', padding: 14, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        ✓ Save Settings
      </motion.button>
    </div>
  );
}
