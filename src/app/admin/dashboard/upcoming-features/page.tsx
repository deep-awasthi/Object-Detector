'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit, Check, X, Rocket, Wrench } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface Feature {
  id: string
  title: string
  description: string
  status: string
  order: number
}

export default function UpcomingFeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Feature | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('coming-soon')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/upcoming-features')
      .then((r) => r.json())
      .then((data) => setFeatures(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openNew() {
    setEditing(null)
    setTitle('')
    setDescription('')
    setStatus('coming-soon')
    setShowForm(true)
  }

  function openEdit(feature: Feature) {
    setEditing(feature)
    setTitle(feature.title)
    setDescription(feature.description)
    setStatus(feature.status)
    setShowForm(true)
  }

  async function handleSave() {
    if (!title.trim() || !description.trim()) return
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch(`/api/upcoming-features/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title: title.trim(), description: description.trim(), status }),
        })
        if (res.ok) {
          const data = await res.json()
          setFeatures((prev) => prev.map((f) => f.id === editing.id ? { ...f, ...data } : f))
        }
      } else {
        const res = await fetch('/api/upcoming-features', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title: title.trim(), description: description.trim(), status }),
        })
        if (res.ok) {
          const data = await res.json()
          setFeatures((prev) => [...prev, data])
        }
      }
      setShowForm(false)
    } catch {
      alert('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    console.log('Delete clicked for id:', id)
    const res = await fetch(`/api/upcoming-features/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    console.log('Delete response:', res.status)
    if (res.ok) {
      setFeatures((prev) => prev.filter((f) => f.id !== id))
    }
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Upcoming Features</h1>
              <p className={styles.subtitle}>{features.length} features</p>
            </div>
            <button className="btn btn-primary" onClick={openNew}>
              <Plus size={16} /> Add Feature
            </button>
          </div>
        </AnimatedSection>

        {showForm && (
          <AnimatedSection>
            <div className={styles.form}>
              <h3 className={styles.formTitle}>{editing ? 'Edit Feature' : 'New Feature'}</h3>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input type="text" className="form-input" placeholder="e.g. Comments System" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} placeholder="Brief description of the feature..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <div className={styles.statusButtons}>
                  <button type="button" className={`${styles.statusBtn} ${status === 'coming-soon' ? styles.statusBtnActive : ''}`} onClick={() => setStatus('coming-soon')}>
                    <Rocket size={14} /> Coming Soon
                  </button>
                  <button type="button" className={`${styles.statusBtn} ${status === 'in-development' ? styles.statusBtnActive : ''}`} onClick={() => setStatus('in-development')}>
                    <Wrench size={14} /> In Development
                  </button>
                </div>
              </div>
              <div className={styles.formActions}>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving || !title.trim() || !description.trim()}>
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Feature'}
                </button>
              </div>
            </div>
          </AnimatedSection>
        )}

        <AnimatedSection delay={0.1}>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.colTitle}>Feature</span>
              <span className={styles.colStatus}>Status</span>
              <span className={styles.colActions}>Actions</span>
            </div>
            {loading ? (
              <p style={{ padding: '2rem', color: 'var(--color-text-tertiary)' }}>Loading...</p>
            ) : features.length === 0 ? (
              <p style={{ padding: '2rem', color: 'var(--color-text-tertiary)' }}>No upcoming features yet. Add your first one!</p>
            ) : (
              features.map((feature) => (
                <div key={feature.id} className={styles.tableRow}>
                  <span className={styles.colTitle}>
                    <span className={styles.featureTitle}>{feature.title}</span>
                    <span className={styles.featureDesc}>{feature.description}</span>
                  </span>
                  <span className={styles.colStatus}>
                    <span className={`${styles.statusTag} ${feature.status === 'in-development' ? styles.inDev : styles.comingSoon}`}>
                      {feature.status === 'in-development' ? <><Wrench size={12} /> In Development</> : <><Rocket size={12} /> Coming Soon</>}
                    </span>
                  </span>
                  <span className={styles.colActions}>
                    <button onClick={() => openEdit(feature)} className={styles.actionBtn} title="Edit">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(feature.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
