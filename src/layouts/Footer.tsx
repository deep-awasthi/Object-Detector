import React, { useState } from 'react'
import { Send } from 'lucide-react'
import styles from './Footer.module.css'

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 5000)
    }
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.newsletterColumn}>
          <h4 className={styles.columnTitle}>Stay Updated</h4>
          <p className={styles.newsletterDesc}>
            Subscribe to our newsletter to receive architectural reviews and engineering deep-dives directly.
          </p>
          <form onSubmit={handleSubscribe} className={styles.newsletterForm} style={{ maxWidth: '400px' }}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className={styles.emailInput}
            />
            <button type="submit" className={styles.subscribeButton} aria-label="Subscribe">
              {subscribed ? 'Subscribed!' : <Send size={16} />}
            </button>
          </form>
          {subscribed && <p className={styles.successMessage}>Thank you for subscribing to DevAtlas!</p>}
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.bottomContainer}>
          <span className={styles.copyright}>
            © 2026 DevAtlas. All rights reserved. Made for software engineers.
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
