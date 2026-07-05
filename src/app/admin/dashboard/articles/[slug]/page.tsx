'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Check } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from '../new/page.module.css'

interface Category {
  id: string
  name: string
  slug: string
}

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  contentHtml: string
  categoryId: string
  coverImage: string | null
  published: boolean
  featured: boolean
  pinned: boolean
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string[]
  tags: { tag: { id: string; name: string } }[]
}

export default function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [articleId, setArticleId] = useState('')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [autoSaved, setAutoSaved] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const skipAutoSave = useRef(true)

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : data.categories || []))
      .catch(() => {})

    params.then(({ slug: urlSlug }) => {
      fetch(`/api/articles/${urlSlug}`)
        .then((r) => {
          if (!r.ok) throw new Error()
          return r.json()
        })
        .then((data: Article) => {
          setArticleId(data.id)
          setTitle(data.title)
          setSlug(data.slug)
          setExcerpt(data.excerpt || '')
          setContentHtml(data.contentHtml || '')
          setCategoryId(data.categoryId)
          setCoverImage(data.coverImage || '')
          setSeoTitle(data.seoTitle || '')
          setSeoDescription(data.seoDescription || '')
          setTags(data.seoKeywords?.join(', ') || '')
          setLoading(false)
        })
        .catch(() => {
          alert('Article not found')
          router.push('/admin/dashboard/articles')
        })
    })
  }, [params, router])

  // Skip first auto-save cycle (data just loaded)
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => { skipAutoSave.current = false }, 6000)
      return () => clearTimeout(timer)
    }
  }, [loading])

  const autoSave = useCallback(async () => {
    if (loading || skipAutoSave.current || saving || autoSaving || !title.trim() || !categoryId) return

    setAutoSaving(true)
    try {
      await fetch(`/api/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug,
          content: {},
          contentHtml: contentHtml || '<p></p>',
          excerpt: excerpt || null,
          coverImage: coverImage || null,
          categoryId,
          tagIds: [],
          published: false,
          featured: false,
          pinned: false,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          seoKeywords: tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      })
      setAutoSaved(true)
      setTimeout(() => setAutoSaved(false), 2000)
    } catch {
      // silently fail
    } finally {
      setAutoSaving(false)
    }
  }, [loading, saving, autoSaving, title, slug, contentHtml, excerpt, categoryId, tags, coverImage, seoTitle, seoDescription])

  useEffect(() => {
    const interval = setInterval(autoSave, 5000)
    return () => clearInterval(interval)
  }, [autoSave])

  function generateSlug(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function save(published: boolean) {
    if (!title.trim() || !categoryId) {
      alert('Title and category are required')
      return
    }
    setSaving(true)
    try {
      const body = {
        title: title.trim(),
        slug: slug || generateSlug(title),
        content: {},
        contentHtml: contentHtml || '<p></p>',
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        categoryId,
        tagIds: [],
        published,
        featured: false,
        pinned: false,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: tags.split(',').map((t) => t.trim()).filter(Boolean),
      }
      const res = await fetch(`/api/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        router.push('/admin/dashboard/articles')
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to save article')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <p style={{ color: 'var(--color-text-tertiary)', padding: '2rem 0' }}>Loading article...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <div>
              <Link href="/admin/dashboard/articles" className={styles.backLink}>
                <ArrowLeft size={16} /> Back to Articles
              </Link>
              <h1 className={styles.title}>Edit Article</h1>
            </div>
            <div className={styles.actions}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {autoSaving ? 'Saving...' : autoSaved ? <><Check size={12} /> Saved</> : ''}
              </span>
              <button onClick={() => save(false)} className="btn btn-secondary" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={() => save(true)} className="btn btn-primary" disabled={saving}>
                <Eye size={16} /> Publish
              </button>
            </div>
          </div>
        </AnimatedSection>

        <div className={styles.layout}>
          <div className={styles.main}>
            <AnimatedSection delay={0.1}>
              <div className={styles.section}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter article title..."
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setSlug(generateSlug(e.target.value)) }}
                    style={{ fontSize: '1.5rem', fontWeight: 600, padding: '1rem' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug</label>
                  <input type="text" className="form-input" value={slug} onChange={(e) => setSlug(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Excerpt</label>
                  <textarea className="form-input" rows={3} placeholder="Brief description for previews..." value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <div className={styles.section}>
                <label className="form-label">Content (HTML)</label>
                <textarea
                  className="form-input"
                  rows={20}
                  placeholder="<h2>Introduction</h2><p>Start writing your article here...</p>"
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', lineHeight: 1.6, resize: 'vertical' }}
                />
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>SEO</h3>
                <div className="form-group">
                  <label className="form-label">SEO Title</label>
                  <input type="text" className="form-input" placeholder="Custom title for search engines..." value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>{seoTitle.length}/70 characters</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Meta Description</label>
                  <textarea className="form-input" rows={2} placeholder="Description for search engines..." value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>{seoDescription.length}/160 characters</p>
                </div>
              </div>
            </AnimatedSection>
          </div>

          <div className={styles.sidebar}>
            <AnimatedSection delay={0.1}>
              <div className={styles.sidebarCard}>
                <h3 className={styles.sidebarTitle}>Cover Image URL</h3>
                <input type="url" className="form-input" placeholder="https://..." value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <div className={styles.sidebarCard}>
                <h3 className={styles.sidebarTitle}>Category</h3>
                <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className={styles.sidebarCard}>
                <h3 className={styles.sidebarTitle}>Tags</h3>
                <input type="text" className="form-input" placeholder="java, spring, microservices" value={tags} onChange={(e) => setTags(e.target.value)} />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.375rem' }}>Comma separated</p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  )
}
