import React from 'react'
import { Info, Lightbulb, AlertTriangle, AlertCircle } from 'lucide-react'
import styles from './Callout.module.css'

export type CalloutType = 'note' | 'tip' | 'warning' | 'important'

interface CalloutProps {
  type?: CalloutType
  title?: string
  children: React.ReactNode
}

const iconMap = {
  note: Info,
  tip: Lightbulb,
  warning: AlertTriangle,
  important: AlertCircle,
}

export const Callout: React.FC<CalloutProps> = ({ type = 'note', title, children }) => {
  const Icon = iconMap[type] || Info
  const formattedTitle = title || type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <div className={`${styles.callout} ${styles[type]}`}>
      <div className={styles.header}>
        <Icon className={styles.icon} size={18} />
        <span className={styles.title}>{formattedTitle}</span>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default Callout
