export const metadata = {
  title: 'Project Explanation — PCB Vision',
  description: 'Flow chart and explanation of the PCB anomaly detection project.',
};

const flowSteps = [
  'User uploads PCB image in frontend',
  'Frontend sends image to FastAPI /api/v1/analyze',
  'Backend validates and stores uploaded file',
  'Detector preprocesses image and runs OpenCV rules',
  'Detected defects are saved to PostgreSQL',
  'Annotated image and metrics are returned to frontend',
  'Dashboard, results, history, and reports are updated',
];

const modules = [
  { name: 'Frontend (Next.js)', detail: 'Upload, dashboard, reports, history, settings, and result views.' },
  { name: 'Backend API (FastAPI)', detail: 'Accepts analysis requests and serves result/stat/report endpoints.' },
  { name: 'Detection Engine (OpenCV)', detail: 'Finds burn, corrosion, ESD/surface anomalies, and puncture-like defects.' },
  { name: 'Database (PostgreSQL)', detail: 'Stores analyses, defect records, report metadata, and timestamps.' },
  { name: 'Reporting', detail: 'Generates PDF reports with summary, per-analysis status, and defect details.' },
];

export default function ExplainPage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: 20 }}>
      <section className="glass" style={{ padding: 24 }}>
        <h1 style={{ marginTop: 0, marginBottom: 10 }}>PCB Vision Project Explanation</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          This project detects possible PCB anomalies from uploaded board images. The frontend provides the user workflow,
          while the backend runs the inspection pipeline, persists results, and serves analytics/reporting data.
        </p>
      </section>

      <section className="glass" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>System Flow Chart</h2>
        <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
          End-to-end flow from image upload to report-ready results:
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          {flowSteps.map((step, idx) => (
            <div key={step} style={{ display: 'grid', gap: 8 }}>
              <div
                style={{
                  border: '1px solid var(--border-glass)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  fontSize: 14,
                }}
              >
                <strong>Step {idx + 1}:</strong> {step}
              </div>
              {idx < flowSteps.length - 1 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1 }}>↓</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="glass" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Main Modules</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {modules.map((mod) => (
            <div
              key={mod.name}
              style={{
                border: '1px solid var(--border-glass)',
                borderRadius: 12,
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{mod.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{mod.detail}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
