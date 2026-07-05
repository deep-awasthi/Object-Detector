'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Search as SearchIcon, X, BookOpen, ArrowRight } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface SearchResult {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  readingTime: string
}

const mockArticles: SearchResult[] = [
  { slug: 'building-scalable-microservices', title: 'Building Scalable Microservices with Spring Boot and Kubernetes', excerpt: 'A deep dive into designing, building, and deploying production-ready microservices.', category: 'Backend Engineering', date: 'Dec 15, 2024', readingTime: '12 min' },
  { slug: 'system-design-interview-guide', title: 'The Complete System Design Interview Guide for 2025', excerpt: 'Everything you need to ace system design interviews at top tech companies.', category: 'System Design', date: 'Dec 10, 2024', readingTime: '18 min' },
  { slug: 'distributed-consensus-algorithms', title: 'Understanding Distributed Consensus: Raft vs Paxos', excerpt: 'How distributed systems agree on a single value despite failures.', category: 'Distributed Systems', date: 'Dec 8, 2024', readingTime: '15 min' },
  { slug: 'java-concurrency-deep-dive', title: 'Java Concurrency: From Threads to Virtual Threads', excerpt: 'A comprehensive guide to Java concurrency models and Project Loom.', category: 'Java', date: 'Dec 3, 2024', readingTime: '20 min' },
  { slug: 'cloud-native-architecture', title: 'Cloud-Native Architecture Patterns for Enterprise Applications', excerpt: 'Battle-tested patterns for building resilient cloud-native applications.', category: 'Cloud', date: 'Nov 28, 2024', readingTime: '14 min' },
  { slug: 'ml-model-deployment', title: 'Deploying ML Models in Production: A Practical Guide', excerpt: 'End-to-end guide for deploying machine learning models.', category: 'Machine Learning', date: 'Nov 22, 2024', readingTime: '16 min' },
]

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    const lower = q.toLowerCase()
    const filtered = mockArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        a.excerpt.toLowerCase().includes(lower) ||
        a.category.toLowerCase().includes(lower)
    )
    setResults(filtered)
    setIsSearching(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200)
    return () => clearTimeout(timer)
  }, [query, search])

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <h1 className={styles.title}>Search</h1>
            <p className={styles.subtitle}>Find articles, topics, and insights</p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className={styles.searchBox}>
            <SearchIcon size={20} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search articles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className={styles.clearBtn}>
                <X size={18} />
              </button>
            )}
          </div>
        </AnimatedSection>

        <div className={styles.results}>
          <AnimatePresence mode="wait">
            {query && results.length === 0 && !isSearching && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.empty}
              >
                <BookOpen size={48} />
                <p>No articles found for &ldquo;{query}&rdquo;</p>
              </motion.div>
            )}

            {results.map((result, i) => (
              <motion.div
                key={result.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/articles/${result.slug}`} className={styles.resultCard}>
                  <div className={styles.resultContent}>
                    <span className={styles.resultCategory}>{result.category}</span>
                    <h3 className={styles.resultTitle}>{result.title}</h3>
                    <p className={styles.resultExcerpt}>{result.excerpt}</p>
                    <div className={styles.resultMeta}>
                      {result.date} · {result.readingTime}
                    </div>
                  </div>
                  <ArrowRight size={18} className={styles.resultArrow} />
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
