import React, { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { SearchModal } from '../components/SearchModal'
import { AnimatePresence } from 'framer-motion'
import styles from './Layout.module.css'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()

  const showFooter = useMemo(() => {
    const path = location.pathname
    if (path === '/') return true
    
    const parts = path.split('/')
    const reservedRoutes = ['tag', 'categories', 'articles', 'about', 'upcoming']
    if (parts.length === 3 && !reservedRoutes.includes(parts[1])) {
      return true
    }
    return false
  }, [location.pathname])

  // Listen for CMD+K / CTRL+K to trigger search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={styles.layout}>
      <Header onSearchOpen={() => setSearchOpen(true)} />
      
      <main className={styles.main}>
        {children}
      </main>

      {showFooter && <Footer />}

      <AnimatePresence>
        {searchOpen && (
          <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Layout
