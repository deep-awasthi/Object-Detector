import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = tab === 'login'
        ? await authApi.login(form.username, form.password)
        : await authApi.register(form.username, form.email, form.password)
      const { accessToken, refreshToken, user } = res.data
      login(accessToken, refreshToken, user)
      toast.success(`Welcome, ${user.username}!`)
      navigate('/chat')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      {/* Background orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={styles.card} className="glass fade-in">
        {/* Logo */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="15" fill="url(#lg)" opacity="0.15" />
              <path d="M8 16a8 8 0 1116 0 8 8 0 01-16 0z" stroke="url(#lg)" strokeWidth="1.5" fill="none" />
              <circle cx="16" cy="16" r="4" fill="url(#lg)" />
              <path d="M16 8v2M16 22v2M8 16H6M26 16h-2" stroke="url(#lg)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 style={styles.logo} className="gradient-text">DeepCloneAI</h1>
          <p style={styles.tagline}>Your local AI clone — private, personal, powerful.</p>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
              onClick={() => setTab(t)}
            >
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              className="input"
              type="text"
              placeholder="your-username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              minLength={3}
            />
          </div>

          {tab === 'register' && (
            <div style={styles.field} className="fade-in">
              <label style={styles.label}>Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                {tab === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              tab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {tab === 'register' && (
          <p style={styles.hint}>
            ⚡ Single-owner system — registration is only allowed once.
          </p>
        )}

        <div style={styles.privacyNote}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span>100% local • No cloud AI • Privacy first</span>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  orb1: {
    position: 'fixed',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
    top: -200,
    left: -100,
    pointerEvents: 'none',
  },
  orb2: {
    position: 'fixed',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
    bottom: -150,
    right: -100,
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: '40px 36px',
    position: 'relative',
    zIndex: 1,
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    marginBottom: 12,
    display: 'flex',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: 8,
  },
  tagline: {
    color: 'var(--text-secondary)',
    fontSize: 14,
  },
  tabs: {
    display: 'flex',
    background: 'var(--bg-primary)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  tab: {
    flex: 1,
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-sans)',
  },
  tabActive: {
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    color: 'var(--accent-warning)',
    textAlign: 'center',
    background: 'rgba(245,158,11,0.08)',
    padding: '8px 12px',
    borderRadius: 8,
  },
  privacyNote: {
    marginTop: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: 'var(--text-muted)',
    fontSize: 12,
  },
}
