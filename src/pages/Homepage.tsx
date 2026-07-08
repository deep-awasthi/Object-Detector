import React, { useState, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import articlesIndex from '../articles/index.json'
import { formatCategoryName, getCategoryMeta, getCategoryDescription } from '../utils/categories'
import CategoryIcon from '../components/CategoryIcon'
import CodingAnimation from '../components/CodingAnimation'
import styles from './Homepage.module.css'

interface Article {
  slug: string
  category: string
  title: string
  description: string
  author: string
  date: string
  updated?: string
  cover?: string
  thumbnail?: string
  featured?: boolean
  draft?: boolean
  readingTime: string
  keywords?: string[]
}

interface Particle {
  id: number
  x: number
  y: number
  angle: number
  scale: number
}




export const Homepage: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([])
  const particleIdRef = useRef(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLHeadingElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newParticle: Particle = {
      id: particleIdRef.current++,
      x,
      y,
      angle: (Math.random() - 0.5) * 40,
      scale: 0.8 + Math.random() * 0.4,
    }

    setParticles(prev => [...prev.slice(-12), newParticle])

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id))
    }, 800)
  }

  const publishedArticles = useMemo(
    () => (articlesIndex as Article[]).filter(a => !a.draft),
    []
  )

  // Sort articles by date descending
  const sortedArticles = useMemo(
    () => [...publishedArticles].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    [publishedArticles]
  )

  // Show exactly the last 3 articles added
  const latestArticles = useMemo(
    () => sortedArticles.slice(0, 3),
    [sortedArticles]
  )

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    publishedArticles.forEach(a => {
      counts[a.category] = (counts[a.category] || 0) + 1
    })
    return counts
  }, [publishedArticles])

  // Get the last 3 categories where articles were added
  const lastThreeCategories = useMemo(() => {
    const cats: string[] = []
    for (const art of sortedArticles) {
      const cat = art.category.toLowerCase()
      if (!cats.includes(cat)) {
        cats.push(cat)
      }
      if (cats.length === 3) break
    }
    return cats
  }, [sortedArticles])

  // formatCategoryName is imported from utils/categories

  return (
    <>
      <Helmet>
        <title>DevAtlas — Premium Filesystem-Driven Technical Publication</title>
        <meta name="description" content="Read expert engineering articles, distributed system deep-dives, database guides, and architectural design reviews on DevAtlas." />
        <meta property="og:title" content="DevAtlas — Premium Technical Publication" />
        <meta property="og:description" content="Expert engineering articles, distributed system deep-dives, database guides, and architectural design reviews." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className={styles.homepage}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroBackground}>
            <div className={styles.gridOverlay}></div>
            <div className={styles.radialGradient}></div>
          </div>
          <div className={styles.heroContainer}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={styles.heroContent}
            >
              <div className={styles.badge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.45))', marginRight: '6px' }}>
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                  <line x1="14" y1="4" x2="10" y2="20" />
                </svg>
                <span>Master Software Engineering</span>
              </div>
              <h1 
                className={styles.heroTitle}
                onMouseMove={handleMouseMove}
              >
                The Engineering <br />
                <span>Atlas for Developers</span>
                {particles.map(p => (
                  <span
                    key={p.id}
                    className={styles.trailParticle}
                    style={{
                      left: p.x,
                      top: p.y,
                      '--angle': `${p.angle}deg`,
                    } as React.CSSProperties}
                  >
                    &lt;/&gt;
                  </span>
                ))}
              </h1>
              <p className={styles.heroDesc}>
                Architectural deep-dives, database internals, and systems engineering papers published with the reading experience of a premium magazine.
              </p>
              <div className={styles.heroActions}>
                <Link to="/articles?sort=category" className={styles.primaryButton}>
                  Let's Learn Engineering <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Empty State */}
        {publishedArticles.length === 0 && (
          <section id="setup" className={styles.emptySection}>
            <div className={styles.emptyCard}>
              <h3>Curating software engineering experience for you</h3>
              <p>Please wait</p>
              <CodingAnimation />
            </div>
          </section>
        )}

        {publishedArticles.length > 0 && (
          <div className={styles.mainContainer}>
            {/* Latest Articles */}
            <section className={styles.latestSection}>
              <h2 className={styles.sectionTitle}>Latest Releases</h2>
              <div className={styles.articlesGrid}>
                {latestArticles.map((article, idx) => (
                  <motion.article 
                    key={article.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className={styles.articleCard}
                  >
                    <Link to={`/${article.category}/${article.slug}`} className={styles.cardImageLink}>
                      <img 
                        src={article.thumbnail || article.cover || '/placeholder-thumb.webp'} 
                        alt={article.title} 
                        className={styles.cardImage}
                        loading="lazy"
                      />
                    </Link>
                    <div className={styles.cardContent}>
                      <div className={styles.cardMeta}>
                        <span className={styles.cardCategory}>{formatCategoryName(article.category)}</span>
                        <span className={styles.cardDot}>•</span>
                        <span>{article.readingTime}</span>
                      </div>
                      <h3 className={styles.cardTitle}>
                        <Link to={`/${article.category}/${article.slug}`}>{article.title}</Link>
                      </h3>
                      <p className={styles.cardDesc}>{article.description}</p>
                      <div className={styles.cardFooter}>
                        <span className={styles.cardDate}>
                          {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <Link to={`/${article.category}/${article.slug}`} className={styles.cardLink}>
                          Read <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>

            {/* Categories Section */}
            {lastThreeCategories.length > 0 && (
              <section className={styles.categoriesSection}>
                <div className={styles.categoriesHeader}>
                  <h2 className={styles.sectionTitle}>Recent Topics</h2>
                  <Link to="/categories" className={styles.moreCategoriesButton}>
                    More Topics <ArrowRight size={16} />
                  </Link>
                </div>

                <div className={styles.categoriesGrid}>
                  {lastThreeCategories.map(cat => {
                    const displayName = formatCategoryName(cat)
                    const desc = getCategoryDescription(cat)
                    const meta = getCategoryMeta(cat)
                    const accentColor = meta?.color ?? 'var(--accent-primary)'

                    return (
                      <Link
                        key={cat}
                        to={`/${cat}`}
                        className={styles.categoryCard}
                        style={{ '--cat-color': accentColor } as React.CSSProperties}
                      >
                        <div className={styles.categoryCardHeader}>
                          <div className={styles.categoryIconWrap} style={{ color: accentColor }}>
                            <CategoryIcon slug={cat} size={24} />
                          </div>
                          <span className={styles.categoryCount}>
                            {categoryCounts[cat] || 0} {(categoryCounts[cat] || 0) === 1 ? 'article' : 'articles'}
                          </span>
                        </div>
                        <h3 className={styles.categoryCardTitle}>{displayName}</h3>
                        <p className={styles.categoryCardDesc}>{desc}</p>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default Homepage
