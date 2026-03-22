'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0f1419', color: '#e6edf3', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 820,
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.04)',
              padding: 28,
            }}
          >
            <p style={{ margin: 0, color: '#9fb0c2', letterSpacing: 1.1, fontSize: 12 }}>PROJECT LEVEL FAILURE</p>
            <h1 style={{ marginTop: 8, marginBottom: 8 }}>Critical error in application</h1>
            <p style={{ marginTop: 0, color: '#c9d6e2', lineHeight: 1.7 }}>
              A global failure occurred while rendering the app. This can happen due to unexpected runtime issues,
              API-level crashes bubbling up, or configuration problems.
            </p>
            <p style={{ color: '#9fb0c2', fontSize: 13 }}>
              Details: {error?.message || 'No additional details available.'}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: '#e6edf3',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
