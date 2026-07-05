'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Newsletter } from '@/components/Newsletter'
import styles from './page.module.css'

interface Article {
  slug: string
  title: string
  excerpt: string
  readingTime: number
  publishedAt: string | null
  coverImage: string | null
  category: { name: string; color: string }
}

export default function HomePage() {
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const [latestArticles, setLatestArticles] = useState<Article[]>([])
  const [loaded, setLoaded] = useState(false)
  const [newsletterEnabled, setNewsletterEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/articles?published=true&featured=true&limit=2').then(r => r.json()),
      fetch('/api/articles?published=true&limit=4').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([featured, latest, settings]) => {
      setFeaturedArticles(featured.articles || [])
      setLatestArticles(latest.articles || [])
      setNewsletterEnabled(settings.newsletterEnabled ?? true)
      setLoaded(true)
    }).catch(() => {
      setNewsletterEnabled(false)
      setLoaded(true)
    })
  }, [])

  return (
    <>
      <LoadingScreen />

      <section className={styles.hero}>
        <div className="container">
          <AnimatedSection>
            <motion.h1
              className={styles.heroTitle}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.9 }}
            >
              DevAtlas
            </motion.h1>
          </AnimatedSection>
          <AnimatedSection delay={2.1}>
            <p className={styles.heroTagline}>Crafting knowledge for engineers.</p>
          </AnimatedSection>
          <AnimatedSection delay={2.3}>
            <p className={styles.heroDescription}>
              Deep dives into backend engineering, distributed systems, system design,
              cloud architecture, and machine learning. Written by an engineer, for engineers.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={2.5}>
            <div className={styles.heroActions}>
              <Link href="/articles" className="btn btn-primary">
                Read Articles <ArrowRight size={16} />
              </Link>
              <Link href="/categories" className="btn btn-secondary">
                Browse Categories
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Featured */}
      <section className={styles.featured}>
        <div className="container">
          <AnimatedSection>
            <div className={styles.sectionHeader}>
              <h2>Featured Articles</h2>
              {featuredArticles.length > 0 && <Link href="/articles">View all <ArrowRight size={14} /></Link>}
            </div>
          </AnimatedSection>
          {loaded && featuredArticles.length > 0 ? (
            <div className={styles.featuredGrid}>
              {featuredArticles.map((article, i) => (
                <AnimatedSection key={article.slug} delay={i * 0.1}>
                  <Link href={`/articles/${article.slug}`} className={styles.featuredCard}>
                    {article.coverImage ? (
                      <img src={article.coverImage} alt={article.title} className={styles.featuredCover} />
                    ) : (
                      <div className={styles.featuredCover} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={48} style={{ color: 'var(--color-text-tertiary)' }} />
                      </div>
                    )}
                    <div className={styles.featuredContent}>
                      <span className={styles.featuredCategory}>{article.category.name}</span>
                      <h3 className={styles.featuredTitle}>{article.title}</h3>
                      <p className={styles.featuredExcerpt}>{article.excerpt}</p>
                      <div className={styles.featuredMeta}>
                        {article.publishedAt && <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                        <span>·</span>
                        <span>{article.readingTime} min read</span>
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          ) : loaded ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '2rem 0' }}>No featured articles yet.</p>
          ) : null}
        </div>
      </section>

      {/* Latest */}
      <section className={styles.latest}>
        <div className="container">
          <AnimatedSection>
            <div className={styles.sectionHeader}>
              <h2>Latest Articles</h2>
              {latestArticles.length > 0 && <Link href="/articles">View all <ArrowRight size={14} /></Link>}
            </div>
          </AnimatedSection>
          {loaded && latestArticles.length > 0 ? (
            <div className={styles.latestList}>
              {latestArticles.map((article, i) => (
                <AnimatedSection key={article.slug} delay={i * 0.08}>
                  <Link href={`/articles/${article.slug}`} className={styles.latestCard}>
                    <div className={styles.latestCover} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={36} style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                    <div className={styles.latestContent}>
                      <span className={styles.latestCategory}>{article.category.name}</span>
                      <h3 className={styles.latestTitle}>{article.title}</h3>
                      <p className={styles.latestExcerpt}>{article.excerpt}</p>
                      <div className={styles.latestMeta}>
                        {article.publishedAt && new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}{article.readingTime} min read
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          ) : loaded ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '2rem 0' }}>No articles yet.</p>
          ) : null}
        </div>
      </section>

      {/* About Preview */}
      <section className={styles.aboutPreview}>
        <div className="container">
          <AnimatedSection>
            <div className={styles.aboutContent}>
              <h2>About Me</h2>
              <p>
                I&apos;m a software engineer passionate about building scalable systems and
                sharing knowledge with the engineering community. My focus areas include
                backend engineering, distributed systems, and cloud architecture.
              </p>
              <Link href="/about" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                Learn More <ArrowRight size={16} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Newsletter */}
      {newsletterEnabled !== false && (
        <section className={styles.newsletter}>
          <div className="container">
            <AnimatedSection>
              <h2 className={styles.newsletterTitle}>Stay Updated</h2>
              <p className={styles.newsletterDesc}>
                Get the latest articles and insights delivered to your inbox. No spam, ever.
              </p>
              <Newsletter />
            </AnimatedSection>
          </div>
        </section>
      )}
    </>
  )
}
