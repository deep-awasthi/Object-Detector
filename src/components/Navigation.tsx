'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sun, Moon, Menu, X } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import styles from './Navigation.module.css'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/articles', label: 'Articles' },
  { href: '/categories', label: 'Categories' },
  { href: '/upcoming', label: 'Upcoming', highlight: true },
  { href: '/about', label: 'About' },
]

export function Navigation() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hasUpcoming, setHasUpcoming] = useState(true)

  useEffect(() => {
    fetch('/api/upcoming-features')
      .then((r) => r.json())
      .then((data) => setHasUpcoming(Array.isArray(data) && data.length > 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          DevAtlas
        </Link>

        <div className={styles.links}>
          {navLinks.map((link) => {
            if (link.highlight && !hasUpcoming) return null
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${pathname === link.href ? styles.active : ''} ${link.highlight ? styles.highlight : ''}`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className={styles.actions}>
          <Link href="/search" className={styles.iconBtn} aria-label="Search">
            <Search size={20} />
          </Link>
          <button
            className={styles.iconBtn}
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className={`${styles.iconBtn} ${styles.mobileToggle}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {navLinks.map((link) => {
              if (link.highlight && !hasUpcoming) return null
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''} ${link.highlight ? styles.highlight : ''}`}
                >
                  {link.label}
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
