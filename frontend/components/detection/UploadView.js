'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import GlassCard from '@/components/ui/GlassCard';
import AnalysisProgress from './AnalysisProgress';
import { analyzeImage } from '@/lib/api';

const ACCEPTED_TYPES = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/bmp': ['.bmp'], 'image/tiff': ['.tiff', '.tif'] };
const MAX_FILES = 10;

export default function UploadView() {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [settings, setSettings] = useState({ confidence: 0.5, annotate: true });

  const onDrop = useCallback((accepted) => {
    const newFiles = accepted.map(f => Object.assign(f, { preview: URL.createObjectURL(f), id: Math.random().toString(36).slice(2) }));
    setFiles(prev => [...prev, ...newFiles].slice(0, MAX_FILES));
  }, []);

  //const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: ACCEPTED_TYPES, maxFiles: MAX_FILES });

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
    onDrop, 
    accept: ACCEPTED_TYPES, 
    maxFiles: MAX_FILES,
    noClick: false
  });

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));

  const handleAnalyze = async () => {
    if (!files.length) { toast.error('Please upload at least one image'); return; }
    setAnalyzing(true);
    try {
      const results = await analyzeImage(files, settings, setProgress);
      toast.success(`Analysis complete! ${results.length} image(s) processed.`);
      router.push(results.length === 1 ? `/results/${results[0].id}` : '/results');
    } catch (err) {
      toast.error(err.message || 'Analysis failed');
      setAnalyzing(false);
      setProgress(null);
    }
  };

  if (analyzing) return <AnalysisProgress progress={progress} fileCount={files.length} />;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          PCB <span className="gradient-text">Analysis</span>
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
          }}
        >
          Upload PCB images for OpenCV rule-based anomaly detection
        </p>
      </motion.div>

      {/* Drop Zone */}
      <GlassCard delay={0.1} style={{ padding: 0, marginBottom: 16 }}>
        <div
          {...getRootProps()}
          style={{
            padding: 48, textAlign: 'center', cursor: 'pointer',
            border: `2px dashed ${isDragActive ? 'rgba(99,179,237,0.6)' : 'var(--border-glass)'}`,
            borderRadius: 22,
            background: isDragActive ? 'rgba(99,179,237,0.05)' : 'transparent',
            transition: 'all 0.25s ease',
          }}
        >
          <input {...getInputProps()} />
          <motion.div animate={{ scale: isDragActive ? 1.05 : 1 }} transition={{ duration: 0.2 }}>
            <div style={{ fontSize: 48, marginBottom: 16, filter: isDragActive ? 'drop-shadow(0 0 20px rgba(99,179,237,0.6))' : 'none' }}>⬡</div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: 8,
                color: isDragActive ? 'var(--accent-cyan)' : 'var(--text-primary)',
              }}
            >
              {isDragActive ? 'Release to upload' : 'Drop PCB images here'}
            </p>
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
              }}
            >
              JPG, PNG, BMP, TIFF supported · Max {MAX_FILES} images · Any resolution
            </p>
           <motion.button 
              whileHover={{ scale: 1.03 }} 
              whileTap={{ scale: 0.97 }} 
              className="btn-primary" 
              style={{ marginTop: 20 }} 
              onClick={e => { e.stopPropagation(); open(); }}
            >
              Browse Files
            </motion.button>
          </motion.div>
        </div>
      </GlassCard>

      {/* File Previews */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard delay={0} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                  }}
                >
                  {files.length} image{files.length > 1 ? 's' : ''} queued
                </h3>
                <button className="btn-ghost" style={{ padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => setFiles([])}>
                  Clear all
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                {files.map((file) => (
                  <motion.div key={file.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                    <img src={file.preview} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => removeFile(file.id)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', color: 'white', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings + Analyze */}
      <GlassCard delay={0.2}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.95rem',
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          Detection Settings
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Detection engine</label>
            <div
              style={{
                width: '100%',
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: 10,
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            >
              Engine: OpenCV (Rule-Based)
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Confidence: {(settings.confidence * 100).toFixed(0)}%</label>
            <input type="range" min="20" max="95" value={settings.confidence * 100} onChange={e => setSettings(s => ({ ...s, confidence: e.target.value / 100 }))}
              style={{ width: '100%', accentColor: '#63b3ed', marginTop: 6 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div onClick={() => setSettings(s => ({ ...s, annotate: !s.annotate }))}
                style={{ width: 40, height: 22, borderRadius: 11, background: settings.annotate ? '#63b3ed' : 'var(--input-bg)', border: `1px solid ${settings.annotate ? '#63b3ed' : 'var(--input-border)'}`, position: 'relative', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', top: 3, left: settings.annotate ? 21 : 3, width: 14, height: 14, borderRadius: '50%', background: 'var(--bg-secondary)', transition: 'left 0.2s ease' }} />
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Annotate output</span>
            </label>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className="btn-primary" onClick={handleAnalyze}
          style={{ width: '100%', padding: '14px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span>◎</span> Start Analysis {files.length > 0 && `(${files.length} image${files.length > 1 ? 's' : ''})`}
        </motion.button>
      </GlassCard>
    </div>
  );
}
