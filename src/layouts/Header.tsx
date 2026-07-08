import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Menu, X } from 'lucide-react'
import styles from './Header.module.css'
import upcomingFeatures from '../data/upcoming.json'
import { formatCategoryName, CATEGORY_SLUGS } from '../utils/categories'

interface HeaderProps {
  onSearchOpen: () => void
}

export const Header: React.FC<HeaderProps> = ({ onSearchOpen }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)



  return (
    <header className={`${styles.header} glass`}>
      <div className={styles.container}>
        <div className={styles.logoSection}>
          <Link to="/" className={styles.logo} onClick={() => setMobileMenuOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.logoIcon}>
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
              <line x1="14" y1="4" x2="10" y2="20" />
            </svg>
            <span className={styles.logoText}>DevAtlas</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <button onClick={onSearchOpen} className={styles.desktopSearch} aria-label="Search articles">
            <Search size={18} />
          </button>
          
          <Link to="/" className={styles.navLink}>Home</Link>
          <Link to="/articles" className={styles.navLink}>Articles</Link>
          <Link to="/categories" className={styles.navLink}>Categories</Link>

          {Array.isArray(upcomingFeatures) && upcomingFeatures.length > 0 && (
            <Link to="/upcoming" className={`${styles.navLink} ${styles.upcomingNavLink}`}>Upcoming</Link>
          )}

          <Link to="/about" className={styles.navLink}>About</Link>
        </nav>

        {/* Actions Menu */}
        <div className={styles.actions}>
          <button onClick={onSearchOpen} className={`${styles.actionButton} ${styles.mobileSearch}`} aria-label="Search articles">
            <Search size={18} />
          </button>
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className={`${styles.actionButton} ${styles.mobileMenuToggle}`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className={`${styles.mobileNav} glass`}>
          <Link to="/" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/articles" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Articles</Link>
          <Link to="/categories" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Categories</Link>
          {Array.isArray(upcomingFeatures) && upcomingFeatures.length > 0 && (
            <Link to="/upcoming" className={`${styles.mobileNavLink} ${styles.upcomingNavLink}`} onClick={() => setMobileMenuOpen(false)}>Upcoming</Link>
          )}
          <Link to="/about" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>About</Link>
          
          <button 
            onClick={() => {
              setMobileMenuOpen(false)
              onSearchOpen()
            }} 
            className={styles.mobileNavLink}
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Search
          </button>

          <div className={styles.mobileSectionTitle}>Categories</div>
          <div className={styles.mobileCategoryGrid}>
            {CATEGORY_SLUGS.map(cat => (
              <Link
                key={cat}
                to={`/${cat}`}
                className={styles.mobileCategoryLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                {formatCategoryName(cat)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
