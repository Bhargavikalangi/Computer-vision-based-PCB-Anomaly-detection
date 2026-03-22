import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found — PCB Vision',
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div className="glass" style={{ maxWidth: 720, width: '100%', padding: 28, textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'var(--text-muted)', letterSpacing: 1.2, fontSize: 12 }}>ERROR 404</p>
        <h1 style={{ marginTop: 8, marginBottom: 10 }}>Page not found</h1>
        <p style={{ marginTop: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          The URL you entered does not match any page in this project.
          Please check the address or continue from dashboard.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            marginTop: 12,
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
        </Link>
      </div>
    </div>
  );
}
