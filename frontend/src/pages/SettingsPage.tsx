import React from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()



  const handleLogoutAll = async () => {
    try {
      await authApi.logout()
      logout()
      navigate('/login')
      toast.success('Logged out from all devices')
    } catch {
      toast.error('Failed to logout')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>⚙️ Settings</h1>
        <p style={styles.subtitle}>Account, security, and application configuration</p>
      </div>

      {/* Account Section */}
      <section style={styles.section} className="card">
        <h2 style={styles.sectionTitle}>👤 Account</h2>
        <div style={styles.infoGrid}>
          <InfoItem label="Username" value={user?.username || '—'} />
          <InfoItem label="Email" value={user?.email || '—'} />
          <InfoItem label="Role" value={user?.role || '—'} />
          <InfoItem label="Account Type" value="Single Owner" />
        </div>
      </section>

      {/* AI Configuration */}
      <section style={styles.section} className="card">
        <h2 style={styles.sectionTitle}>🤖 AI Configuration</h2>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          AI settings are configured via <code>application.yml</code> or environment variables.
          Restart the API to apply changes.
        </div>
        <div style={styles.configGrid}>
          <ConfigRow name="OLLAMA_BASE_URL" desc="Ollama server URL" default="http://localhost:11434" />
          <ConfigRow name="OLLAMA_DEFAULT_MODEL" desc="Default chat model" default="qwen2.5:latest" />
          <ConfigRow name="OLLAMA_EMBEDDING_MODEL" desc="Embedding model" default="nomic-embed-text:latest" />
          <ConfigRow name="QDRANT_HOST" desc="Qdrant vector DB host" default="localhost" />
          <ConfigRow name="JWT_SECRET" desc="JWT signing secret (change in production!)" default="[random]" sensitive />
          <ConfigRow name="JWT_ACCESS_EXPIRY_MS" desc="Access token TTL" default="900000 (15 min)" />
          <ConfigRow name="CORS_ORIGINS" desc="Allowed frontend origins" default="http://localhost:3000" />
          <ConfigRow name="STORAGE_PATH" desc="File upload directory" default="./data/uploads" />
        </div>
      </section>

      {/* Security Section */}
      <section style={styles.section} className="card">
        <h2 style={styles.sectionTitle}>🔐 Security</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={styles.securityItem}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>Logout from all devices</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Revokes all refresh tokens across all registered devices.
              </div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={handleLogoutAll}>
              Logout All
            </button>
          </div>
        </div>
      </section>

      {/* Cloudflare Tunnel */}
      <section style={styles.section} className="card">
        <h2 style={styles.sectionTitle}>🌐 Remote Access (Cloudflare Tunnel)</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Access DeepCloneAI securely from anywhere — no port forwarding needed.
        </p>
        <div style={styles.codeBlock}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Install and run Cloudflare Tunnel:</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><span style={{ color: 'var(--accent-primary)' }}>$</span> brew install cloudflare/cloudflare/cloudflared</div>
            <div><span style={{ color: 'var(--accent-primary)' }}>$</span> cloudflared tunnel --url http://localhost:8080</div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          This creates a secure HTTPS URL for your DeepCloneAI instance without opening any firewall ports.
        </p>
      </section>

      {/* About */}
      <section style={styles.section} className="card">
        <h2 style={styles.sectionTitle}>ℹ️ About</h2>
        <div style={styles.infoGrid}>
          <InfoItem label="Version" value="1.0.0" />
          <InfoItem label="Backend" value="Spring Boot 3.3 / Java 21" />
          <InfoItem label="AI Runtime" value="Ollama (Local)" />
          <InfoItem label="Vector DB" value="Qdrant" />
          <InfoItem label="Database" value="PostgreSQL 16" />
          <InfoItem label="Cloud AI APIs" value="None — 100% Local 🔒" />
        </div>
      </section>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
    </div>
  )
}

function ConfigRow({ name, desc, default: def, sensitive }: {
  name: string; desc: string; default: string; sensitive?: boolean
}) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <code style={{ fontSize: 12, color: 'var(--accent-tertiary)' }}>{name}</code>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
        </div>
        <div style={{ fontSize: 12, color: sensitive ? 'var(--accent-warning)' : 'var(--text-secondary)', flexShrink: 0 }}>
          {def}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, overflowY: 'auto', height: '100%' },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700 },
  subtitle: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 },
  section: { marginBottom: 20, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 },
  configGrid: { display: 'flex', flexDirection: 'column' },
  securityItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  codeBlock: { background: 'var(--bg-tertiary)', borderRadius: 10, padding: '12px 16px' },
}
