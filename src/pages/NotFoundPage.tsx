import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft } from 'lucide-react'
import CodingAnimation from '../components/CodingAnimation'
import styles from './NotFoundPage.module.css'

const DEVELOPER_QUOTES = [
  { text: "There are two ways to write error-free programs; only the third one works.", author: "Alan J. Perlis" },
  { text: "Deleted code is debugged code.", author: "Jeff Sickel" },
  { text: "If debugging is the process of removing software bugs, then programming must be the process of putting them in.", author: "Edsger W. Dijkstra" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" }
]

export const NotFoundPage: React.FC = () => {
  const quote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * DEVELOPER_QUOTES.length)
    return DEVELOPER_QUOTES[randomIndex]
  }, [])

  return (
    <>
      <Helmet>
        <title>404 — Grid Node Undefined | DevAtlas</title>
        <meta name="description" content="The requested page could not be found." />
      </Helmet>

      <div className={styles.notFoundPage}>
        <div className={styles.container}>
          <div className={styles.headerArea}>
            <span className={styles.errorCode}>404</span>
            <h1 className={styles.title}>Grid Node Undefined</h1>
            <p className={styles.desc}>
              The coordinate space you've entered does not exist in the DevAtlas grid system.
            </p>
          </div>

          <CodingAnimation />

          <div className={styles.quoteArea}>
            <p className={styles.quoteText}>"{quote.text}"</p>
            <span className={styles.quoteAuthor}>— {quote.author}</span>
          </div>

          <div className={styles.actionArea}>
            <Link to="/" className={styles.backLink}>
              <ArrowLeft size={16} /> Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFoundPage
