import React, { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Search, Calendar, Clock, ArrowRight, BookOpen, ArrowLeft } from 'lucide-react'
import articlesIndex from '../articles/index.json'
import { formatCategoryName } from '../utils/categories'
import CodingAnimation from '../components/CodingAnimation'
import styles from './CategoryPage.module.css'
import articlesStyles from './ArticlesPage.module.css'

interface Article {
  slug: string
  title: string
  description: string
  author: string
  date: string
  updated?: string
  category: string
  readingTime: string
  cover?: string
  thumbnail?: string
  featured?: boolean
  draft?: boolean
}

type SortKey = 'date' | 'alpha' | 'category'

const ITEMS_PER_PAGE = 9

const DEVELOPMENT_QUOTES = [
  { text: "Good software, like wine, takes time.", author: "Joel Spolsky" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Controlling complexity is the essence of computer programming.", author: "Brian Kernighan" },
  { text: "Indeed, the ratio of time spent reading versus writing is over 10 to 1. We are constantly reading old code to write new code.", author: "Robert C. Martin" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" }
]

export const ArticlesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const sortKey = (searchParams.get('sort') as SortKey) || 'date'

  const setSortKey = (key: SortKey) => {
    setSearchParams({ sort: key })
    setCurrentPage(1)
  }

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }


  // All published articles
  const allArticles = useMemo(
    () => (articlesIndex as Article[]).filter(a => !a.draft),
    []
  )

  const quote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * DEVELOPMENT_QUOTES.length)
    return DEVELOPMENT_QUOTES[randomIndex]
  }, [])

  if (allArticles.length === 0) {
    return (
      <>
        <Helmet>
          <title>All Articles &amp; Guides — Coming Soon | DevAtlas</title>
        </Helmet>
        <div className={styles.comingSoonPage}>
          <div className={styles.comingSoonCard}>
            <span className={styles.comingSoonBadge}>Articles</span>
            <h1 className={styles.comingSoonTitle}>Something is cooking for you</h1>
            <p className={styles.comingSoonDesc}>
              We are curating premium software engineering guides and deep dives. Please wait.
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


  // Filter by search
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return allArticles
    const query = searchQuery.toLowerCase()
    return allArticles.filter(
      article =>
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query)
    )
  }, [allArticles, searchQuery])

  // Sort (non-category modes)
  const sortedArticles = useMemo(() => {
    if (sortKey === 'alpha') {
      return [...filteredArticles].sort((a, b) => a.title.localeCompare(b.title))
    }
    // date desc (default + category fall-through for pagination)
    return [...filteredArticles].sort((a, b) => {
      const dateB = new Date(b.date).getTime()
      const dateA = new Date(a.date).getTime()
      if (dateB !== dateA) return dateB - dateA
      return a.title.localeCompare(b.title)
    })
  }, [filteredArticles, sortKey])

  // Grouped by category (for category view)
  const groupedByCategory = useMemo(() => {
    const sorted = [...filteredArticles].sort((a, b) => {
      const catCmp = formatCategoryName(a.category).localeCompare(formatCategoryName(b.category))
      if (catCmp !== 0) return catCmp
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    const groups: { catSlug: string; catName: string; articles: Article[] }[] = []
    const seen: Record<string, number> = {}

    for (const art of sorted) {
      const slug = art.category.toLowerCase()
      const name = formatCategoryName(slug)
      if (seen[slug] === undefined) {
        seen[slug] = groups.length
        groups.push({ catSlug: slug, catName: name, articles: [] })
      }
      groups[seen[slug]].articles.push(art)
    }

    return groups
  }, [filteredArticles])

  // Pagination (only for date / alpha modes)
  const totalPages = Math.ceil(sortedArticles.length / ITEMS_PER_PAGE)
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedArticles.slice(start, start + ITEMS_PER_PAGE)
  }, [sortedArticles, currentPage])

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'date', label: 'By Date' },
    { key: 'alpha', label: 'Alphabetically' },
    { key: 'category', label: 'By Category' },
  ]

  const ArticleCard = ({ article, idx }: { article: Article; idx: number }) => (
    <motion.article
      key={article.slug}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: idx * 0.04 }}
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
          <div className={styles.metaItem}>
            <Calendar size={12} />
            <span>{new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className={styles.metaItem}>
            <Clock size={12} />
            <span>{article.readingTime}</span>
          </div>
        </div>
        <h3 className={styles.cardTitle}>
          <Link to={`/${article.category}/${article.slug}`}>{article.title}</Link>
        </h3>
        <p className={styles.cardDesc}>{article.description}</p>
        <div className={styles.cardFooter}>
          <Link to={`/${article.category}/${article.slug}`} className={styles.cardLink}>
            Read <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.article>
  )

  return (
    <>
      <Helmet>
        <title>All Articles &amp; Guides — DevAtlas</title>
        <meta name="description" content="Browse our complete archive of technical guides, engineering deep dives, and architectural breakdowns." />
        <meta property="og:title" content="All Articles &amp; Guides — DevAtlas" />
        <meta property="og:description" content="Browse our complete archive of technical guides, engineering deep dives, and architectural breakdowns." />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className={styles.categoryPage}>
        {/* Banner */}
        <section className={styles.banner}>
          <div className={styles.bannerContainer}>
            <span className={styles.bannerSubtitle}>Article Archive</span>
            <h1 className={styles.bannerTitle}>All Articles</h1>
            <p className={styles.bannerDesc}>
              A comprehensive library of in-depth guides, designs, algorithms, and technical breakdowns.
            </p>
          </div>
        </section>

        <div className={styles.mainContainer}>
          {/* Controls Bar */}
          <div className={styles.controlsBar}>
            <div className={styles.searchWrapper} style={{ maxWidth: '400px' }}>
              <Search className={styles.searchIcon} size={16} />
              <input
                type="text"
                placeholder="Search all articles..."
                value={searchQuery}
                onChange={handleQueryChange}
                className={styles.searchInput}
              />
            </div>

            {/* Sort Pills */}
            <div className={articlesStyles.sortGroup}>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSortKey(opt.key)}
                  className={`${articlesStyles.sortPill} ${sortKey === opt.key ? articlesStyles.sortPillActive : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
            </div>
          </div>

          {/* ── CATEGORY GROUPED VIEW ── */}
          {sortKey === 'category' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', marginTop: '2rem' }}>
              {groupedByCategory.length === 0 ? (
                <div className={styles.emptyState}>
                  <BookOpen size={48} className={styles.emptyIcon} />
                  <h3>No articles found</h3>
                  <p>Try adjusting your search terms.</p>
                </div>
              ) : (
                groupedByCategory.map(group => (
                  <section key={group.catSlug}>
                    {/* Category heading row */}
                    <div className={articlesStyles.catGroupHeader}>
                      <Link to={`/${group.catSlug}`} className={articlesStyles.catGroupTitle}>
                        {group.catName}
                      </Link>
                      <span className={articlesStyles.catGroupCount}>
                        {group.articles.length} {group.articles.length === 1 ? 'article' : 'articles'}
                      </span>
                    </div>
                    <div className={styles.articlesGrid}>
                      {group.articles.map((article, idx) => (
                        <ArticleCard key={article.slug} article={article} idx={idx} />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          ) : (
            /* ── FLAT LIST VIEW (date / alpha) ── */
            <div style={{ marginTop: '2rem' }}>
              {paginatedArticles.length === 0 ? (
                <div className={styles.emptyState}>
                  <BookOpen size={48} className={styles.emptyIcon} />
                  <h3>No articles found</h3>
                  <p>Try adjusting your search terms or filters.</p>
                </div>
              ) : (
                <div className={styles.articlesGrid}>
                  {paginatedArticles.map((article, idx) => (
                    <ArticleCard key={article.slug} article={article} idx={idx} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={styles.paginationButton}
                    aria-label="Previous Page"
                  >
                    Prev
                  </button>
                  <span className={styles.paginationInfo}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={styles.paginationButton}
                    aria-label="Next Page"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ArticlesPage
