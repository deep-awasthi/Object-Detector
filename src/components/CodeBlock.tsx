import React, { useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import styles from './CodeBlock.module.css'

interface CodeBlockProps {
  children: React.ReactElement
  'data-filename'?: string
  'data-highlight'?: string
}

export const CodeBlock: React.FC<CodeBlockProps> = (props) => {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  const filename = props['data-filename'] || ''
  
  // Extract language from code class (e.g. language-typescript)
  const codeElement = props.children
  const className = (codeElement?.props as any)?.className || ''
  const matches = className.match(/language-(\w+)/)
  const language = matches ? matches[1] : ''

  const handleCopy = async () => {
    if (!preRef.current) return
    const text = preRef.current.innerText || ''
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.meta}>
          {language && <span className={styles.language}>{language}</span>}
          {filename && <span className={styles.filename}>{filename}</span>}
        </div>
        <button
          onClick={handleCopy}
          className={styles.copyButton}
          aria-label="Copy code block"
          title="Copy code"
        >
          {copied ? <Check size={14} className={styles.checkIcon} /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre ref={preRef} {...props} className={styles.pre}>
        {props.children}
      </pre>
    </div>
  )
}

export default CodeBlock
