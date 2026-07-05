'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { engineeringQuotes } from '@/lib/quotes'

export function LoadingScreen() {
  const [visible, setVisible] = useState(false)
  const [quote, setQuote] = useState('')

  useEffect(() => {
    setQuote(engineeringQuotes[Math.floor(Math.random() * engineeringQuotes.length)])
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="loading-logo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            DevAtlas
          </motion.div>
          <motion.p
            className="loading-tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Crafting knowledge for engineers.
          </motion.p>
          {quote && (
            <motion.p
              className="loading-quote"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              &ldquo;{quote}&rdquo;
            </motion.p>
          )}
          <motion.div
            className="loading-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="loading-bar-fill" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
