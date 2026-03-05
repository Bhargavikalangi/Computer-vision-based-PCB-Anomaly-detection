import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import BackgroundMesh from '@/components/ui/BackgroundMesh';

export const metadata = {
  title: 'PCB Vision — Anomaly Detection System',
  description: 'AI-powered PCB defect detection using computer vision',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BackgroundMesh />
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <TopBar />
            <main style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              paddingLeft: '28px',
            }}>
              {children}
            </main>
          </div>
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(13, 17, 23, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.9)',
              borderRadius: '12px',
              fontFamily: 'DM Sans, sans-serif',
            },
          }}
        />
      </body>
    </html>
  );
}
