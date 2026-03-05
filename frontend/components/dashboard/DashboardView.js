'use client';
import { motion } from 'framer-motion';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import DefectTrendChart from '@/components/charts/DefectTrendChart';
import DefectDistributionChart from '@/components/charts/DefectDistributionChart';
import RecentAnalysisList from './RecentAnalysisList';
import DefectHeatmap from './DefectHeatmap';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import Link from 'next/link';

export default function DashboardView() {
  const { stats, loading } = useDashboardStats();

  const statCards = [
    { label: 'Total Analyses', value: stats?.total_analyses ?? 0, icon: '◎', color: '#63b3ed', change: 12, delay: 0 },
    { label: 'Defects Detected', value: stats?.total_defects ?? 0 ,icon: '⚠', color: '#fc8181', change: -8, delay: 0.05 },
    { label: 'Pass Rate', value: stats?.pass_rate ?? 0,nit: '%', icon: '✓', color: '#48bb78', change: 3, delay: 0.1 },
    { label: 'Avg Confidence', value: stats?.avg_confidence ?? 0, unit: '%', icon: '◈', color: '#9f7aea', change: 1, delay: 0.15 },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              fontWeight: 800,
              marginBottom: 6,
            }}
          >
            System <span className="gradient-text">Overview</span>
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
            }}
          >
            Real-time PCB anomaly detection metrics
          </p>
        </div>
        <Link href="/upload">
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span>⬆</span> New Analysis
          </motion.button>
        </Link>
      </motion.div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statCards.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <GlassCard delay={0.2}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                Defect Trend
              </h3>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                Last 30 days
              </p>
            </div>
          </div>
          <DefectTrendChart />
        </GlassCard>

        <GlassCard delay={0.25}>
          <div style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: 2,
              }}
            >
              Defect Types
            </h3>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              Distribution
            </p>
          </div>
          <DefectDistributionChart />
        </GlassCard>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <GlassCard delay={0.3}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            Recent Analyses
          </h3>
          <RecentAnalysisList />
        </GlassCard>

        <GlassCard delay={0.35}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            Defect Heatmap
          </h3>
          <DefectHeatmap />
        </GlassCard>
      </div>
    </div>
  );
}
