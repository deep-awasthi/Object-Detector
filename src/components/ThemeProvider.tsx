'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = localStorage.getItem('devatlas-theme') as Theme | null
    if (stored) setTheme(stored)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    function resolve(t: Theme): 'light' | 'dark' {
      if (t === 'system') return mq.matches ? 'dark' : 'light'
      return t
    }

    const resolved = resolve(theme)
    setResolvedTheme(resolved)
    document.documentElement.setAttribute('data-theme', resolved)

    function onChange() {
      if (theme === 'system') {
        const r = resolve('system')
        setResolvedTheme(r)
        document.documentElement.setAttribute('data-theme', r)
      }
    }

    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const handleSetTheme = (t: Theme) => {
    setTheme(t)
    localStorage.setItem('devatlas-theme', t)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
