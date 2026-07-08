import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import styles from './CodingAnimation.module.css'

const CODE_SNIPPETS = [
  `import { System, Kernel, Engine } from 'devatlas';

async function bootstrap() {
  const node = new Kernel({ cluster: 'dist-prod-01' });
  await node.initialize();
  
  // Curating premium engineering content...
  while (node.isAlive()) {
    await node.rebalance();
    console.log('Atlas synced successfully.');
  }
}`,
  `// CSP concurrency pipeline
package main

import "fmt"

func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {
        fmt.Printf("worker %d processing\\n", id)
        results <- j * 2
    }
}`,
  `// eventloop.py internals
import asyncio

async def main():
    loop = asyncio.get_running_loop()
    print("Loop starting...")
    
    # Scheduling micro-tasks
    tasks = [asyncio.create_task(sync()) for _ in range(5)]
    await asyncio.gather(*tasks)`
]

export const CodingAnimation: React.FC = () => {
  const [snippetIndex, setSnippetIndex] = useState(0)
  const [displayedCode, setDisplayedCode] = useState('')
  const currentSnippet = CODE_SNIPPETS[snippetIndex]

  useEffect(() => {
    let active = true
    let index = 0
    setDisplayedCode('')

    const interval = setInterval(() => {
      if (!active) return

      if (index < currentSnippet.length) {
        setDisplayedCode(currentSnippet.substring(0, index + 1))
        index++
      } else {
        // Pause at the end, then switch snippet
        clearInterval(interval)
        setTimeout(() => {
          if (active) {
            setSnippetIndex((prev) => (prev + 1) % CODE_SNIPPETS.length)
          }
        }, 3000)
      }
    }, 35)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [snippetIndex, currentSnippet])

  return (
    <div className={styles.container}>
      {/* Background glow effects */}
      <div className={styles.glowMagenta} />
      <div className={styles.glowCyan} />

      <div className={styles.terminalWindow}>
        <div className={styles.terminalHeader}>
          <div className={styles.terminalButtons}>
            <span className={`${styles.terminalButton} ${styles.close}`} />
            <span className={`${styles.terminalButton} ${styles.minimize}`} />
            <span className={`${styles.terminalButton} ${styles.maximize}`} />
          </div>
          <div className={styles.terminalTitle}>~/devatlas/engine/sandbox</div>
        </div>
        <div className={styles.terminalBody}>
          <pre className={styles.codeArea}>
            <code>
              {displayedCode}
              <span className={styles.cursor}>█</span>
            </code>
          </pre>
        </div>
      </div>

      {/* Floating abstract code symbols */}
      <div className={styles.floatingSymbols}>
        {['{}', '</>', '=>', 'async', 'defer', 'const', 'import', 'go', 'fn'].map((symbol, idx) => (
          <motion.span
            key={idx}
            className={styles.symbol}
            initial={{
              x: Math.random() * 200 - 100,
              y: Math.random() * 100 - 50,
              opacity: 0.1,
              scale: 0.8
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.1, 0.4, 0.1],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: idx * 0.4
            }}
          >
            {symbol}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

export default CodingAnimation
