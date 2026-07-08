import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ThemeProvider } from './components/ThemeContext'
import Layout from './layouts/Layout'
import Homepage from './pages/Homepage'
import CategoryPage from './pages/CategoryPage'
import ArticlePage from './pages/ArticlePage'
import ArticlesPage from './pages/ArticlesPage'
import AboutPage from './pages/AboutPage'
import CategoriesPage from './pages/CategoriesPage'
import UpcomingPage from './pages/UpcomingPage'
import NotFoundPage from './pages/NotFoundPage'
import config from './data/config.json'

declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

const GoogleAnalytics: React.FC = () => {
  const location = useLocation()

  useEffect(() => {
    const gaId = config.googleAnalyticsId
    if (gaId && /^G-[A-Z0-9]+$/i.test(gaId)) {
      if (!window.gtag) {
        const script1 = document.createElement('script')
        script1.async = true
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
        document.head.appendChild(script1)

        const script2 = document.createElement('script')
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
        `
        document.head.appendChild(script2)
      }

      window.gtag('config', gaId, {
        page_path: location.pathname + location.search
      })
    }
  }, [location])

  return null
}

export const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Router>
          <GoogleAnalytics />
          <Layout>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/articles" element={<ArticlesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/upcoming" element={<UpcomingPage />} />
              <Route path="/:category" element={<CategoryPage />} />
              <Route path="/:category/:slug" element={<ArticlePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  )
}

export default App

