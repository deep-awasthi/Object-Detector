'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit, Check, X } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface Tag {
  id: string
  name: string
  slug: string
  _count: { articles: number }
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [newTagName, setNewTagName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    fetchTags()
  }, [])

  function fetchTags() {
    fetch('/api/tags')
      .then((r) => r.json())
      .then((data) => setTags(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  async function handleAdd() {
    if (!newTagName.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() }),
      })
      if (res.ok) {
        setNewTagName('')
        fetchTags()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to add tag')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this tag?')) return
    try {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTags((prev) => prev.filter((t) => t.id !== id))
      }
    } catch {
      alert('Failed to delete tag')
    }
  }

  async function handleUpdate(id: string) {
    if (!editingName.trim()) return
    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      })
      if (res.ok) {
        setEditingId(null)
        setEditingName('')
        fetchTags()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to update tag')
      }
    } catch {
      alert('Failed to update tag')
    }
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Tags</h1>
              <p className={styles.subtitle}>{tags.length} tags total</p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className={styles.addForm}>
            <input
              type="text"
              className="form-input"
              placeholder="New tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} className="btn btn-primary" disabled={adding || !newTagName.trim()}>
              <Plus size={16} /> {adding ? 'Adding...' : 'Add Tag'}
            </button>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.colName}>Name</span>
              <span className={styles.colSlug}>Slug</span>
              <span className={styles.colArticles}>Articles</span>
              <span className={styles.colActions}>Actions</span>
            </div>
            {loading ? (
              <p style={{ padding: '2rem', color: 'var(--color-text-tertiary)' }}>Loading tags...</p>
            ) : tags.length === 0 ? (
              <p style={{ padding: '2rem', color: 'var(--color-text-tertiary)' }}>No tags yet. Create your first one!</p>
            ) : (
              tags.map((tag) => (
                <div key={tag.id} className={styles.tableRow}>
                  <span className={styles.colName}>
                    {editingId === tag.id ? (
                      <input
                        type="text"
                        className="form-input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate(tag.id)}
                        autoFocus
                        style={{ padding: '0.375rem 0.625rem', fontSize: '0.875rem' }}
                      />
                    ) : (
                      <span className={styles.tagName}>{tag.name}</span>
                    )}
                  </span>
                  <span className={styles.colSlug}>{tag.slug}</span>
                  <span className={styles.colArticles}>{tag._count.articles}</span>
                  <span className={styles.colActions}>
                    {editingId === tag.id ? (
                      <>
                        <button onClick={() => handleUpdate(tag.id)} className={styles.actionBtn} title="Save">
                          <Check size={14} />
                        </button>
                        <button onClick={() => { setEditingId(null); setEditingName('') }} className={styles.actionBtn} title="Cancel">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(tag.id); setEditingName(tag.name) }} className={styles.actionBtn} title="Edit">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(tag.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
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
