import Link from 'next/link'
import { Github, Linkedin } from 'lucide-react'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>DevAtlas</Link>
            <p className={styles.tagline}>Crafting knowledge for engineers.</p>
          </div>
          <div className={styles.linksGroup}>
            <h4 className={styles.linksTitle}>Navigation</h4>
            <Link href="/" className={styles.link}>Home</Link>
            <Link href="/articles" className={styles.link}>Articles</Link>
            <Link href="/categories" className={styles.link}>Categories</Link>
            <Link href="/about" className={styles.link}>About</Link>
          </div>
          <div className={styles.linksGroup}>
            <h4 className={styles.linksTitle}>Connect</h4>
            <a href="https://github.com/deep-awasthi" target="_blank" rel="noopener noreferrer" className={styles.link}>
              <Github size={16} /> GitHub
            </a>
            <a href="https://linkedin.com/indeep-awasthi" target="_blank" rel="noopener noreferrer" className={styles.link}>
              <Linkedin size={16} /> LinkedIn
            </a>
          </div>
        </div>
        <div className={styles.bottom}>
          <p className={styles.copyright}>© {new Date().getFullYear()} DevAtlas. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
