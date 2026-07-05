'use client'

import { useEffect, useState } from 'react'
import { Eye, FileText, Users, Clock, TrendingUp, Calendar } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface Article {
  id: string
  title: string
  slug: string
  published: boolean
  publishedAt: string | null
  readingTime: number
  category: { name: string; color: string }
}

interface Stats {
  totalArticles: number
  publishedArticles: number
  draftArticles: number
  totalSubscribers: number
  totalViews: number
}

interface CategoryStat {
  name: string
  color: string
  _count: { articles: number }
}

export default function ReadersPage() {
  const [stats, setStats] = useState<Stats>({ totalArticles: 0, publishedArticles: 0, draftArticles: 0, totalSubscribers: 0, totalViews: 0 })
  const [articles, setArticles] = useState<Article[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; active: boolean; createdAt: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then((r) => r.json()),
      fetch('/api/subscribers').then((r) => r.json()),
    ])
      .then(([statsData, subsData]) => {
        if (statsData.stats) setStats({ ...statsData.stats, totalSubscribers: subsData.length || 0, totalViews: 0 })
        if (statsData.recentArticles) setArticles(statsData.recentArticles)
        if (statsData.categoryStats) setCategoryStats(statsData.categoryStats)
        setSubscribers(Array.isArray(subsData) ? subsData : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Published Articles', value: stats.publishedArticles, icon: <FileText size={20} />, color: '#3B82F6' },
    { label: 'Draft Articles', value: stats.draftArticles, icon: <FileText size={20} />, color: '#F59E0B' },
    { label: 'Active Subscribers', value: subscribers.filter((s) => s.active).length, icon: <Users size={20} />, color: '#10B981' },
    { label: 'Categories', value: categoryStats.length, icon: <TrendingUp size={20} />, color: '#8B5CF6' },
  ]

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Readers & Analytics</h1>
              <p className={styles.subtitle}>Track your blog performance and audience</p>
            </div>
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

          <AnimatedSection delay={0.2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Recent Articles</h3>
              {loading ? (
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', padding: '1rem 0' }}>Loading...</p>
              ) : articles.length === 0 ? (
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', padding: '1rem 0' }}>No articles yet.</p>
              ) : (
                <div className={styles.articleList}>
                  {articles.slice(0, 8).map((article) => (
                    <div key={article.id} className={styles.articleItem}>
                      <div>
                        <h4 className={styles.articleTitle}>{article.title}</h4>
                        <span className={styles.articleMeta}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: article.category.color, display: 'inline-block' }} />
                            {article.category.name}
                          </span>
                          {' · '}
                          {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Draft'}
                          {article.readingTime && ` · ${article.readingTime} min`}
                        </span>
                      </div>
                      <span className={`${styles.status} ${article.published ? styles.published : styles.draft}`}>
                        {article.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.25}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Recent Subscribers</h3>
            {subscribers.length === 0 ? (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', padding: '1rem 0' }}>No subscribers yet.</p>
            ) : (
              <div className={styles.articleList}>
                {subscribers.slice(0, 10).map((sub) => (
                  <div key={sub.id} className={styles.articleItem}>
                    <div>
                      <h4 className={styles.articleTitle}>{sub.email}</h4>
                      <span className={styles.articleMeta}>
                        <Calendar size={12} /> Subscribed {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`${styles.status} ${sub.active ? styles.published : styles.draft}`}>
                      {sub.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
