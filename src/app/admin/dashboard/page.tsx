'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Folder, Image, Plus, TrendingUp, Eye, Clock, Star, PenTool } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface Stats {
  totalArticles: number
  publishedArticles: number
  draftArticles: number
  totalCategories: number
  totalMedia: number
  totalTags: number
}

interface Article {
  id: string
  title: string
  slug: string
  published: boolean
  featured: boolean
  readingTime: number
  createdAt: string
  publishedAt: string | null
  category?: { name: string; color: string }
}

interface CategoryStat {
  name: string
  color: string
  _count: { articles: number }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalArticles: 0, publishedArticles: 0, draftArticles: 0, totalCategories: 0, totalMedia: 0, totalTags: 0 })
  const [articles, setArticles] = useState<Article[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setStats(data.stats)
        if (data.recentArticles) setArticles(data.recentArticles)
        if (data.categoryStats) setCategoryStats(data.categoryStats)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Total Articles', value: stats.totalArticles, icon: <FileText size={20} />, color: '#3B82F6' },
    { label: 'Published', value: stats.publishedArticles, icon: <Eye size={20} />, color: '#10B981' },
    { label: 'Drafts', value: stats.draftArticles, icon: <PenTool size={20} />, color: '#F59E0B' },
    { label: 'Categories', value: stats.totalCategories, icon: <Folder size={20} />, color: '#8B5CF6' },
    { label: 'Media Files', value: stats.totalMedia, icon: <Image size={20} />, color: '#EF4444' },
    { label: 'Tags', value: stats.totalTags, icon: <Star size={20} />, color: '#06B6D4' },
  ]

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Dashboard</h1>
              <p className={styles.subtitle}>Welcome back. Here&apos;s your blog overview.</p>
            </div>
            <Link href="/admin/dashboard/articles/new" className="btn btn-primary">
              <Plus size={16} /> New Article
            </Link>
          </div>
        </AnimatedSection>

        <div className={styles.stats}>
          {statCards.map((stat, i) => (
            <AnimatedSection key={stat.label} delay={i * 0.04}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ color: stat.color }}>{stat.icon}</div>
                <div className={styles.statValue}>{loading ? '—' : stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <div className={styles.grid}>
          <AnimatedSection delay={0.15}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Recent Articles</h3>
                <Link href="/admin/dashboard/articles" className={styles.viewAll}>View all →</Link>
              </div>
              <div className={styles.articleList}>
                {loading ? (
                  <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', padding: '1rem 0' }}>Loading...</p>
                ) : articles.length === 0 ? (
                  <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', padding: '1rem 0' }}>No articles yet. Write your first one!</p>
                ) : (
                  articles.map((article) => (
                    <div key={article.id} className={styles.articleItem}>
                      <div>
                        <h4 className={styles.articleTitle}>{article.title}</h4>
                        <span className={styles.articleDate}>
                          {article.category && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: article.category.color, display: 'inline-block' }} />
                              {article.category.name}
                            </span>
                          )}
                          {' · '}
                          {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : new Date(article.createdAt).toLocaleDateString()}
                          {article.readingTime && ` · ${article.readingTime} min`}
                        </span>
                      </div>
                      <div className={styles.articleMeta}>
                        <span className={`${styles.status} ${article.published ? styles.published : styles.draft}`}>
                          {article.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Articles by Category</h3>
              {loading ? (
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', padding: '1rem 0' }}>Loading...</p>
              ) : categoryStats.length === 0 ? (
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', padding: '1rem 0' }}>No categories yet.</p>
              ) : (
                <div className={styles.categoryList}>
                  {categoryStats.map((cat) => {
                    const maxCount = Math.max(...categoryStats.map((c) => c._count.articles), 1)
                    const pct = (cat._count.articles / maxCount) * 100
                    return (
                      <div key={cat.name} className={styles.categoryItem}>
                        <div className={styles.categoryInfo}>
                          <span className={styles.categoryDot} style={{ background: cat.color }} />
                          <span className={styles.categoryName}>{cat.name}</span>
                          <span className={styles.categoryCount}>{cat._count.articles}</span>
                        </div>
                        <div className={styles.categoryBar}>
                          <div className={styles.categoryBarFill} style={{ width: `${pct}%`, background: cat.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.25}>
          <div className={styles.card} style={{ marginTop: '1.5rem' }}>
            <h3 className={styles.cardTitle}>Quick Actions</h3>
            <div className={styles.quickLinks}>
              {[
                { href: '/admin/dashboard/articles/new', label: 'Write Article', icon: <PenTool size={20} />, color: '#3B82F6' },
                { href: '/admin/dashboard/articles', label: 'Manage Articles', icon: <FileText size={20} />, color: '#10B981' },
                { href: '/admin/dashboard/categories', label: 'Categories', icon: <Folder size={20} />, color: '#8B5CF6' },
                { href: '/admin/dashboard/media', label: 'Upload Media', icon: <Image size={20} />, color: '#F59E0B' },
                { href: '/admin/dashboard/settings', label: 'Site Settings', icon: <TrendingUp size={20} />, color: '#06B6D4' },
                { href: '/admin/dashboard/profile', label: 'Edit Profile', icon: <Clock size={20} />, color: '#EF4444' },
              ].map((link) => (
                <Link key={link.href} href={link.href} className={styles.quickLink}>
                  <span style={{ color: link.color }}>{link.icon}</span><span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
