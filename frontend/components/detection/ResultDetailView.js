'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import AnnotatedImageViewer from './AnnotatedImageViewer';
import DefectDetailPanel from './DefectDetailPanel';
import { useAnalysisResult } from '@/hooks/useAnalysisResult';
import { formatDistanceToNow } from 'date-fns';

const SEVERITY_COLORS = { critical: '#fc8181', high: '#ed8936', medium: '#f6e05e', low: '#48bb78' };

export default function ResultDetailView({ id }) {
  const { result, loading } = useAnalysisResult(id);
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
  setExporting(true);
  try {
    const res = await fetch(`http://localhost:8000/api/v1/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'single', analysis_id: id }),
    });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcb_report_${id?.slice(0,8)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    if (data?.annotated_image_url) window.open(data.annotated_image_url, '_blank');
    else alert('Export failed.');
  } finally {
    setExporting(false);
  }
};
  const mockResult = {
    id, filename: 'pcb_sample_board.jpg',
    status: 'fail', created_at: new Date(Date.now() - 3600000),
    processing_time: 1.24, model_used: 'OpenCV Rule-Based',
    defects: [
      ],
    overall_confidence: 94.2,
  };

  /*
{ id: 'd1', type: 'Solder Bridge', severity: 'critical', confidence: 96.2, bbox: [120, 80, 60, 45], location: 'U3 pin 4-5' },
      { id: 'd2', type: 'Missing Component', severity: 'high', confidence: 91.8, bbox: [280, 160, 40, 40], location: 'R12 resistor pad' },
      { id: 'd3', type: 'Open Circuit', severity: 'medium', confidence: 88.5, bbox: [180, 220, 55, 30], location: 'Trace near C7' },
    
  */
  const data = result || mockResult;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{data.filename}</h2>
            <span className={`badge badge-${data.status === 'pass' ? 'pass' : 'critical'}`}>{data.status?.toUpperCase()}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Analyzed {formatDistanceToNow(new Date(data.created_at), { addSuffix: true })} · {data.model_used || data.model} · {data.processing_time}s
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={() => setShowOverlay(!showOverlay)}>
            {showOverlay ? '◻ Hide' : '◎ Show'} Overlay
          </button>
          <button className="btn-primary" onClick={handleExportPDF} disabled={exporting}>
            {exporting ? '⟳ Exporting...' : '↓ Export PDF'}
          </button>

        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Main image */}
        <GlassCard delay={0.1} style={{ padding: 16 }}>
          <AnnotatedImageViewer
            imageUrl={data.annotated_image_url || '/placeholder-pcb.jpg'}
            defects={data.defects}
            showOverlay={showOverlay}
            selectedDefect={selectedDefect}
            onSelectDefect={setSelectedDefect}
          />
        </GlassCard>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary */}
          <GlassCard delay={0.15}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Defects', value: data.defects?.length ?? 0, color: data.defects?.length ? '#fc8181' : '#48bb78' },
                { label: 'Confidence', value: `${data.overall_confidence?.toFixed(1)}%`, color: '#63b3ed' },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--panel-bg)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Defects list */}
          <GlassCard delay={0.2} style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
              Detected Anomalies ({data.defects?.length ?? 0})
            </h3>
            <DefectDetailPanel defects={data.defects} selectedDefect={selectedDefect} onSelect={setSelectedDefect} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
