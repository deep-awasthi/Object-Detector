import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { searchArticles, initSearch } from '../services/search'
import type { SearchEntry } from '../services/search'
import styles from './SearchModal.module.css'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchEntry[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      initSearch()
      inputRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setQuery('')
      setResults([])
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle typing & query execution
  const handleQueryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (val.trim()) {
      const res = await searchArticles(val)
      setResults(res)
      setSelectedIndex(0)
    } else {
      setResults([])
    }
  }

  // Handle keyboard shortcuts inside input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (results.length > 0 ? (prev + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleNavigate(results[selectedIndex].category, results[selectedIndex].slug)
      }
    }
  }

  const handleNavigate = (category: string, slug: string) => {
    navigate(`/${category}/${slug}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.15 }}
        className={styles.modal}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search articles, headings, content..."
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            className={styles.input}
          />
          <button onClick={onClose} className={styles.closeButton} aria-label="Close search">
            <X size={20} />
          </button>
        </div>

        <div className={styles.resultsContainer}>
          {query.trim() === '' ? (
            <div className={styles.placeholderState}>
              <p>Type to search DevAtlas articles instantly.</p>
              <div className={styles.shortcuts}>
                <span>ESC to close</span>
                <span>↑↓ to navigate</span>
                <span>↵ to open</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className={styles.placeholderState}>
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <ul className={styles.resultsList}>
              {results.map((item, index) => (
                <li
                  key={item.slug}
                  className={`${styles.resultItem} ${index === selectedIndex ? styles.selected : ''}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => handleNavigate(item.category, item.slug)}
                >
                  <BookOpen size={16} className={styles.resultIcon} />
                  <div className={styles.resultDetails}>
                    <span className={styles.resultTitle}>{item.title}</span>
                    <span className={styles.resultDesc}>{item.description}</span>
                    <div className={styles.resultTags}>
                      <span className={styles.categoryBadge}>{item.category}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className={styles.arrowIcon} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default SearchModal
