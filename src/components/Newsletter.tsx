'use client'

import { useState, useEffect } from 'react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [newsletterEnabled, setNewsletterEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setNewsletterEnabled(data.newsletterEnabled ?? true)
      })
      .catch(() => setNewsletterEnabled(false))
  }, [])

  if (newsletterEnabled === null || !newsletterEnabled) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.ok) {
        setStatus('success')
        setMessage('You\'re subscribed!')
        setEmail('')
      } else {
        const data = await res.json()
        setStatus('error')
        setMessage(data.error || 'Something went wrong')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong')
    }
    setTimeout(() => { setStatus('idle'); setMessage('') }, 3000)
  }

  return (
    <div style={{ textAlign: 'center', padding: '3rem 0', borderTop: '1px solid var(--color-border-light)', marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Enjoyed this article?</h3>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>Get notified when I publish new articles.</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', maxWidth: '400px', margin: '0 auto' }}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
          }}
        />
        <button type="submit" disabled={status === 'loading'} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
      {message && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: status === 'success' ? '#10B981' : '#EF4444' }}>
          {message}
        </p>
      )}
    </div>
  )
}
