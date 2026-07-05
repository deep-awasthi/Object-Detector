'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Search } from 'lucide-react'

export default function UnsubscribePage() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem',
    }}>
      {status === 'success' ? (
        <>
          <CheckCircle size={64} style={{ color: '#10B981', marginBottom: '1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Unsubscribed</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>
            You have been unsubscribed from the DevAtlas newsletter. You will no longer receive email notifications.
          </p>
        </>
      ) : status === 'not-found' ? (
        <>
          <Search size={64} style={{ color: 'var(--color-text-tertiary)', marginBottom: '1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Email Not Found</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>
            This email address is not subscribed to the DevAtlas newsletter.
          </p>
        </>
      ) : (
        <>
          <XCircle size={64} style={{ color: '#EF4444', marginBottom: '1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Something Went Wrong</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>
            We couldn&apos;t process your unsubscribe request. Please try again later.
          </p>
        </>
      )}
      <Link href="/" style={{
        padding: '0.75rem 1.5rem',
        background: 'var(--color-text)',
        color: 'var(--color-bg)',
        borderRadius: 'var(--radius-lg)',
        fontWeight: 500,
        textDecoration: 'none',
      }}>
        Back to DevAtlas
      </Link>
    </div>
  )
}
