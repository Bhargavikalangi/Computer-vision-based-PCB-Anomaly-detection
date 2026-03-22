'use client';

import { useEffect } from 'react';

function getFriendlyError(error) {
  const msg = String(error?.message || '').toLowerCase();
  if (msg.includes('network') || msg.includes('timeout') || msg.includes('failed to fetch')) {
    return 'API connection failed. Backend service may be offline or unreachable.';
  }
  if (msg.includes('500') || msg.includes('internal')) {
    return 'Server error occurred while processing your request.';
  }
  return 'Unexpected application error occurred.';
}

export default function Error({ error, reset }) {
  useEffect(() => {
    // Keep logging lightweight so debugging info is available in browser console.
    console.error('Route error boundary:', error);
  }, [error]);

  const friendly = getFriendlyError(error);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div className="glass" style={{ maxWidth: 780, width: '100%', padding: 28 }}>
        <p style={{ margin: 0, color: 'var(--text-muted)', letterSpacing: 1.2, fontSize: 12 }}>APPLICATION ERROR</p>
        <h1 style={{ marginTop: 8, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ marginTop: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{friendly}</p>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 13 }}>
          Details: {error?.message || 'No additional error details available.'}
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            style={{
              display: 'inline-block',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
