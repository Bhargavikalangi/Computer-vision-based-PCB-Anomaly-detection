'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SEVERITY_COLORS = {
  critical: '#fc8181', high: '#ed8936', medium: '#f6e05e', low: '#48bb78'
};

export default function AnnotatedImageViewer({ imageUrl, defects = [], showOverlay, selectedDefect, onSelectDefect }) {
  const containerRef = useRef(null);
  const [imgDims, setImgDims] = useState({ w: 1, h: 1, natural_w: 1, natural_h: 1 });
  const [hoveredDefect, setHoveredDefect] = useState(null);

  const handleImageLoad = (e) => {
    setImgDims({
      w: e.target.clientWidth, h: e.target.clientHeight,
      natural_w: e.target.naturalWidth, natural_h: e.target.naturalHeight,
    });
  };

  const scale = { x: imgDims.w / imgDims.natural_w, y: imgDims.h / imgDims.natural_h };

  return (
    <div ref={containerRef} style={{ position: 'relative', background: 'rgba(0,0,0,0.4)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Scan line animation */}
      <motion.div
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', left: 0, right: 0, height: 2, zIndex: 5, pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent, rgba(99,179,237,0.6), transparent)',
          boxShadow: '0 0 10px rgba(99,179,237,0.4)',
        }}
      />

      <img
        src={imageUrl}
        alt="PCB analysis"
        onLoad={handleImageLoad}
        style={{ width: '100%', display: 'block', borderRadius: 14 }}
        onError={e => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGQxMTE3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2M2IzZWQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPltQQ0IgSW1hZ2VdPC90ZXh0Pjwvc3ZnPg=='; }}
      />

      {/* Bounding boxes */}
      <AnimatePresence>
        {showOverlay && defects.map((defect) => {
          const [x, y, w, h] = defect.bbox || [0, 0, 50, 50];
          const color = SEVERITY_COLORS[defect.severity] || '#63b3ed';
          const isSelected = selectedDefect?.id === defect.id;
          const isHovered = hoveredDefect === defect.id;

          return (
            <motion.div
              key={defect.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onSelectDefect(isSelected ? null : defect)}
              onMouseEnter={() => setHoveredDefect(defect.id)}
              onMouseLeave={() => setHoveredDefect(null)}
              style={{
                position: 'absolute',
                left: x * scale.x, top: y * scale.y,
                width: w * scale.x, height: h * scale.y,
                border: `2px solid ${color}`,
                borderRadius: 4, cursor: 'pointer',
                background: isSelected || isHovered ? `${color}20` : `${color}10`,
                boxShadow: isSelected ? `0 0 15px ${color}60` : 'none',
                transition: 'all 0.15s ease',
                zIndex: isSelected ? 4 : 3,
              }}
            >
              {/* Label */}
              <div style={{
                position: 'absolute', top: -24, left: -1,
                background: color, color: '#000',
                fontSize: '0.65rem', fontWeight: 700,
                padding: '2px 6px', borderRadius: '4px 4px 0 0',
                whiteSpace: 'nowrap',
              }}>
                {defect.type} {defect.confidence?.toFixed(0)}%
              </div>

              {/* Corner markers */}
              {['0 0', '100% 0', '0 100%', '100% 100%'].map((pos, i) => (
                <motion.div key={i} animate={{ opacity: isSelected ? [1, 0.3, 1] : 1 }} transition={{ duration: 1, repeat: isSelected ? Infinity : 0 }}
                  style={{ position: 'absolute', top: pos.includes('100%') ? 'auto' : -1, bottom: pos.includes('100%') ? -1 : 'auto', left: pos.includes('100%') && !pos.startsWith('100%') ? -1 : 'auto', right: pos.startsWith('100%') ? -1 : 'auto', width: 6, height: 6, background: color, borderRadius: 1 }} />
              ))}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
