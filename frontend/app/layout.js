import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import BackgroundMesh from '@/components/ui/BackgroundMesh';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export const metadata = {
  title: 'PCB Vision — Anomaly Detection System',
  description: 'AI-powered PCB defect detection using computer vision',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  // suppressHydrationWarning on <html>: extensions may inject attrs (speedupyoutubeads, etc.) and cause hydration noise
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="theme-light">
        <ThemeProvider>
          <BackgroundMesh />
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <TopBar />
              <main
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '24px',
                  paddingLeft: '28px',
                  color: 'var(--text-primary)',
                }}
              >
                {children}
              </main>
            </div>
          </div>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--bg-secondary)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                borderRadius: '12px',
                fontFamily: 'var(--font-body)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
