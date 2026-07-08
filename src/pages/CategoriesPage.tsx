import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import articlesIndex from '../articles/index.json'
import { CATEGORY_SLUGS, formatCategoryName, getCategoryMeta, getCategoryDescription } from '../utils/categories'
import CategoryIcon from '../components/CategoryIcon'
import CodingAnimation from '../components/CodingAnimation'
import styles from './CategoriesPage.module.css'

interface Article {
  slug: string
  category: string
  draft?: boolean
}

const DEVELOPMENT_QUOTES = [
  { text: "Good software, like wine, takes time.", author: "Joel Spolsky" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Controlling complexity is the essence of computer programming.", author: "Brian Kernighan" },
  { text: "Indeed, the ratio of time spent reading versus writing is over 10 to 1. We are constantly reading old code to write new code.", author: "Robert C. Martin" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" }
]

export const CategoriesPage: React.FC = () => {
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    ;(articlesIndex as Article[]).forEach(art => {
      if (!art.draft) {
        const cat = art.category.toLowerCase()
        counts[cat] = (counts[cat] || 0) + 1
      }
    })
    return counts
  }, [])

  const totalCount = useMemo(() => {
    return Object.values(categoryCounts).reduce((sum, val) => sum + val, 0)
  }, [categoryCounts])

  const quote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * DEVELOPMENT_QUOTES.length)
    return DEVELOPMENT_QUOTES[randomIndex]
  }, [])

  if (totalCount === 0) {
    return (
      <>
        <Helmet>
          <title>Technical Categories — Coming Soon | DevAtlas</title>
        </Helmet>
        <div className={styles.comingSoonPage}>
          <div className={styles.comingSoonCard}>
            <span className={styles.comingSoonBadge}>Categories</span>
            <h1 className={styles.comingSoonTitle}>Something is cooking for you</h1>
            <p className={styles.comingSoonDesc}>
              We are organizing premium software engineering topics and categories. Please wait.
            </p>
            <CodingAnimation />
            
            <div className={styles.quoteArea}>
              <p className={styles.quoteText}>"{quote.text}"</p>
              <span className={styles.quoteAuthor}>— {quote.author}</span>
            </div>

            <div className={styles.comingSoonActions}>
              <Link to="/" className={styles.backLink}>
                <ArrowLeft size={16} /> Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }


  return (
    <>
      <Helmet>
        <title>Technical Categories — DevAtlas</title>
        <meta name="description" content="Explore articles and guides organized by engineering category, including High Level Design, Spring Boot, Java, Low Level Design, DSA, Python, Go, Machine Learning, and more." />
      </Helmet>

      <div className={styles.categoriesPage}>
        <div className={styles.banner}>
          <span className={styles.bannerSubtitle}>Categories</span>
          <h1 className={styles.bannerTitle}>Explore Topics</h1>
          <p className={styles.bannerDesc}>
            Deep dive into technical categories covering algorithmic complexities, architectural design, database tunings, and platform scalabilities.
          </p>
        </div>

        <div className={styles.grid}>
          {CATEGORY_SLUGS.map((cat, idx) => {
            const count = categoryCounts[cat] || 0
            if (count === 0) return null   // hide categories with no articles

            const displayName = formatCategoryName(cat)
            const desc = getCategoryDescription(cat)
            const meta = getCategoryMeta(cat)
            const accentColor = meta?.color ?? 'var(--accent-primary)'

            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Link
                  to={`/${cat}`}
                  className={styles.card}
                  style={{ '--cat-color': accentColor } as React.CSSProperties}
                >
                  <div className={styles.cardMeta}>
                    <div className={styles.cardIconWrap} style={{ color: accentColor }}>
                      <CategoryIcon slug={cat} size={26} />
                    </div>
                    <span className={styles.cardCount}>
                      {count} {count === 1 ? 'article' : 'articles'}
                    </span>
                  </div>
                  <h2 className={styles.cardTitle}>{displayName}</h2>
                  <p className={styles.cardDesc}>{desc}</p>
                  <div className={styles.cardLink}>
                    Explore Guides <ArrowRight size={14} />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default CategoriesPage
