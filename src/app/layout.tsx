import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: 'DevAtlas — Crafting knowledge for engineers',
    template: '%s | DevAtlas',
  },
  description: 'Deep dives into backend engineering, distributed systems, system design, cloud architecture, and machine learning. Written by an engineer, for engineers.',
  keywords: ['backend engineering', 'distributed systems', 'system design', 'cloud architecture', 'machine learning', 'java', 'software engineering', 'microservices', 'kubernetes', 'spring boot', 'devops'],
  authors: [{ name: 'DevAtlas' }],
  creator: 'DevAtlas',
  publisher: 'DevAtlas',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'DevAtlas',
    title: 'DevAtlas — Crafting knowledge for engineers',
    description: 'Deep dives into backend engineering, distributed systems, system design, cloud architecture, and machine learning.',
    images: [{ url: '/icon.svg', width: 512, height: 512, alt: 'DevAtlas' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevAtlas — Crafting knowledge for engineers',
    description: 'Deep dives into backend engineering, distributed systems, system design, cloud architecture, and machine learning.',
    images: ['/icon.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: {
    types: { 'application/rss+xml': [{ url: '/sitemap.xml', title: 'DevAtlas RSS' }] },
  },
  verification: {},
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const isAdmin = h.get('x-is-admin') === 'true'

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body>
        <ThemeProvider>
          {isAdmin ? (
            <>{children}</>
          ) : (
            <>
              <Navigation />
              <main style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>{children}</main>
              <Footer />
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
