'use client'

import { useEffect, useState } from 'react'
import { Trash2, Mail } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

interface Subscriber {
  id: string
  email: string
  active: boolean
  createdAt: string
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/subscribers')
      .then((r) => r.json())
      .then((data) => setSubscribers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Remove this subscriber?')) return
    const res = await fetch(`/api/subscribers/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSubscribers((prev) => prev.filter((s) => s.id !== id))
    }
  }

  const activeCount = subscribers.filter((s) => s.active).length

  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Subscribers</h1>
              <p className={styles.subtitle}>{activeCount} active subscribers</p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.colEmail}>Email</span>
              <span className={styles.colDate}>Subscribed</span>
              <span className={styles.colStatus}>Status</span>
              <span className={styles.colActions}>Actions</span>
            </div>
            {loading ? (
              <p style={{ padding: '2rem', color: 'var(--color-text-tertiary)' }}>Loading subscribers...</p>
            ) : subscribers.length === 0 ? (
              <p style={{ padding: '2rem', color: 'var(--color-text-tertiary)' }}>No subscribers yet.</p>
            ) : (
              subscribers.map((sub) => (
                <div key={sub.id} className={styles.tableRow}>
                  <span className={styles.colEmail}>
                    <Mail size={14} style={{ color: 'var(--color-text-tertiary)', marginRight: '0.5rem' }} />
                    {sub.email}
                  </span>
                  <span className={styles.colDate}>
                    {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className={styles.colStatus}>
                    <span className={`${styles.status} ${sub.active ? styles.active : styles.inactive}`}>
                      {sub.active ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                  <span className={styles.colActions}>
                    <button onClick={() => handleDelete(sub.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
