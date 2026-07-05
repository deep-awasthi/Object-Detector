'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { LayoutDashboard, FileText, Folder, Tag, Image, Users, Send, BarChart3, Rocket, Settings, LogOut, ChevronLeft, User } from 'lucide-react'
import styles from './layout.module.css'

const sidebarLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/dashboard/articles', label: 'Articles', icon: FileText },
  { href: '/admin/dashboard/categories', label: 'Categories', icon: Folder },
  { href: '/admin/dashboard/tags', label: 'Tags', icon: Tag },
  { href: '/admin/dashboard/upcoming-features', label: 'Upcoming', icon: Rocket },
  { href: '/admin/dashboard/media', label: 'Media', icon: Image },
  { href: '/admin/dashboard/subscribers', label: 'Subscribers', icon: Users },
  { href: '/admin/dashboard/newsletter', label: 'Newsletter', icon: Send },
  { href: '/admin/dashboard/readers', label: 'Readers', icon: BarChart3 },
  { href: '/admin/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/admin/dashboard/profile', label: 'Profile', icon: User },
]

const publicPaths = ['/admin', '/admin/login']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const isPublic = publicPaths.includes(pathname)

  useEffect(() => {
    if (isPublic) {
      setLoading(false)
      return
    }
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) router.replace('/admin/login')
        else setLoading(false)
      })
      .catch(() => router.replace('/admin/login'))
  }, [router, isPublic])

  // Inactivity timeout — logout after 15 minutes of no activity
  useEffect(() => {
    if (isPublic) return

    let timeout: ReturnType<typeof setTimeout>

    function resetTimer() {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
          .then(() => router.replace('/admin/login'))
      }, 15 * 60 * 1000) // 15 minutes
    }

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach((e) => document.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      clearTimeout(timeout)
      events.forEach((e) => document.removeEventListener(e, resetTimer))
    }
  }, [router, isPublic])

  if (loading) return <div className={styles.loading}>Loading...</div>

  if (isPublic) {
    return <>{children}</>
  }

  function isActive(href: string) {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.backLink}><ChevronLeft size={16} /> Back</Link>
        <div className={styles.sidebarLogo}>DevAtlas</div>
        <nav className={styles.sidebarNav}>
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            return <Link key={link.href} href={link.href} className={`${styles.sidebarLink} ${active ? styles.active : ''}`}><Icon size={18} />{link.label}</Link>
          })}
        </nav>
        <button className={styles.sidebarLink} onClick={async () => { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); router.replace('/admin/login') }}><LogOut size={18} />Logout</button>
      </aside>
      <div className={styles.mainArea}>
        <main className={styles.main}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>{children}</motion.div>
        </main>
        <footer className={styles.footer}>
          <p>DevAtlas Admin &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  )
}
