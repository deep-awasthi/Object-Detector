'use client'

import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface Settings {
  siteName: string
  tagline: string
  description: string
  contactEmail: string
  github: string
  linkedin: string
  medium: string
  twitter: string
  seoDefaultTitle: string
  seoDefaultDesc: string
  analyticsEnabled: boolean
  newsletterEnabled: boolean
  emailingEnabled: boolean
}

const defaults: Settings = {
  siteName: 'DevAtlas',
  tagline: 'Crafting knowledge for engineers.',
  description: '',
  contactEmail: '',
  github: '',
  linkedin: '',
  medium: '',
  twitter: '',
  seoDefaultTitle: '',
  seoDefaultDesc: '',
  analyticsEnabled: false,
  newsletterEnabled: true,
  emailingEnabled: false,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.siteName) {
          const social = data.socialLinks || {}
          setSettings({
            siteName: data.siteName || defaults.siteName,
            tagline: data.tagline || defaults.tagline,
            description: data.description || '',
            contactEmail: data.contactEmail || '',
            github: social.github || '',
            linkedin: social.linkedin || '',
            medium: social.medium || '',
            twitter: social.twitter || '',
            seoDefaultTitle: data.seoDefaultTitle || '',
            seoDefaultDesc: data.seoDefaultDesc || '',
            analyticsEnabled: data.analyticsEnabled ?? false,
            newsletterEnabled: data.newsletterEnabled ?? true,
            emailingEnabled: data.emailingEnabled ?? false,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function update<K extends keyof Settings>(field: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body = {
        siteName: settings.siteName,
        tagline: settings.tagline,
        description: settings.description || null,
        contactEmail: settings.contactEmail || null,
        socialLinks: {
          github: settings.github || null,
          linkedin: settings.linkedin || null,
          medium: settings.medium || null,
          twitter: settings.twitter || null,
        },
        seoDefaultTitle: settings.seoDefaultTitle || null,
        seoDefaultDesc: settings.seoDefaultDesc || null,
        analyticsEnabled: settings.analyticsEnabled,
        newsletterEnabled: settings.newsletterEnabled,
        emailingEnabled: settings.emailingEnabled,
      }
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setToast('Settings saved!')
        setTimeout(() => setToast(''), 3000)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to save')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '8rem 2rem', color: 'var(--color-text-secondary)' }}>Loading settings...</div>

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <h1 className={styles.title}>Settings</h1>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </AnimatedSection>

        {toast && (
          <div style={{ padding: '0.75rem 1rem', background: '#dcfce7', color: '#166534', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {toast}
          </div>
        )}

        <div className={styles.grid}>
          <AnimatedSection delay={0.1}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>General</h3>
              <div className="form-group">
                <label className="form-label">Site Name</label>
                <input type="text" className="form-input" value={settings.siteName} onChange={(e) => update('siteName', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tagline</label>
                <input type="text" className="form-input" value={settings.tagline} onChange={(e) => update('tagline', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={settings.description} onChange={(e) => update('description', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input type="email" className="form-input" value={settings.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} />
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.15}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Social Links</h3>
              <div className="form-group">
                <label className="form-label">GitHub</label>
                <input type="url" className="form-input" placeholder="https://github.com/username" value={settings.github} onChange={(e) => update('github', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn</label>
                <input type="url" className="form-input" placeholder="https://linkedin.com/in/username" value={settings.linkedin} onChange={(e) => update('linkedin', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Medium</label>
                <input type="url" className="form-input" placeholder="https://medium.com/@username" value={settings.medium} onChange={(e) => update('medium', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Twitter</label>
                <input type="url" className="form-input" placeholder="https://twitter.com/username" value={settings.twitter} onChange={(e) => update('twitter', e.target.value)} />
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>SEO Defaults</h3>
              <div className="form-group">
                <label className="form-label">Default Title</label>
                <input type="text" className="form-input" value={settings.seoDefaultTitle} onChange={(e) => update('seoDefaultTitle', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Default Description</label>
                <textarea className="form-input" rows={2} value={settings.seoDefaultDesc} onChange={(e) => update('seoDefaultDesc', e.target.value)} />
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.25}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Features</h3>
              <label className={styles.toggle}>
                <span>Enable Newsletter</span>
                <input type="checkbox" checked={settings.newsletterEnabled} onChange={(e) => update('newsletterEnabled', e.target.checked)} />
                <span className={styles.toggleSlider} />
              </label>
              <label className={styles.toggle}>
                <span>Enable Emailing</span>
                <input type="checkbox" checked={settings.emailingEnabled} onChange={(e) => update('emailingEnabled', e.target.checked)} />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  )
}
