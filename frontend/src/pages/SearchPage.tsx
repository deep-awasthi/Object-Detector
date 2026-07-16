import React, { useState } from 'react'
import { searchApi } from '../api/client'
import toast from 'react-hot-toast'

interface SearchResult {
  id: string
  contentType: string
  content: string
  title: string
  score: number
  createdAt: string
  sourceId: string
}

const SCOPES = ['ALL', 'MEMORIES', 'CONVERSATIONS', 'DOCUMENTS'] as const
type Scope = typeof SCOPES[number]

const SCOPE_ICONS: Record<Scope, string> = {
  ALL: '🔍', MEMORIES: '🧠', CONVERSATIONS: '💬', DOCUMENTS: '📄'
}

const TYPE_COLORS: Record<string, string> = {
  memory: '#8b5cf6', conversation: '#6366f1', document: '#06b6d4', unknown: '#475569'
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<Scope>('ALL')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await searchApi.search(query, scope, 20)
      setResults(res.data)
    } catch (err: any) {
      toast.error('Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🔍 Search</h1>
        <p style={styles.subtitle}>Semantic + keyword hybrid search across all your content</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={styles.searchForm}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            className="input"
            style={styles.searchInput}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search memories, conversations, documents..."
            autoFocus
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !query.trim()}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Scope Filters */}
        <div style={styles.scopes}>
          {SCOPES.map(s => (
            <button
              key={s}
              type="button"
              style={{ ...styles.scopeBtn, ...(scope === s ? styles.scopeBtnActive : {}) }}
              onClick={() => setScope(s)}
            >
              {SCOPE_ICONS[s]} {s}
            </button>
          ))}
        </div>
      </form>

      {/* Results */}
      {loading && (
        <div style={styles.resultsGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card shimmer" style={{ height: 120 }} />
          ))}
        </div>
      )}

      {!loading && searched && (
        <>
          <div style={styles.resultsHeader}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {results.length === 0
                ? 'No results found'
                : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
            </span>
          </div>

          <div style={styles.resultsGrid}>
            {results.map(result => (
              <div key={result.id} className="card fade-in" style={styles.resultCard}>
                <div style={styles.resultHeader}>
                  <span
                    className="badge"
                    style={{
                      background: `${TYPE_COLORS[result.contentType] || TYPE_COLORS.unknown}20`,
                      color: TYPE_COLORS[result.contentType] || TYPE_COLORS.unknown,
                    }}
                  >
                    {result.contentType.toUpperCase()}
                  </span>
                  <span style={styles.score}>
                    {(result.score * 100).toFixed(0)}% match
                  </span>
                </div>
                <p style={styles.resultContent}>
                  {result.content.length > 300
                    ? result.content.slice(0, 300) + '...'
                    : result.content}
                </p>
                <div style={styles.resultFooter}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{result.title}</span>
                </div>
              </div>
            ))}
          </div>

          {results.length === 0 && (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 64 }}>🔎</div>
              <h3 style={{ marginTop: 16 }}>No results found</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                Try a different search query or adjust the scope filter.
              </p>
            </div>
          )}
        </>
      )}

      {!searched && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 64 }}>🔍</div>
          <h3 style={{ marginTop: 16 }}>Search your knowledge base</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, textAlign: 'center', maxWidth: 400 }}>
            Uses semantic AI search (via Qdrant) combined with keyword search to find
            the most relevant memories, conversations, and documents.
          </p>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, overflowY: 'auto', height: '100%' },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700 },
  subtitle: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 },
  searchForm: { marginBottom: 24 },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 16, padding: '8px 12px', marginBottom: 12,
  },
  searchIcon: { fontSize: 18, flexShrink: 0 },
  searchInput: {
    flex: 1, border: 'none', background: 'transparent',
    fontSize: 16, padding: '4px 8px',
    boxShadow: 'none',
  },
  scopes: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  scopeBtn: {
    padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border-color)',
    background: 'transparent', color: 'var(--text-secondary)', fontSize: 13,
    cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s ease',
  },
  scopeBtnActive: {
    background: 'rgba(99,102,241,0.12)', borderColor: 'var(--accent-primary)',
    color: 'var(--accent-primary)',
  },
  resultsHeader: { marginBottom: 16 },
  resultsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  resultCard: { display: 'flex', flexDirection: 'column', gap: 10 },
  resultHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  score: { fontSize: 11, color: 'var(--accent-success)', fontWeight: 600 },
  resultContent: { fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0, flex: 1 },
  resultFooter: { borderTop: '1px solid var(--border-color)', paddingTop: 8 },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: 300,
  },
}
