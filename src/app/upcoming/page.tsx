'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Rocket, Wrench } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface UpcomingFeature {
  id: string
  title: string
  description: string
  status: string
}

export default function UpcomingPage() {
  const [features, setFeatures] = useState<UpcomingFeature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/upcoming-features')
      .then((r) => r.json())
      .then((data) => setFeatures(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className={styles.header}>
            <h1 className={styles.title}>Upcoming Features</h1>
            <p className={styles.subtitle}>What we&apos;re working on next</p>
          </div>
        </AnimatedSection>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '4rem 0' }}>Loading...</p>
        ) : features.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <Rocket size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem' }}>No upcoming features announced yet.</p>
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9375rem', marginTop: '0.5rem' }}>Check back soon!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {features.map((feature, i) => (
              <AnimatedSection key={feature.id} delay={i * 0.08}>
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={`${styles.tag} ${feature.status === 'in-development' ? styles.inDev : styles.comingSoon}`}>
                      {feature.status === 'in-development' ? <><Wrench size={14} /> In Development</> : <><Rocket size={14} /> Coming Soon</>}
                    </span>
                  </div>
                  <h2 className={styles.cardTitle}>{feature.title}</h2>
                  <p className={styles.cardDesc}>{feature.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
