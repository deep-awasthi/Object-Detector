import React, { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import upcomingFeatures from '../data/upcoming.json'
import CodingAnimation from '../components/CodingAnimation'
import styles from './UpcomingPage.module.css'

interface Feature {
  title: string
  description: string
  status: string
}

const DEVELOPMENT_QUOTES = [
  { text: "Good software, like wine, takes time.", author: "Joel Spolsky" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Controlling complexity is the essence of computer programming.", author: "Brian Kernighan" },
  { text: "Indeed, the ratio of time spent reading versus writing is over 10 to 1. We are constantly reading old code to write new code.", author: "Robert C. Martin" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" }
]

export const UpcomingPage: React.FC = () => {
  const features = (upcomingFeatures as Feature[]) || []

  const quote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * DEVELOPMENT_QUOTES.length)
    return DEVELOPMENT_QUOTES[randomIndex]
  }, [])

  if (features.length === 0) {
    return (
      <>
        <Helmet>
          <title>Upcoming Features — DevAtlas Roadmap</title>
          <meta name="description" content="Explore upcoming architectural features, developer utilities, and content roadmaps for DevAtlas." />
        </Helmet>

        <div className={styles.comingSoonPage}>
          <div className={styles.comingSoonCard}>
            <span className={styles.comingSoonBadge}>Roadmap</span>
            <h1 className={styles.comingSoonTitle}>Something is cooking for you</h1>
            <p className={styles.comingSoonDesc}>
              We are designing and building upcoming features, interactive pipelines, and technical publication systems. Please wait.
            </p>
            <CodingAnimation />

            <div className={styles.quoteArea}>
              <p className={styles.quoteText}>"{quote.text}"</p>
              <span className={styles.quoteAuthor}>— {quote.author}</span>
            </div>

            <div className={styles.comingSoonActions}>
              <Link to="/" className={styles.backLink}>
                <ArrowLeft size={16} /> Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>Upcoming Features — DevAtlas Roadmap</title>
        <meta name="description" content="Explore upcoming architectural features, developer utilities, and content roadmaps for DevAtlas." />
      </Helmet>

      <div className={styles.upcomingPage}>
        <div className={styles.titleSection}>
          <span className={styles.subtitle}>Roadmap</span>
          <h1 className={styles.title}>Upcoming Features</h1>
          <p className={styles.desc}>
            A preview of core engineering concepts, interactive builders, and optimization pipelines currently in active development or design phase.
          </p>
        </div>

        <div className={styles.featuresList}>
          {features.map((feat, idx) => {
            const isDev = feat.status.toLowerCase() === 'in development'
            
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className={styles.featureCard}
              >
                <div className={styles.featureContent}>
                  <h3 className={styles.featureTitle}>{feat.title}</h3>
                  <p className={styles.featureDesc}>{feat.description}</p>
                </div>
                <div className={`${styles.statusBadge} ${isDev ? styles.statusDev : styles.statusSoon}`}>
                  {isDev && <span className={styles.pulseDot} />}
                  <span>{feat.status}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default UpcomingPage

