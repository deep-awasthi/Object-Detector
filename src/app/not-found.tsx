import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - var(--nav-height))',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 700, marginBottom: '0.5rem' }}>404</h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Oops! You&apos;ve wandered off the map.</p>
      <p style={{ color: 'var(--color-text-tertiary)', marginBottom: '2rem' }}>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/" style={{
        padding: '0.75rem 1.5rem',
        background: 'var(--color-text)',
        color: 'var(--color-bg)',
        borderRadius: 'var(--radius-lg)',
        fontWeight: 500,
        transition: 'opacity 0.2s',
      }}>
        Back to Home
      </Link>
    </div>
  )
}
