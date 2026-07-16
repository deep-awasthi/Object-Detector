import React, { useCallback, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentApi } from '../api/client'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface Document {
  id: string; originalFilename: string; fileType: string; status: string
  chunkCount: number; fileSizeBytes: number; uploadedAt: string; processedAt?: string
}

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: '#10b981', PROCESSING: '#f59e0b', PENDING: '#6366f1', FAILED: '#ef4444'
}

export default function DocumentsPage() {
  const qc = useQueryClient()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentApi.list(0, 50).then(r => r.data),
    refetchInterval: (data) => {
      // Auto-refresh while any document is processing
      const docs: Document[] = (data as any)?.content || []
      return docs.some(d => d.status === 'PROCESSING' || d.status === 'PENDING') ? 3000 : false
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document deleted') },
  })

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    try {
      await documentApi.upload(file)
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success(`${file.name} uploaded — processing started`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [qc])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    files.forEach(uploadFile)
  }, [uploadFile])

  const documents: Document[] = (data as any)?.content || []

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📄 Documents</h1>
          <p style={styles.subtitle}>Upload files to be chunked, embedded, and indexed for RAG</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        style={{ ...styles.dropZone, ...(dragging ? styles.dropZoneActive : {}) }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          style={{ display: 'none' }}
          accept=".pdf,.docx,.txt,.md,.json,.csv"
          onChange={e => Array.from(e.target.files || []).forEach(uploadFile)}
        />
        {uploading ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>⏳</div>
            <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Uploading...</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>{dragging ? '📥' : '📤'}</div>
            <p style={{ marginTop: 12, fontWeight: 600 }}>
              {dragging ? 'Drop to upload' : 'Drag & drop files here'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              PDF, DOCX, TXT, Markdown, JSON, CSV — up to 100MB
            </p>
            <button className="btn btn-ghost" style={{ marginTop: 12 }}>
              Browse Files
            </button>
          </div>
        )}
      </div>

      {/* Document List */}
      {isLoading ? (
        <div style={styles.list}>
          {[...Array(3)].map((_, i) => <div key={i} className="card shimmer" style={{ height: 72 }} />)}
        </div>
      ) : (
        <div style={styles.list}>
          {documents.map(doc => (
            <div key={doc.id} className="card" style={styles.docRow}>
              <div style={styles.docIcon}>
                {fileIcon(doc.fileType)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.originalFilename}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {formatBytes(doc.fileSizeBytes)} • {doc.chunkCount} chunks •{' '}
                  {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge" style={{ background: `${STATUS_COLOR[doc.status]}20`, color: STATUS_COLOR[doc.status] }}>
                  {doc.status === 'PROCESSING' && '⟳ '}{doc.status}
                </span>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteMutation.mutate(doc.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {documents.length === 0 && !isLoading && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 64 }}>📂</div>
          <h3 style={{ marginTop: 16 }}>No documents yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Upload documents to give your AI clone more context.
          </p>
        </div>
      )}
    </div>
  )
}

function fileIcon(type: string) {
  const icons: Record<string, string> = {
    PDF: '📕', DOCX: '📘', TXT: '📝', MARKDOWN: '📋', JSON: '📊', CSV: '📊'
  }
  return <span style={{ fontSize: 24 }}>{icons[type] || '📄'}</span>
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, overflowY: 'auto', height: '100%' },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700 },
  subtitle: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 },
  dropZone: { border: '2px dashed var(--border-color)', borderRadius: 16, padding: 40, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease', marginBottom: 24 },
  dropZoneActive: { borderColor: 'var(--accent-primary)', background: 'rgba(99,102,241,0.05)' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  docRow: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' },
  docIcon: { width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300 },
}
