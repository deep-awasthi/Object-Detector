'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, Calendar, ArrowLeft, Share2, Twitter, Linkedin, Link as LinkIcon, Bookmark } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import { Newsletter } from '@/components/Newsletter'
import styles from './page.module.css'

interface Article {
  slug: string
  title: string
  excerpt: string
  contentHtml: string
  readingTime: number
  publishedAt: string | null
  coverImage: string | null
  category: { name: string }
  author: { name: string }
  tags: { tag: { name: string } }[]
}

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const [article, setArticle] = useState<Article | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    setCurrentUrl(window.location.href)
    function onScroll() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.scrollY / docHeight) * 100
      setReadingProgress(Math.min(100, progress))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    params.then(({ slug }) => {
      fetch(`/api/articles/${slug}`)
        .then((res) => {
          if (!res.ok) throw new Error()
          return res.json()
        })
        .then((data) => {
          if (data.error) throw new Error()
          setArticle(data)
        })
        .catch(() => setNotFound(true))
    })
  }, [params])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (notFound) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div style={{ textAlign: 'center', padding: '6rem 0' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Oops! Wrong turn.</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>This article doesn&apos;t exist or has been removed.</p>
            <Link href="/articles" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
              <ArrowLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Back to Articles
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p style={{ padding: '8rem 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.excerpt,
            author: { '@type': 'Person', name: article.author.name },
            publisher: { '@type': 'Organization', name: 'DevAtlas' },
            datePublished: article.publishedAt,
            dateModified: article.publishedAt,
            mainEntityOfPage: { '@type': 'WebPage', '@id': `${typeof window !== 'undefined' ? window.location.origin : ''}/articles/${article.slug}` },
            articleSection: article.category.name,
            keywords: article.tags.map((t) => t.tag.name).join(', '),
            wordCount: article.contentHtml.replace(/<[^>]*>/g, '').split(/\s+/).length,
          }),
        }}
      />

      {/* Reading Progress Bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
        background: 'var(--color-primary)', zIndex: 1001,
        width: `${readingProgress}%`, transition: 'width 0.1s',
      }} />

      <div className={styles.container}>
        <AnimatedSection>
          <div className={styles.header}>
            <Link href="/articles" className={styles.backLink}>
              <ArrowLeft size={16} /> Back to Articles
            </Link>
            <span className={styles.category}>{article.category.name}</span>
            <h1 className={styles.title}>{article.title}</h1>
            <p className={styles.excerpt}>{article.excerpt}</p>
            <div className={styles.meta}>
              {article.publishedAt && <span className={styles.metaItem}><Calendar size={14} /> {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
              <span className={styles.metaItem}><Clock size={14} /> {article.readingTime} min read</span>
              <span className={styles.metaItem}>By {article.author.name}</span>
            </div>
          </div>
        </AnimatedSection>

        {article.coverImage ? (
          <img src={article.coverImage} alt={article.title} style={{ width: '100%', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }} />
        ) : (
          <div className={styles.coverImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: '1.125rem' }}>Cover Image</span>
          </div>
        )}

        <AnimatedSection delay={0.2}>
          <div
            className={`article-content ${styles.content}`}
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />
        </AnimatedSection>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', margin: '2rem 0', flexWrap: 'wrap' }}>
            {article.tags.map((t) => (
              <span key={t.tag.name} className="tag">{t.tag.name}</span>
            ))}
          </div>
        )}

        {/* Share */}
        <div className={styles.share}>
          <span className={styles.shareLabel}>Share this article</span>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noopener noreferrer" className={styles.shareBtn}>
            <Twitter size={18} />
          </a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noopener noreferrer" className={styles.shareBtn}>
            <Linkedin size={18} />
          </a>
          <button onClick={handleCopyLink} className={styles.shareBtn}>
            <LinkIcon size={18} />
          </button>
          <button className={styles.shareBtn}>
            <Bookmark size={18} />
          </button>
        </div>

        {/* Newsletter */}
        <Newsletter />
      </div>
    </div>
  )
}
