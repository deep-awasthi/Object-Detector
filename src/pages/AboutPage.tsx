import React from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import styles from './AboutPage.module.css'

const CONTACTS = [
  {
    href: 'mailto:deepawasthi@devatlas.dev',
    className: styles.contactEmail,
    name: 'Email',
    desc: 'Drop me a message',
    icon: <Mail size={18} />,
  },
  {
    href: 'https://github.com/deepawasthi',
    className: styles.contactGithub,
    name: 'GitHub',
    desc: 'See my projects',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
        <path d="M9 18c-4.51 2-5-2-7-2"/>
      </svg>
    ),
  },
  {
    href: 'https://linkedin.com/in/deepawasthi',
    className: styles.contactLinkedin,
    name: 'LinkedIn',
    desc: 'Connect with me professionally',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect width="4" height="12" x="2" y="9"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    href: 'https://x.com/deepawasthi',
    className: styles.contactX,
    name: 'X',
    desc: 'Follow my thoughts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4l11.733 16h4.267l-11.733 -16z"/>
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/>
      </svg>
    ),
  },
  {
    href: 'https://medium.com/@deepawasthi',
    className: styles.contactMedium,
    name: 'Medium',
    desc: 'Read my articles',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
      </svg>
    ),
  },
]

export const AboutPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>About Me — DevAtlas</title>
        <meta name="description" content="Learn about the engineer behind DevAtlas — why it was built, what drives it, and how to get in touch." />
      </Helmet>

      <div className={styles.aboutPage}>

        {/* ── Hero intro ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0, ease: 'easeOut' }}
          className={styles.heroSection}
        >
          <div className={styles.heroBadge}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
              <line x1="14" y1="4" x2="10" y2="20" />
            </svg>
            Software Engineer
          </div>

          <h1 className={styles.heroTitle}>
            Hi, I'm <span className={styles.accent}>Deeep Awasthi</span>
          </h1>

          <p className={styles.heroLead}>
            I'm a software engineer who loves building systems that scale — and explaining them clearly. I work with distributed backends, cloud-native architectures, and everything in between. When I'm not shipping features, I'm digging into internals: how things actually work under the hood.
          </p>

          <p className={styles.heroLead}>
            I created <strong className={styles.accentStrong}>DevAtlas</strong> because I couldn't find a single place that combined the depth of academic papers with the readability of a great engineering blog. Most resources are either too shallow or too dense. DevAtlas is my attempt to fix that — one article at a time.
          </p>
        </motion.div>

        {/* ── Why DevAtlas ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className={styles.section}
        >
          <h2 className={styles.sectionTitle}>Why DevAtlas?</h2>
          <div className={styles.whyGrid}>
            <div className={styles.whyCard}>
              <span className={styles.whyNum}>01</span>
              <h3 className={styles.whyCardTitle}>Real experience, not theory</h3>
              <p className={styles.whyCardText}>Every article comes from something I've actually built, debugged, or architectured — not paraphrased documentation.</p>
            </div>
            <div className={styles.whyCard}>
              <span className={styles.whyNum}>02</span>
              <h3 className={styles.whyCardTitle}>Depth without the fluff</h3>
              <p className={styles.whyCardText}>I believe engineers deserve explanations that respect their intelligence — no padding, no SEO bait, just signal.</p>
            </div>
            <div className={styles.whyCard}>
              <span className={styles.whyNum}>03</span>
              <h3 className={styles.whyCardTitle}>Built for developers</h3>
              <p className={styles.whyCardText}>Code examples, architecture diagrams, and design trade-offs — the kind of content I wish I had when I was learning.</p>
            </div>
          </div>
        </motion.section>

        {/* ── Get in Touch ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className={styles.section}
        >
          <h2 className={styles.sectionTitle}>Get in Touch</h2>
          <p className={styles.text}>
            Have a question about an article, a topic suggestion, or just want to connect? I'm always happy to talk engineering. Reach me on any of these platforms:
          </p>

          <div className={styles.contactGrid}>
            {CONTACTS.map(contact => (
              <a
                key={contact.name}
                href={contact.href}
                target={contact.href.startsWith('mailto') ? undefined : '_blank'}
                rel={contact.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                className={`${styles.contactCard} ${contact.className}`}
              >
                <div className={styles.contactCardIcon}>
                  {contact.icon}
                </div>
                <div>
                  <div className={styles.contactCardName}>{contact.name}</div>
                  <div className={styles.contactCardDesc}>{contact.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </motion.section>

      </div>
    </>
  )
}

export default AboutPage
