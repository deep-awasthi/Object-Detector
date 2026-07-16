import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { memoryApi } from '../api/client'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface Memory {
  id: string; content: string; type: string; importance: number
  tags: string | null; pinned: boolean; createdAt: string
}

const MEMORY_TYPES = ['PERMANENT', 'TEMPORARY', 'PREFERENCE', 'INTEREST', 'CONVERSATION']
const TYPE_COLORS: Record<string, string> = {
  PERMANENT: '#6366f1', TEMPORARY: '#f59e0b', PREFERENCE: '#10b981',
  INTEREST: '#06b6d4', CONVERSATION: '#8b5cf6',
}

export default function MemoriesPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ content: '', type: 'PERMANENT', importance: 5, tags: '', pinned: false })
  const [page] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['memories', page],
    queryFn: () => memoryApi.list(page, 20).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => memoryApi.create(form).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memories'] })
      setShowCreate(false)
      setForm({ content: '', type: 'PERMANENT', importance: 5, tags: '', pinned: false })
      toast.success('Memory created and indexed!')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) =>
      memoryApi.update(id, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memories'] })
      setEditingId(null)
      toast.success('Memory updated!')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => memoryApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memories'] })
      toast.success('Memory deleted')
    },
  })

  const memories: Memory[] = data?.content || []

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🧠 Memories</h1>
          <p style={styles.subtitle}>What your AI clone knows and remembers about you</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Add Memory
        </button>
      </div>

      {/* Create/Edit Form */}
      {(showCreate || editingId) && (
        <div className="card fade-in" style={styles.form}>
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>
            {editingId ? 'Edit Memory' : 'New Memory'}
          </h3>
          <div style={styles.formGrid}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={styles.label}>Content</label>
              <textarea
                className="input"
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                placeholder="e.g., I love building AI systems and working with Java..."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={styles.label}>Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {MEMORY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Importance (1–10): {form.importance}</label>
              <input type="range" min={1} max={10} value={form.importance}
                onChange={e => setForm({ ...form, importance: +e.target.value })}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
            </div>
            <div>
              <label style={styles.label}>Tags (comma-separated)</label>
              <input className="input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="work, personal, hobby" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="pinned" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} style={{ accentColor: 'var(--accent-primary)' }} />
              <label htmlFor="pinned" style={{ cursor: 'pointer', fontSize: 14 }}>Pin this memory</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => editingId
              ? updateMutation.mutate({ id: editingId, data: form })
              : createMutation.mutate()
            } disabled={!form.content.trim()}>
              {editingId ? 'Update' : 'Save'} Memory
            </button>
            <button className="btn btn-ghost" onClick={() => { setShowCreate(false); setEditingId(null) }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Memory Grid */}
      {isLoading ? (
        <div style={styles.grid}>
          {[...Array(6)].map((_, i) => <div key={i} className="card shimmer" style={{ height: 120 }} />)}
        </div>
      ) : (
        <div style={styles.grid}>
          {memories.map(m => (
            <div key={m.id} className="card" style={styles.memoryCard}>
              <div style={styles.cardHeader}>
                <span className="badge" style={{ background: `${TYPE_COLORS[m.type] || '#6366f1'}20`, color: TYPE_COLORS[m.type] || '#6366f1' }}>
                  {m.type}
                </span>
                <div style={styles.cardActions}>
                  {m.pinned && <span title="Pinned">📌</span>}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>★ {m.importance}/10</span>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => {
                    setEditingId(m.id)
                    setForm({ content: m.content, type: m.type, importance: m.importance, tags: m.tags || '', pinned: m.pinned })
                  }}>✏️</button>
                  <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteMutation.mutate(m.id)}>🗑</button>
                </div>
              </div>
              <p style={styles.memoryContent}>{m.content}</p>
              {m.tags && (
                <div style={styles.tags}>
                  {m.tags.split(',').map(t => (
                    <span key={t} style={styles.tag}>{t.trim()}</span>
                  ))}
                </div>
              )}
              <div style={styles.cardFooter}>
                {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      )}

      {memories.length === 0 && !isLoading && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 64 }}>🧠</div>
          <h3 style={{ marginTop: 16 }}>No memories yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Add memories to help your AI clone know who you are.
          </p>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, overflowY: 'auto', height: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700 },
  subtitle: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 },
  form: { marginBottom: 24 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  memoryCard: { display: 'flex', flexDirection: 'column', gap: 10 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardActions: { display: 'flex', alignItems: 'center', gap: 6 },
  memoryContent: { fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0, flex: 1 },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  tag: { fontSize: 11, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 999, padding: '2px 8px', color: 'var(--text-secondary)' },
  cardFooter: { fontSize: 11, color: 'var(--text-muted)' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300 },
}
