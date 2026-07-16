import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personalityApi } from '../api/client'
import toast from 'react-hot-toast'

type Tone = 'PROFESSIONAL' | 'FRIENDLY' | 'CASUAL' | 'DIRECT' | 'EMPATHETIC' | 'HUMOROUS'
type Humor = 'NONE' | 'SUBTLE' | 'MODERATE' | 'HIGH'
type SentenceLength = 'SHORT' | 'MEDIUM' | 'LONG' | 'MIXED'
type EmojiUsage = 'NEVER' | 'OCCASIONAL' | 'FREQUENT'
type TechnicalLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXPERT'

interface Profile {
  id: string
  displayName: string
  shortBio: string
  greetingStyle: string
  closingStyle: string
  tone: Tone
  humor: Humor
  sentenceLength: SentenceLength
  emojiUsage: EmojiUsage
  technicalLevel: TechnicalLevel
  vocabulary: string
  frequentlyUsedPhrases: string
  wordsToAvoid: string
  writingStructure: string
  reasoningStyle: string
  codingPhilosophy: string
  customInstructions: string
}

const TONE_OPTIONS: Tone[] = ['PROFESSIONAL', 'FRIENDLY', 'CASUAL', 'DIRECT', 'EMPATHETIC', 'HUMOROUS']
const HUMOR_OPTIONS: Humor[] = ['NONE', 'SUBTLE', 'MODERATE', 'HIGH']
const SENTENCE_OPTIONS: SentenceLength[] = ['SHORT', 'MEDIUM', 'LONG', 'MIXED']
const EMOJI_OPTIONS: EmojiUsage[] = ['NEVER', 'OCCASIONAL', 'FREQUENT']
const TECH_OPTIONS: TechnicalLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'EXPERT']

export default function PersonalityPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<{ data: Profile }>({
    queryKey: ['personality'],
    queryFn: () => personalityApi.get(),
  })

  const [form, setForm] = useState<Partial<Profile>>({})

  useEffect(() => {
    if (data?.data) setForm(data.data)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => personalityApi.update(form as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personality'] })
      toast.success('Personality profile saved!')
    },
    onError: () => toast.error('Failed to save profile'),
  })

  const set = (field: keyof Profile) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  if (isLoading) {
    return (
      <div style={styles.page}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[...Array(5)].map((_, i) => <div key={i} className="card shimmer" style={{ height: 80 }} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🎭 Personality Profile</h1>
          <p style={styles.subtitle}>
            Define how your AI clone speaks, thinks, and behaves. These traits are injected
            into every prompt.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : '💾 Save Profile'}
        </button>
      </div>

      {/* Identity */}
      <Section title="🪪 Identity">
        <Field label="Display Name">
          <input className="input" value={form.displayName || ''} onChange={set('displayName')} placeholder="Your name" />
        </Field>
        <Field label="Short Bio" span>
          <textarea className="input" rows={2} value={form.shortBio || ''} onChange={set('shortBio')}
            placeholder="A brief description of who you are..." style={{ resize: 'vertical' }} />
        </Field>
      </Section>

      {/* Communication Style */}
      <Section title="💬 Communication Style">
        <Field label="Tone">
          <select className="input" value={form.tone || 'FRIENDLY'} onChange={set('tone')}>
            {TONE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Humor Level">
          <select className="input" value={form.humor || 'MODERATE'} onChange={set('humor')}>
            {HUMOR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Sentence Length">
          <select className="input" value={form.sentenceLength || 'MEDIUM'} onChange={set('sentenceLength')}>
            {SENTENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Emoji Usage">
          <select className="input" value={form.emojiUsage || 'OCCASIONAL'} onChange={set('emojiUsage')}>
            {EMOJI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Technical Level">
          <select className="input" value={form.technicalLevel || 'HIGH'} onChange={set('technicalLevel')}>
            {TECH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Greeting Style">
          <input className="input" value={form.greetingStyle || ''} onChange={set('greetingStyle')} placeholder="Hey! How can I help?" />
        </Field>
        <Field label="Closing Style">
          <input className="input" value={form.closingStyle || ''} onChange={set('closingStyle')} placeholder="Let me know if you need anything!" />
        </Field>
      </Section>

      {/* Vocabulary */}
      <Section title="📚 Vocabulary & Writing">
        <Field label="Preferred Words / Vocabulary" span>
          <input className="input" value={form.vocabulary || ''} onChange={set('vocabulary')} placeholder="clean, elegant, pragmatic (comma-separated)" />
        </Field>
        <Field label="Frequently Used Phrases" span>
          <input className="input" value={form.frequentlyUsedPhrases || ''} onChange={set('frequentlyUsedPhrases')} placeholder="makes sense, exactly, to be honest (comma-separated)" />
        </Field>
        <Field label="Words to Avoid" span>
          <input className="input" value={form.wordsToAvoid || ''} onChange={set('wordsToAvoid')} placeholder="very, just, actually (comma-separated)" />
        </Field>
        <Field label="Writing Structure" span>
          <input className="input" value={form.writingStructure || ''} onChange={set('writingStructure')} placeholder="Bullet points for lists, short paragraphs for explanations" />
        </Field>
      </Section>

      {/* Reasoning */}
      <Section title="🧠 Reasoning & Philosophy">
        <Field label="Reasoning Style" span>
          <textarea className="input" rows={2} value={form.reasoningStyle || ''} onChange={set('reasoningStyle')}
            placeholder="Analytical, step-by-step, systematic..." style={{ resize: 'vertical' }} />
        </Field>
        <Field label="Coding Philosophy" span>
          <textarea className="input" rows={2} value={form.codingPhilosophy || ''} onChange={set('codingPhilosophy')}
            placeholder="Clean code, SOLID principles, readability..." style={{ resize: 'vertical' }} />
        </Field>
      </Section>

      {/* Custom Instructions */}
      <Section title="⚙️ Custom Instructions">
        <Field label="Custom instructions injected into every prompt verbatim" span>
          <textarea className="input" rows={4} value={form.customInstructions || ''} onChange={set('customInstructions')}
            placeholder="e.g., Always end responses with a follow-up question. Never use passive voice." style={{ resize: 'vertical' }} />
        </Field>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn btn-primary btn-lg" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving...' : '💾 Save Personality Profile'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 20, padding: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{title}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : undefined }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, overflowY: 'auto', height: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700 },
  subtitle: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 4, maxWidth: 600 },
}
