'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, ArrowLeft, BookOpen } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface Article {
  slug: string
  title: string
  excerpt: string
  readingTime: number
  publishedAt: string | null
}

interface CategoryData {
  name: string
  description: string
  articles: Article[]
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const [category, setCategory] = useState<CategoryData | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    params.then(({ slug }) => {
      fetch(`/api/categories/${slug}`)
        .then((res) => {
          if (!res.ok) throw new Error()
          return res.json()
        })
        .then((data) => {
          if (data.error) throw new Error()
          setCategory(data)
        })
        .catch(() => setNotFound(true))
    })
  }, [params])

  if (notFound) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div style={{ textAlign: 'center', padding: '6rem 0' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Oops! Wrong turn.</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>This category doesn&apos;t exist or has been removed.</p>
            <Link href="/categories" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
              <ArrowLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Back to Categories
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className={styles.page}>
        <div className="container">
          <p style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <Link href="/categories" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '2rem' }}>
            <ArrowLeft size={16} /> All Categories
          </Link>
          <div className={styles.header}>
            <h1 className={styles.title}>{category.name}</h1>
            <p className={styles.subtitle}>{category.description}</p>
          </div>
        </AnimatedSection>

        <div className={styles.grid}>
          {category.articles.map((article, i) => (
            <AnimatedSection key={article.slug} delay={i * 0.08}>
              <Link href={`/articles/${article.slug}`} className={styles.card}>
                <div className={styles.articleCover}>
                  <BookOpen size={32} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <div className={styles.articleContent}>
                  <span className={styles.articleCategory}>{category.name}</span>
                  <h2 className={styles.articleTitle}>{article.title}</h2>
                  <p className={styles.articleExcerpt}>{article.excerpt}</p>
                  <div className={styles.articleMeta}>
                    <Clock size={14} /> {article.readingTime} min
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
          {category.articles.length === 0 && (
            <p style={{ color: 'var(--color-text-secondary)', gridColumn: '1 / -1' }}>No articles in this category yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
