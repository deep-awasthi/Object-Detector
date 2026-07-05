'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface Category {
  id: string
  name: string
  slug: string
  color: string
  enabled: boolean
  _count?: { articles: number }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', color: '#3B82F6', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : data.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openNew() {
    setEditing(null)
    setForm({ name: '', slug: '', color: '#3B82F6', description: '' })
    setShowModal(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setForm({ name: cat.name, slug: cat.slug, color: cat.color, description: '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        color: form.color,
        description: form.description || null,
        enabled: true,
        order: editing ? undefined : categories.length,
      }
      const url = editing ? `/api/categories/${editing.slug}` : '/api/categories'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        if (editing) {
          setCategories((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...data } : c))
        } else {
          setCategories((prev) => [...prev, { ...data, _count: { articles: 0 } }])
        }
        setShowModal(false)
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

  async function handleDelete(cat: Category) {
    if (!confirm(`Delete category "${cat.name}"?`)) return
    const res = await fetch(`/api/categories/${cat.slug}`, { method: 'DELETE' })
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id))
    }
  }

  async function handleToggleEnabled(cat: Category) {
    const res = await fetch(`/api/categories/${cat.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cat.name, slug: cat.slug, color: cat.color, enabled: !cat.enabled }),
    })
    if (res.ok) {
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, enabled: !c.enabled } : c))
    }
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Categories</h1>
              <p className={styles.subtitle}>{categories.length} categories</p>
            </div>
            <button className="btn btn-primary" onClick={openNew}>
              <Plus size={16} /> New Category
            </button>
          </div>
        </AnimatedSection>

        {loading ? (
          <p style={{ color: 'var(--color-text-tertiary)', padding: '2rem 0' }}>Loading...</p>
        ) : (
          <div className={styles.grid}>
            {categories.map((cat, i) => (
              <AnimatedSection key={cat.id} delay={i * 0.05}>
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardColor} style={{ background: cat.color }} />
                    <div className={styles.cardInfo}>
                      <h3 className={styles.cardName}>{cat.name}</h3>
                      <p className={styles.cardSlug}>/{cat.slug}</p>
                    </div>
                    <div className={styles.cardBadge}>{cat._count?.articles || 0}</div>
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.actionBtn} onClick={() => openEdit(cat)}>
                      <Edit size={14} /> Edit
                    </button>
                    <button className={styles.actionBtn} onClick={() => handleToggleEnabled(cat)}>
                      {cat.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                      {cat.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(cat)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        )}

        {showModal && (
          <div className={styles.modal} onClick={() => setShowModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>{editing ? 'Edit Category' : 'New Category'}</h2>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Slug</label>
                <input type="text" className="form-input" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="auto-generated from name" />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <input type="color" className="form-input" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} style={{ height: '44px', padding: '4px' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
