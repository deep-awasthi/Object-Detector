import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/client'

interface Summary {
  totalConversations: number
  totalMessages: number
  totalMemories: number
  totalDocuments: number
  totalTokensUsed: number
  averageLatencyMs: number
  embeddingCount: number
  topModel: { modelId: string; messageCount: number } | null
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<{ data: Summary }>({
    queryKey: ['analytics'],
    queryFn: () => analyticsApi.getSummary(),
    refetchInterval: 30000,
  })

  const s = data?.data

  const metrics = [
    {
      label: 'Total Conversations',
      value: s?.totalConversations ?? 0,
      icon: '💬',
      color: '#6366f1',
      description: 'All-time chat sessions',
    },
    {
      label: 'Total Memories',
      value: s?.totalMemories ?? 0,
      icon: '🧠',
      color: '#8b5cf6',
      description: 'Facts stored in memory engine',
    },
    {
      label: 'Documents Indexed',
      value: s?.totalDocuments ?? 0,
      icon: '📄',
      color: '#06b6d4',
      description: 'Files chunked and vectorized',
    },
    {
      label: 'Total Tokens Used',
      value: (s?.totalTokensUsed ?? 0).toLocaleString(),
      icon: '⚡',
      color: '#10b981',
      description: 'Approximate token consumption',
    },
    {
      label: 'Avg Response Time',
      value: s?.averageLatencyMs
        ? `${(s.averageLatencyMs / 1000).toFixed(2)}s`
        : '—',
      icon: '⏱',
      color: '#f59e0b',
      description: 'Mean AI response latency',
    },
    {
      label: 'Vector Embeddings',
      value: (s?.embeddingCount ?? 0).toLocaleString(),
      icon: '🔮',
      color: '#ec4899',
      description: 'Vectors stored in Qdrant',
    },
  ]

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📊 Analytics</h1>
          <p style={styles.subtitle}>Usage statistics and performance metrics</p>
        </div>
        <div className="badge badge-primary" style={{ fontSize: 12 }}>
          Updates every 30s
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={styles.grid}>
        {metrics.map(metric => (
          <div key={metric.label} className="card" style={styles.metricCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${metric.color}18`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}
              >
                {metric.icon}
              </div>
              {isLoading && (
                <div style={{
                  width: 60, height: 28, borderRadius: 8,
                  background: 'var(--bg-tertiary)', animation: 'pulse 1.5s infinite',
                }} />
              )}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: metric.color, lineHeight: 1 }}>
                {isLoading ? '...' : metric.value}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{metric.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                {metric.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Info */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>System Information</h2>
        <div style={styles.infoGrid}>
          <InfoRow label="AI Runtime" value="Ollama (Local)" status="active" />
          <InfoRow label="Embedding Model" value="nomic-embed-text" status="active" />
          <InfoRow label="Vector Database" value="Qdrant" status="active" />
          <InfoRow label="Primary Database" value="PostgreSQL 16" status="active" />
          <InfoRow label="Cloud AI APIs" value="None — 100% Local" status="safe" />
          <InfoRow label="Data Privacy" value="All processing on-device" status="safe" />
        </div>
      </div>

      {/* Privacy Section */}
      <div style={styles.privacyBanner} className="glass">
        <div style={{ fontSize: 28 }}>🛡️</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Privacy Guaranteed</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Zero data leaves your machine. No telemetry, no cloud sync, no third-party AI calls.
            Your conversations, memories, and documents are stored exclusively on your device.
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  label, value, status,
}: { label: string; value: string; status: 'active' | 'safe' | 'warning' }) {
  const colors = { active: '#10b981', safe: '#6366f1', warning: '#f59e0b' }
  return (
    <div style={styles.infoRow} className="card">
      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[status] }} />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, overflowY: 'auto', height: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 700 },
  subtitle: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16, marginBottom: 32,
  },
  metricCard: { padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 16 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  infoRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px',
  },
  privacyBanner: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '20px 24px', borderRadius: 16,
  },
}
