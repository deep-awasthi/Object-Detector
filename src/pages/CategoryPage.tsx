import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowRight, Search, ArrowUpDown, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import articlesIndex from '../articles/index.json'
import { formatCategoryName, getCategoryDescription } from '../utils/categories'
import CodingAnimation from '../components/CodingAnimation'
import styles from './CategoryPage.module.css'

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
}

const ITEMS_PER_PAGE = 6

export const CategoryPage: React.FC = () => {
  const { category = '' } = useParams<{ category: string }>()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'readingTime'>('date')
  const [currentPage, setCurrentPage] = useState(1)

  const formattedCategoryName = useMemo(() => {
    return formatCategoryName(category)
  }, [category])

  const categoryDescription = useMemo(() => {
    return getCategoryDescription(category)
  }, [category])

  // Get all articles for this category
  const categoryArticles = useMemo(() => {
    return (articlesIndex as Article[]).filter(
      a => a.category.toLowerCase() === category.toLowerCase() && !a.draft
    )
  }, [category])

  // Filter and Sort articles
  const processedArticles = useMemo(() => {
    let result = [...categoryArticles]

    // Apply inline search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      }
      if (sortBy === 'readingTime') {
        const minsA = parseInt(a.readingTime) || 0
        const minsB = parseInt(b.readingTime) || 0
        return minsB - minsA
      }
      return 0
    })

    return result
  }, [categoryArticles, searchQuery, sortBy])

  // Pagination logic
  const totalPages = Math.ceil(processedArticles.length / ITEMS_PER_PAGE)
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return processedArticles.slice(start, start + ITEMS_PER_PAGE)
  }, [processedArticles, currentPage])

  // Reset page when queries change
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as any)
    setCurrentPage(1)
  }

  if (categoryArticles.length === 0) {
    return (
      <>
        <Helmet>
          <title>{formattedCategoryName} Guides — Coming Soon | DevAtlas</title>
          <meta name="description" content={`Guides for ${formattedCategoryName} are coming soon.`} />
        </Helmet>
        <div className={styles.comingSoonPage}>
          <div className={styles.comingSoonCard}>
            <span className={styles.comingSoonBadge}>Coming Soon</span>
            <h1 className={styles.comingSoonTitle}>{formattedCategoryName}</h1>
            <p className={styles.comingSoonDesc}>
              We are curating premium software engineering guides for this category. Please wait.
            </p>
            <CodingAnimation />
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
        <title>{formattedCategoryName} Guides — DevAtlas</title>
        <meta name="description" content={categoryDescription} />
        <meta property="og:title" content={`${formattedCategoryName} Guides — DevAtlas`} />
        <meta property="og:description" content={categoryDescription} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className={styles.categoryPage}>
        {/* Banner Section */}
        <section className={styles.banner}>
          <div className={styles.bannerContainer}>
            <span className={styles.bannerSubtitle}>Category Archive</span>
            <h1 className={styles.bannerTitle}>{formattedCategoryName}</h1>
            <p className={styles.bannerDesc}>{categoryDescription}</p>
          </div>
        </section>

        <div className={styles.mainContainer}>
          {/* Controls Bar */}
          <div className={styles.controlsBar}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={16} />
              <input
                type="text"
                placeholder={`Search ${formattedCategoryName} articles...`}
                value={searchQuery}
                onChange={handleQueryChange}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.sortWrapper}>
              <ArrowUpDown size={16} className={styles.sortIcon} />
              <select value={sortBy} onChange={handleSortChange} className={styles.sortSelect}>
                <option value="date">Sort by: Latest</option>
                <option value="title">Sort by: Alphabetical</option>
                <option value="readingTime">Sort by: Reading Time</option>
              </select>
            </div>
          </div>

          <div className={styles.contentLayout}>
            {/* Articles List */}
            <div className={styles.articlesColumn}>
              {paginatedArticles.length === 0 ? (
                <div className={styles.noResults}>
                  <h3>No articles found</h3>
                  <p>Try refining your search query.</p>
                </div>
              ) : (
                <>
                  <div className={styles.articlesGrid}>
                    {paginatedArticles.map((article, idx) => (
                      <motion.article
                        key={article.slug}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
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
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className={styles.pagination}>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={styles.paginationButton}
                        aria-label="Previous Page"
                      >
                        <ChevronLeft size={16} />
                        <span>Previous</span>
                      </button>
                      <span className={styles.pageNumber}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={styles.paginationButton}
                        aria-label="Next Page"
                      >
                        <span>Next</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CategoryPage
