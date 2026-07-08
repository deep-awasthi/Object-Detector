import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { useTheme } from './ThemeContext'
import styles from './Mermaid.module.css'

interface MermaidProps {
  chart: string
}

let uniqueIdCounter = 0

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const { resolvedTheme } = useTheme()
  const [svgContent, setSvgContent] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const chartId = useRef(`mermaid-chart-${++uniqueIdCounter}`)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: resolvedTheme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'var(--font-sans)',
      themeVariables: {
        background: resolvedTheme === 'dark' ? '#18181b' : '#f8fafc',
        primaryColor: resolvedTheme === 'dark' ? '#1f2937' : '#e2e8f0',
        primaryTextColor: resolvedTheme === 'dark' ? '#f4f4f5' : '#0f172a',
        lineColor: resolvedTheme === 'dark' ? '#3f3f46' : '#cbd5e1',
      }
    })

    const renderChart = async () => {
      try {
        setError(null)
        // Clean chart string of leading/trailing spaces
        const cleanedChart = chart.trim()
        if (!cleanedChart) return

        const { svg } = await mermaid.render(chartId.current, cleanedChart)
        setSvgContent(svg)
      } catch (err: any) {
        console.error('Mermaid render error:', err)
        setError('Failed to render diagram.')
        // Clear broken element mermaid might leave behind
        const badEl = document.getElementById(chartId.current)
        if (badEl) {
          badEl.remove()
        }
      }
    }

    renderChart()
  }, [chart, resolvedTheme])

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorMessage}>{error}</span>
        <pre className={styles.errorChart}>{chart}</pre>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div 
        ref={containerRef}
        className={styles.graph}
        dangerouslySetInnerHTML={{ __html: svgContent }} 
      />
    </div>
  )
}

export default Mermaid
