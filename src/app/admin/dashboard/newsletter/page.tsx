'use client'

import { useEffect, useState } from 'react'
import { Send, Users, CheckCircle, XCircle, FileText } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface Article {
  slug: string
  title: string
  excerpt: string
  category: { name: string }
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; active: boolean }[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [subject, setSubject] = useState('')
  const [heading, setHeading] = useState('')
  const [body, setBody] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [selectedArticle, setSelectedArticle] = useState('')
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/subscribers').then((r) => r.json()),
      fetch('/api/articles?published=true&limit=50').then((r) => r.json()),
    ])
      .then(([subs, arts]) => {
        setSubscribers(Array.isArray(subs) ? subs : [])
        setArticles(arts.articles || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const activeCount = subscribers.filter((s) => s.active).length

  const selectedArticleData = articles.find((a) => a.slug === selectedArticle)

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setResult({ type: 'error', msg: 'Subject and body are required' })
      return
    }
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          heading,
          body,
          ctaText,
          ctaUrl,
          articleSlug: selectedArticle || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ type: 'success', msg: `Sent to ${data.sent} subscribers. ${data.failed > 0 ? `${data.failed} failed.` : ''}` })
        setSubject('')
        setHeading('')
        setBody('')
        setCtaText('')
        setCtaUrl('')
        setSelectedArticle('')
      } else {
        setResult({ type: 'error', msg: data.error || 'Failed to send' })
      }
    } catch {
      setResult({ type: 'error', msg: 'Something went wrong' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Newsletter</h1>
              <p className={styles.subtitle}>
                <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />
                {activeCount} active subscriber{activeCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </AnimatedSection>

        {result && (
          <div className={`${styles.toast} ${result.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
            {result.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {result.msg}
          </div>
        )}

        <AnimatedSection delay={0.1}>
          <div className={styles.form}>
            <div className="form-group">
              <label className="form-label">Email Subject</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. New article: Building Scalable Microservices"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Heading (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Fresh from the blog"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Body</label>
              <textarea
                className="form-input"
                rows={8}
                placeholder="Write your newsletter content here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', lineHeight: 1.6, resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />
                Attach Article (optional)
              </label>
              <select
                className="form-input"
                value={selectedArticle}
                onChange={(e) => setSelectedArticle(e.target.value)}
              >
                <option value="">No article attached</option>
                {articles.map((a) => (
                  <option key={a.slug} value={a.slug}>{a.title} ({a.category.name})</option>
                ))}
              </select>
              {selectedArticleData && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                  &quot;Read Blog&quot; button will link to this article
                </p>
              )}
            </div>

            <div className={styles.ctaRow}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Button Text (if no article)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Read More"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  disabled={!!selectedArticle}
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Button URL (if no article)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://yoursite.com/articles"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  disabled={!!selectedArticle}
                />
              </div>
            </div>

            <div className={styles.preview}>
              <h3 className={styles.previewTitle}>Preview</h3>
              <div className={styles.emailPreview}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>Subject:</strong>{' '}
                  <span>{subject || '(no subject)'}</span>
                </div>
                <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    {heading || 'DevAtlas Newsletter'}
                  </h2>
                </div>
                <div style={{ lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
                  {body ? body.split('\n').map((line, i) => <p key={i} style={{ margin: '0.5rem 0' }}>{line}</p>) : <p style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>Write your email body above...</p>}
                </div>
                {selectedArticleData && (
                  <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', marginBottom: '0.375rem' }}>New Article</p>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.375rem' }}>{selectedArticleData.title}</h4>
                    {selectedArticleData.excerpt && <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', margin: '0 0 0.75rem' }}>{selectedArticleData.excerpt}</p>}
                    <span style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'var(--color-text)', color: 'var(--color-bg)', borderRadius: '6px', fontWeight: 500, fontSize: '0.8125rem' }}>Read Blog</span>
                  </div>
                )}
                {ctaText && ctaUrl && !selectedArticle && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: 'var(--color-text)', color: 'var(--color-bg)', borderRadius: '8px', fontWeight: 500, fontSize: '0.875rem' }}>
                      {ctaText}
                    </span>
                  </div>
                )}
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-light)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                  Unsubscribe link appears at the bottom of every email
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button onClick={handleSend} className="btn btn-primary" disabled={sending || !subject.trim() || !body.trim() || activeCount === 0}>
                <Send size={16} /> {sending ? 'Sending...' : `Send to ${activeCount} subscriber${activeCount !== 1 ? 's' : ''}`}
              </button>
            </div>

            {activeCount === 0 && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
                No active subscribers yet. People will appear here after subscribing via the blog.
              </p>
            )}
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
