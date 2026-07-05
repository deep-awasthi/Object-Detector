'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Code, Cpu, BookOpen, Cloud, Brain, Database } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

const iconMap: Record<string, React.ReactNode> = {
  server: <Code size={24} />,
  cpu: <Cpu size={24} />,
  coffee: <BookOpen size={24} />,
  database: <Database size={24} />,
  cloud: <Cloud size={24} />,
  brain: <Brain size={24} />,
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  color: string
  icon: string
  _count: { articles: number }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => {})
  }, [])

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <h1 className={styles.title}>Categories</h1>
            <p className={styles.subtitle}>Explore topics organized by subject area.</p>
          </div>
        </AnimatedSection>

        <div className={styles.grid}>
          {categories.map((cat, i) => (
            <AnimatedSection key={cat.slug} delay={i * 0.08}>
              <Link href={`/categories/${cat.slug}`} className={styles.card}>
                <div className={styles.icon} style={{ background: cat.color + '15', color: cat.color }}>
                  {iconMap[cat.icon] || <Code size={24} />}
                </div>
                <h2 className={styles.name}>{cat.name}</h2>
                <p className={styles.desc}>{cat.description}</p>
                <p className={styles.count}>{cat._count.articles} articles</p>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </div>
  )
}
