import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GRID_SIZE = 10;

const getColor = (val) => {
  if (val < 0.1) return 'var(--panel-bg)';
  if (val < 0.3) return `rgba(99,179,237,${val * 0.6})`;
  if (val < 0.6) return `rgba(246,224,94,${val * 0.7})`;
  if (val < 0.8) return `rgba(237,137,54,${val * 0.8})`;
  return `rgba(252,129,129,${val})`;
};

export default function DefectHeatmap() {
  const [heatmapData, setHeatmapData] = useState(new Array(GRID_SIZE * GRID_SIZE).fill(0));
  const [totalDefects, setTotalDefects] = useState(0);
  const [allDefects, setAllDefects] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [empty, setEmpty] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/results?limit=100')
      .then(r => r.json())
      .then(resultsData => {
        const analysesList = resultsData.items || [];
        setAnalyses(analysesList);
        const allDefs = analysesList.flatMap(a =>
          (a.defects || []).map(d => ({
            ...d,
            analysis_id: a.id,
            image_width: a.image_width,
            image_height: a.image_height,
          }))
        );
        setAllDefects(allDefs);
        setTotalDefects(allDefs.length);
        if (allDefs.length === 0) { setEmpty(true); return; }
        const grid = new Array(GRID_SIZE * GRID_SIZE).fill(0);
        allDefs.forEach(d => {
          const imgW = d.image_width || 640;
          const imgH = d.image_height || 480;
          const bx = d.bbox_x ?? d.bbox?.[0] ?? 0;
          const by = d.bbox_y ?? d.bbox?.[1] ?? 0;
          const bw = d.bbox_w ?? d.bbox?.[2] ?? 50;
          const bh = d.bbox_h ?? d.bbox?.[3] ?? 50;
          const cx = (bx + bw / 2) / imgW;
          const cy = (by + bh / 2) / imgH;
          const gx = Math.min(GRID_SIZE - 1, Math.floor(cx * GRID_SIZE));
          const gy = Math.min(GRID_SIZE - 1, Math.floor(cy * GRID_SIZE));
          for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
              const dist = Math.sqrt((x - gx) ** 2 + (y - gy) ** 2);
              grid[y * GRID_SIZE + x] += Math.exp(-dist * 0.8);
            }
          }
        });
        const max = Math.max(...grid, 1);
        setHeatmapData(grid.map(v => v / max));
      })
      .catch(() => setEmpty(true));
  }, []);

  const getHotZones = () => {
    const zones = [];
    const quadrants = [
      { name: 'top-left', cells: [] }, { name: 'top-right', cells: [] },
      { name: 'bottom-left', cells: [] }, { name: 'bottom-right', cells: [] },
      { name: 'center', cells: [] },
    ];
    heatmapData.forEach((val, i) => {
      const x = i % GRID_SIZE;
      const y = Math.floor(i / GRID_SIZE);
      const cx = Math.abs(x - 4.5) < 2 && Math.abs(y - 4.5) < 2;
      if (cx) quadrants[4].cells.push(val);
      else if (x < 5 && y < 5) quadrants[0].cells.push(val);
      else if (x >= 5 && y < 5) quadrants[1].cells.push(val);
      else if (x < 5 && y >= 5) quadrants[2].cells.push(val);
      else quadrants[3].cells.push(val);
    });
    return quadrants.map(q => ({
      name: q.name,
      avg: q.cells.length ? q.cells.reduce((a, b) => a + b, 0) / q.cells.length : 0,
    })).sort((a, b) => b.avg - a.avg);
  };

  const handleInsight = async () => {
    if (showInsight) { setShowInsight(false); return; }
    setShowInsight(true);
    setLoadingInsight(true);
    setInsight('');

    try {
      const hotZones = getHotZones();
      const defectTypes = {};
      allDefects.forEach(d => {
        const t = d.defect_type || d.type || 'Unknown';
        defectTypes[t] = (defectTypes[t] || 0) + 1;
      });
      const topTypes = Object.entries(defectTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([t, c]) => `${t} (${c})`)
        .join(', ');

      const totalAnalyses = analyses.length;
      const failedAnalyses = analyses.filter(a => a.status === 'fail').length;
      const passRate = totalAnalyses ? ((totalAnalyses - failedAnalyses) / totalAnalyses * 100).toFixed(1) : 0;

      const prompt = `You are a PCB quality control expert explaining results to a non-technical factory manager.

Here is the defect heatmap data for ${totalAnalyses} PCB analyses:
- Total defects found: ${totalDefects}
- Pass rate: ${passRate}%
- Hottest zone (most defects): ${hotZones[0].name} area (intensity: ${(hotZones[0].avg * 100).toFixed(0)}%)
- Second hottest zone: ${hotZones[1].name} area (intensity: ${(hotZones[1].avg * 100).toFixed(0)}%)
- Coolest zone (least defects): ${hotZones[hotZones.length-1].name} area
- Most common defect types: ${topTypes || 'None yet'}

Write a simple 3-4 sentence summary that:
1. Explains WHERE on the PCBs defects are concentrated (use plain language like "top-left corner" not coordinates)
2. What the most common problems are
3. One practical suggestion for the factory to reduce defects
Keep it friendly, clear, and under 80 words. No bullet points, just natural paragraphs.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map(c => c.text || '').join('') || 'Could not generate insight.';
      setInsight(text);
    } catch (e) {
      setInsight('Could not load insight. Please check your connection and try again.');
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <div>
      {/* Header with bulb button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {totalDefects > 0 ? `${totalDefects} defect${totalDefects !== 1 ? 's' : ''} mapped` : 'No defects yet'}
        </span>
        {!empty && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInsight}
            title="Get AI explanation of this heatmap"
            style={{
              background: showInsight ? 'rgba(246,224,94,0.2)' : 'var(--panel-bg)',
              border: `1px solid ${showInsight ? 'rgba(246,224,94,0.5)' : 'var(--input-border)'}`,
              borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'all 0.2s ease',
              filter: showInsight ? 'drop-shadow(0 0 6px rgba(246,224,94,0.6))' : 'none',
            }}>
            ðŸ’¡
          </motion.button>
        )}
      </div>

      {/* AI Insight Panel */}
      <AnimatePresence>
        {showInsight && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 14 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: 'rgba(246,224,94,0.06)',
              border: '1px solid rgba(246,224,94,0.2)',
              borderRadius: 12, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>ðŸ’¡</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(246,224,94,0.9)' }}>AI Heatmap Insight</span>
              </div>
              {loadingInsight ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ width: 14, height: 14, border: '2px solid rgba(246,224,94,0.3)', borderTopColor: 'rgba(246,224,94,0.9)', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Analyzing heatmap...</span>
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {insight}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Heatmap grid */}
      {empty ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            No defects yet â€” heatmap populates after failed analyses
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: 3, marginBottom: 12 }}>
            {heatmapData.map((val, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.003 }}
                title={`Defect density: ${(val * 100).toFixed(0)}%`}
                style={{
                  aspectRatio: '1', borderRadius: 4,
                  background: getColor(val),
                  border: '1px solid var(--border-glass)',
                  cursor: 'pointer', transition: 'transform 0.15s ease',
                }}
                whileHover={{ scale: 1.4, zIndex: 1 }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--chart-muted)' }}>Low</span>
            <div style={{ height: 6, width: 120, borderRadius: 3, background: 'linear-gradient(90deg, rgba(99,179,237,0.4), rgba(246,224,94,0.7), rgba(237,137,54,0.8), rgba(252,129,129,1))' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--chart-muted)' }}>High</span>
          </div>
        </>
      )}
    </div>
  );
}
