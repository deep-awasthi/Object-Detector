'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Clock } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface Article {
  slug: string
  title: string
  excerpt: string
  readingTime: number
  publishedAt: string | null
  category: { name: string; color: string }
  tags: { tag: { name: string } }[]
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/articles?published=true&limit=50')
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles || [])
        const cats = [...new Set((data.articles || []).map((a: Article) => a.category.name))] as string[]
        setCategories(cats)
      })
      .catch(() => {})
  }, [])

  const filtered = activeFilter === 'All'
    ? articles
    : articles.filter((a) => a.category.name === activeFilter)

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <h1 className={styles.title}>Articles</h1>
            <p className={styles.subtitle}>Deep dives into engineering topics that matter.</p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className={styles.filters}>
            {['All', ...categories].map((cat) => (
              <button
                key={cat}
                className={`${styles.filterBtn} ${activeFilter === cat ? styles.active : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </AnimatedSection>

        <div className={styles.grid}>
          {filtered.map((article, i) => (
            <AnimatedSection key={article.slug} delay={i * 0.06}>
              <Link href={`/articles/${article.slug}`} className={styles.card}>
                <div className={styles.cover}>
                  <BookOpen size={36} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <div className={styles.content}>
                  <span className={styles.category}>{article.category.name}</span>
                  <h2 className={styles.title2}>{article.title}</h2>
                  <p className={styles.excerpt}>{article.excerpt}</p>
                  <div className={styles.tags}>
                    {article.tags.map((t) => (
                      <span key={t.tag.name} className="tag">{t.tag.name}</span>
                    ))}
                  </div>
                  <div className={styles.meta}>
                    <Clock size={14} />
                    <span>{article.readingTime} min</span>
                    {article.publishedAt && (
                      <>
                        <span>·</span>
                        <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>No articles found in this category.</div>
        )}
      </div>
    </div>
  )
}
