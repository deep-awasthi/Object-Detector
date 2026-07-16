import React from 'react'

const MODELS = [
  {
    id: 'qwen2.5:latest',
    name: 'Qwen 2.5',
    tag: '4B',
    desc: 'Default model — fast, multilingual, excellent at coding and reasoning.',
    strengths: ['Coding', 'Reasoning', 'Multilingual'],
    size: '~2.5 GB',
    speed: 'Fast',
    isDefault: true,
    color: '#6366f1',
  },
  {
    id: 'gemma3:4b',
    name: 'Gemma 3',
    tag: '4B',
    desc: 'Google\'s Gemma 3 — strong at instruction following and factual tasks.',
    strengths: ['Instructions', 'Factual', 'Summarization'],
    size: '~3.0 GB',
    speed: 'Medium',
    isDefault: false,
    color: '#06b6d4',
  },
  {
    id: 'llama3.2:latest',
    name: 'Llama 3.2',
    tag: '3B',
    desc: "Meta's Llama 3.2 — lightweight and quick for conversational tasks.",
    strengths: ['Conversation', 'Speed', 'Lightweight'],
    size: '~2.0 GB',
    speed: 'Very Fast',
    isDefault: false,
    color: '#10b981',
  },
]

export default function ModelsPage() {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🤖 AI Models</h1>
          <p style={styles.subtitle}>
            All models run locally via Ollama. Switch anytime — no restart needed.
          </p>
        </div>
      </div>

      {/* Install Command */}
      <div style={styles.codeBlock} className="glass">
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          Pull models with Ollama CLI:
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          <div style={styles.codeLine}><span style={styles.prompt}>$</span> ollama pull qwen2.5:latest</div>
          <div style={styles.codeLine}><span style={styles.prompt}>$</span> ollama pull nomic-embed-text:latest</div>
          <div style={styles.codeLine}><span style={styles.prompt}>$</span> ollama pull gemma3:4b</div>
          <div style={styles.codeLine}><span style={styles.prompt}>$</span> ollama pull llama3.2:latest</div>
        </div>
      </div>

      {/* Model Cards */}
      <div style={styles.grid}>
        {MODELS.map(model => (
          <div key={model.id} className="card" style={{ ...styles.modelCard, borderColor: model.isDefault ? model.color + '40' : undefined }}>
            {model.isDefault && (
              <div className="badge badge-primary" style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
                ⭐ Default
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: model.color }}>{model.name}</h2>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{model.id}</span>
              </div>
              <span
                style={{
                  background: `${model.color}20`, color: model.color,
                  borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 700,
                }}
              >
                {model.tag}
              </span>
            </div>

            <p style={styles.modelDesc}>{model.desc}</p>

            {/* Strengths */}
            <div style={styles.strengths}>
              {model.strengths.map(s => (
                <span key={s} className="badge" style={{ background: `${model.color}15`, color: model.color }}>
                  {s}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div style={styles.statsRow}>
              <div style={styles.stat}>
                <span style={styles.statLabel}>Size</span>
                <span style={styles.statValue}>{model.size}</span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statLabel}>Speed</span>
                <span style={{ ...styles.statValue, color: model.color }}>{model.speed}</span>
              </div>
            </div>

            {/* Pull Command */}
            <code style={styles.pullCmd}>ollama pull {model.id}</code>
          </div>
        ))}
      </div>

      {/* Embedding Model */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Embedding Model</h2>
        <div className="card" style={styles.embedCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>nomic-embed-text</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                High-quality open-source embeddings — 768 dimensions, ~274MB
              </div>
            </div>
            <span className="badge badge-success">Active</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            Used for: memory indexing, document chunking, RAG retrieval, semantic search
          </div>
        </div>
      </div>

      {/* Privacy note */}
      <div className="glass" style={{ padding: '14px 18px', borderRadius: 12, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>🔒</span>
        All models run locally via Ollama. No data is ever sent to OpenAI, Anthropic, or any cloud service.
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, overflowY: 'auto', height: '100%' },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700 },
  subtitle: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 },
  codeBlock: { borderRadius: 12, padding: '16px 20px', marginBottom: 28, fontFamily: 'var(--font-mono)' },
  codeLine: { padding: '3px 0', fontSize: 13 },
  prompt: { color: 'var(--accent-primary)', marginRight: 8 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 28 },
  modelCard: { display: 'flex', flexDirection: 'column', gap: 10, padding: 20, borderWidth: 1, borderStyle: 'solid' },
  modelDesc: { fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 },
  strengths: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  statsRow: { display: 'flex', gap: 16 },
  stat: { display: 'flex', flexDirection: 'column', gap: 2 },
  statLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statValue: { fontSize: 14, fontWeight: 600 },
  pullCmd: { fontSize: 12, background: 'var(--bg-tertiary)', padding: '6px 10px', borderRadius: 6, display: 'block', color: 'var(--accent-tertiary)' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 12 },
  embedCard: { padding: 20 },
}
