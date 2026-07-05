'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, Search, Image as ImageIcon, Copy } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface MediaItem {
  id: string
  name: string
  url: string
  publicId: string
  format: string | null
  bytes: number | null
  width: number | null
  height: number | null
  createdAt: string
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/media')
      .then((r) => r.json())
      .then((data) => setMedia(Array.isArray(data) ? data : data.media || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const uploaded = await uploadRes.json()

      const saveRes = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          url: uploaded.url,
          publicId: uploaded.publicId,
          format: uploaded.format,
          bytes: uploaded.bytes,
          width: uploaded.width,
          height: uploaded.height,
        }),
      })
      if (saveRes.ok) {
        const saved = await saveRes.json()
        setMedia((prev) => [saved, ...prev])
      }
    } catch {
      alert('Upload failed. Make sure Cloudinary is configured.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete "${item.name}"?`)) return
    const res = await fetch(`/api/media/${item.id}`, { method: 'DELETE' })
    if (res.ok) {
      setMedia((prev) => prev.filter((m) => m.id !== item.id))
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
  }

  function formatBytes(bytes: number | null) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const filtered = search
    ? media.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : media

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Media</h1>
              <p className={styles.subtitle}>{media.length} files</p>
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className={styles.search}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search files..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </AnimatedSection>

        {loading ? (
          <p style={{ color: 'var(--color-text-tertiary)', padding: '2rem 0' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-secondary)' }}>
            {media.length === 0 ? 'No files uploaded yet.' : 'No files match your search.'}
          </p>
        ) : (
          <div className={styles.grid}>
            {filtered.map((item, i) => (
              <AnimatedSection key={item.id} delay={i * 0.04}>
                <div className={styles.card}>
                  {item.url ? (
                    <div className={styles.preview}>
                      <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                    </div>
                  ) : (
                    <div className={styles.preview}>
                      <ImageIcon size={32} style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                  )}
                  <div className={styles.info}>
                    <p className={styles.name}>{item.name}</p>
                    <p className={styles.meta}>{item.format || 'file'} · {formatBytes(item.bytes)}</p>
                    <p className={styles.meta}>{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} title="Copy URL" onClick={() => copyUrl(item.url)}>
                      <Copy size={14} />
                    </button>
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete" onClick={() => handleDelete(item)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
