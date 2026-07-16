import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/client'
import { useAuthStore } from '../store/authStore'

interface Summary {
  totalConversations: number; totalMessages: number; totalMemories: number
  totalDocuments: number; totalTokensUsed: number; averageLatencyMs: number
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery<{ data: Summary }>({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsApi.getSummary(),
  })
  const summary = data?.data

  const stats = [
    { label: 'Conversations', value: summary?.totalConversations ?? 0, icon: '💬', color: '#6366f1' },
    { label: 'Memories', value: summary?.totalMemories ?? 0, icon: '🧠', color: '#8b5cf6' },
    { label: 'Documents', value: summary?.totalDocuments ?? 0, icon: '📄', color: '#06b6d4' },
    { label: 'Tokens Used', value: (summary?.totalTokensUsed ?? 0).toLocaleString(), icon: '⚡', color: '#10b981' },
    { label: 'Avg Latency', value: summary?.averageLatencyMs ? `${(summary.averageLatencyMs / 1000).toFixed(1)}s` : '—', icon: '⏱', color: '#f59e0b' },
  ]

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title} className="gradient-text">
            Good {getGreeting()}, {user?.username}! 👋
          </h1>
          <p style={styles.subtitle}>Your AI clone is ready. Everything runs locally.</p>
        </div>
        <div style={styles.statusBadge} className="badge badge-success">
          ● Local AI Active
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className="card" style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: `${stat.color}20`, color: stat.color }}>
              <span style={{ fontSize: 22 }}>{stat.icon}</span>
            </div>
            <div>
              <div style={isLoading ? { animation: 'pulse 1s infinite' } : {}}>
                <div style={{ ...styles.statValue, color: stat.color }}>
                  {isLoading ? '...' : stat.value}
                </div>
              </div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionsGrid}>
          {quickActions.map(action => (
            <a key={action.label} href={action.href} style={styles.actionCard} className="card">
              <span style={{ fontSize: 28 }}>{action.icon}</span>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{action.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{action.desc}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Privacy Notice */}
      <div style={styles.privacyBanner} className="glass">
        <div style={{ fontSize: 24 }}>🔒</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>100% Local & Private</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            All AI processing happens on your machine. No data is ever sent to OpenAI, Anthropic, Google, or any cloud AI service.
          </div>
        </div>
      </div>
    </div>
  )
}

const quickActions = [
  { label: 'Start Chatting', icon: '💬', href: '/chat', desc: 'Talk with your AI clone' },
  { label: 'Add Memory', icon: '🧠', href: '/memories', desc: 'Teach your AI about yourself' },
  { label: 'Upload Document', icon: '📄', href: '/documents', desc: 'Index files for RAG' },
  { label: 'Edit Personality', icon: '🎭', href: '/personality', desc: 'Shape your AI\'s style' },
  { label: 'Search', icon: '🔍', href: '/search', desc: 'Search all your content' },
  { label: 'Analytics', icon: '📊', href: '/analytics', desc: 'View usage statistics' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, overflowY: 'auto', height: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  title: { fontSize: 26, fontWeight: 700, marginBottom: 6 },
  subtitle: { color: 'var(--text-secondary)', fontSize: 14 },
  statusBadge: { fontSize: 12, flexShrink: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 },
  statCard: { display: 'flex', alignItems: 'center', gap: 14, padding: 16 },
  statIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontSize: 22, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 12, color: 'var(--text-muted)', marginTop: 4 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 16 },
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 },
  actionCard: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: 16, textDecoration: 'none', color: 'inherit', cursor: 'pointer' },
  privacyBanner: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16 },
}
