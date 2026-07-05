'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Eye, Star, Pin } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface Article {
  id: string
  title: string
  slug: string
  published: boolean
  featured: boolean
  pinned: boolean
  readingTime: number
  createdAt: string
  publishedAt: string | null
  category: { name: string }
}

export default function ArticlesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/articles?limit=50')
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles || [])
        setTotal(data.pagination?.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(slug: string) {
    if (!confirm('Delete this article?')) return
    const res = await fetch(`/api/articles/${slug}`, { method: 'DELETE' })
    if (res.ok) {
      setArticles((prev) => prev.filter((a) => a.slug !== slug))
      setTotal((prev) => prev - 1)
    }
  }

  async function handleTogglePublish(article: Article) {
    const res = await fetch(`/api/articles/${article.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !article.published, publishedAt: !article.published ? new Date().toISOString() : null }),
    })
    if (res.ok) {
      setArticles((prev) => prev.map((a) => a.slug === article.slug ? { ...a, published: !a.published, publishedAt: !a.published ? new Date().toISOString() : null } : a))
    }
  }

  async function handleToggleFeatured(article: Article) {
    const res = await fetch(`/api/articles/${article.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !article.featured }),
    })
    if (res.ok) {
      setArticles((prev) => prev.map((a) => a.slug === article.slug ? { ...a, featured: !a.featured } : a))
    }
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Articles</h1>
              <p className={styles.subtitle}>{total} articles total</p>
            </div>
            <Link href="/admin/dashboard/articles/new" className="btn btn-primary">
              <Plus size={16} /> New Article
            </Link>
          </div>
        </AnimatedSection>

        {loading ? (
          <p style={{ color: 'var(--color-text-tertiary)', padding: '2rem 0' }}>Loading articles...</p>
        ) : articles.length === 0 ? (
          <p style={{ color: 'var(--color-text-tertiary)', padding: '2rem 0' }}>No articles yet. Create your first one!</p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.colTitle}>Title</span>
              <span className={styles.colCategory}>Category</span>
              <span className={styles.colStatus}>Status</span>
              <span className={styles.colDate}>Date</span>
              <span className={styles.colActions}>Actions</span>
            </div>
            {articles.map((article, i) => (
              <AnimatedSection key={article.id} delay={i * 0.03}>
                <div className={styles.tableRow}>
                  <span className={styles.colTitle}>
                    <div className={styles.titleCell}>
                      <span>{article.title}</span>
                      <div className={styles.titleBadges}>
                        {article.featured && <Star size={12} className={styles.badgeStar} />}
                        {article.pinned && <Pin size={12} className={styles.badgePin} />}
                      </div>
                    </div>
                  </span>
                  <span className={styles.colCategory}>{article.category?.name || '—'}</span>
                  <span className={styles.colStatus}>
                    <span className={`${styles.status} ${article.published ? styles.published : styles.draft}`}>
                      {article.published ? 'Published' : 'Draft'}
                    </span>
                  </span>
                  <span className={styles.colDate}>
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : new Date(article.createdAt).toLocaleDateString()}
                  </span>
                  <span className={styles.colActions}>
                    <Link href={`/admin/dashboard/articles/${article.slug}`} className={styles.actionBtn} title="Edit">
                      <Edit size={14} />
                    </Link>
                    <button onClick={() => handleTogglePublish(article)} className={styles.actionBtn} title={article.published ? 'Unpublish' : 'Publish'}>
                      <Eye size={14} />
                    </button>
                    <button onClick={() => handleToggleFeatured(article)} className={styles.actionBtn} title={article.featured ? 'Unfeature' : 'Feature'}>
                      <Star size={14} />
                    </button>
                    <button onClick={() => handleDelete(article.slug)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
