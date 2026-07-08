import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Clock, Calendar, ArrowLeft, ArrowRight, Link2, ChevronUp } from 'lucide-react'
import articlesIndex from '../articles/index.json'
import { formatCategoryName } from '../utils/categories'
import Callout from '../components/Callout'
import CodeBlock from '../components/CodeBlock'
import Mermaid from '../components/Mermaid'
import ImageZoom from '../components/ImageZoom'
import CodingAnimation from '../components/CodingAnimation'
import styles from './ArticlePage.module.css'

// Dynamically discover all MDX files
const mdxModules = import.meta.glob('/src/articles/**/*.mdx')

interface TocItem {
  id: string
  text: string
  level: number
}

interface ArticleMetadata {
  slug: string
  category: string
  title: string
  description: string
  author: string
  date: string
  updated?: string
  cover?: string
  thumbnail?: string
  featured?: boolean
  draft?: boolean
  readingTime: string
  seoTitle?: string
  seoDescription?: string
  keywords?: string[]
  toc: TocItem[]
}

// Custom components to override default MDX elements
const mdxComponents = {
  Callout,
  img: (props: any) => <ImageZoom {...props} />,
  p: (props: any) => {
    const childrenArray = React.Children.toArray(props.children)
    const hasBlockChild = childrenArray.some((child: any) => {
      return child && typeof child === 'object' && child.props && (
        child.props.src !== undefined ||
        child.type === 'img' || 
        child.type === ImageZoom || 
        child.type === 'figure'
      )
    })
    if (hasBlockChild) {
      return <>{props.children}</>
    }
    return <p {...props} />
  },
  pre: (props: any) => {
    // Look for a code child inside the pre
    const codeElement = props.children
    const className = codeElement?.props?.className || ''
    
    // Intercept Mermaid blocks
    if (className.includes('language-mermaid')) {
      const chartCode = codeElement.props.children || ''
      return <Mermaid chart={chartCode} />
    }

    return <CodeBlock {...props} />
  }
}

const MOTIVATIONAL_QUOTES = [
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Clean code always looks like it was written by someone who cares.", author: "Michael Feathers" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Before software can be reusable it first has to be usable.", author: "Ralph Johnson" },
  { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Abelson & Sussman" },
  { text: "One of my most productive days was throwing away 1,000 lines of code.", author: "Ken Thompson" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" }
]

interface LoaderLine {
  text: string
  type: 'cmd' | 'info' | 'success'
}

const TerminalLoader: React.FC<{ onComplete: () => void; slug: string }> = ({ onComplete, slug }) => {
  const [lines, setLines] = useState<LoaderLine[]>([])

  const quote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
    return MOTIVATIONAL_QUOTES[randomIndex]
  }, [])

  useEffect(() => {
    const logSequence = [
      { text: `$ devatlas compile --src=${slug}.mdx`, type: 'cmd' as const, delay: 0 },
      { text: `[info] Initializing compilation engine v8.1.3...`, type: 'info' as const, delay: 250 },
      { text: `[info] Parsing AST and frontmatter headings...`, type: 'info' as const, delay: 600 },
      { text: `[success] AST built successfully. decached index node.`, type: 'success' as const, delay: 1000 },
      { text: `[info] Hydrating MDX layout components...`, type: 'info' as const, delay: 1300 },
      { text: `[success] Compiled successfully. Ready to stream.`, type: 'success' as const, delay: 1700 },
    ]

    const timers: number[] = []

    logSequence.forEach(item => {
      const timer = window.setTimeout(() => {
        setLines(prev => [...prev, { text: item.text, type: item.type }])
      }, item.delay)
      timers.push(timer)
    })

    const finalTimer = window.setTimeout(() => {
      onComplete()
    }, 2100)
    timers.push(finalTimer)

    return () => {
      timers.forEach(t => clearTimeout(t))
    }
  }, [onComplete, slug])

  return (
    <div className={styles.loadingState}>
      <div className={styles.terminalWindow}>
        <div className={styles.terminalHeader}>
          <div className={styles.terminalButtons}>
            <span className={`${styles.terminalButton} ${styles.close}`} />
            <span className={`${styles.terminalButton} ${styles.minimize}`} />
            <span className={`${styles.terminalButton} ${styles.maximize}`} />
          </div>
          <div className={styles.terminalTitle}>~/devatlas/engine</div>
        </div>
        <div className={styles.terminalBody}>
          {lines.map((line, idx) => (
            <div 
              key={idx} 
              className={`${styles.terminalLine} ${
                line.type === 'success' ? styles.successLine : line.type === 'info' ? styles.infoLine : ''
              }`}
            >
              {line.text}
            </div>
          ))}
          <span className={styles.terminalCursor} />
        </div>
      </div>
      <div className={styles.quoteContainer}>
        <p className={styles.quoteText}>"{quote.text}"</p>
        <span className={styles.quoteAuthor}>— {quote.author}</span>
      </div>
    </div>
  )
}

export const ArticlePage: React.FC = () => {
  const { category = '', slug = '' } = useParams<{ category: string; slug: string }>()
  const [MDXComponent, setMDXComponent] = useState<React.ComponentType<any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mdxLoaded, setMdxLoaded] = useState(false)
  const [animationDone, setAnimationDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeTocId, setActiveTocId] = useState('')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const articleContentRef = useRef<HTMLDivElement>(null)

  // Find article metadata from the index
  const metadata = useMemo(() => {
    return (articlesIndex as ArticleMetadata[]).find(
      a => a.category.toLowerCase() === category.toLowerCase() && a.slug.toLowerCase() === slug.toLowerCase() && !a.draft
    )
  }, [category, slug])

  // Get active sorted list of posts for prev/next navigation
  const sortedArticlesList = useMemo(() => {
    return (articlesIndex as ArticleMetadata[])
      .filter(a => !a.draft)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [])

  // Find index of current article
  const articleIndex = useMemo(() => {
    if (!metadata) return -1
    return sortedArticlesList.findIndex(a => a.slug === metadata.slug)
  }, [metadata, sortedArticlesList])

  const prevArticle = articleIndex > 0 ? sortedArticlesList[articleIndex - 1] : null
  const nextArticle = articleIndex >= 0 && articleIndex < sortedArticlesList.length - 1 ? sortedArticlesList[articleIndex + 1] : null

  // Related articles based on same category
  const relatedArticles = useMemo(() => {
    if (!metadata) return []
    return sortedArticlesList
      .filter(a => a.slug !== metadata.slug && a.category.toLowerCase() === metadata.category.toLowerCase())
      .slice(0, 3)
  }, [metadata, sortedArticlesList])

  // Load the MDX file dynamically
  useEffect(() => {
    const loadMdx = async () => {
      setIsLoading(true)
      setMdxLoaded(false)
      setAnimationDone(false)
      setError(null)
      try {
        const expectedPath = `/src/articles/${category}/${slug}.mdx`
        const matchingKey = Object.keys(mdxModules).find(
          key => key.toLowerCase() === expectedPath.toLowerCase()
        )

        if (!matchingKey) {
          throw new Error('Article file not found in directory.')
        }

        const module: any = await mdxModules[matchingKey]()
        setMDXComponent(() => module.default)
        setMdxLoaded(true)
      } catch (err: any) {
        console.error(err)
        setError('The requested article does not exist or has not been imported yet.')
      } finally {
        setIsLoading(false)
      }
    }

    loadMdx()
  }, [category, slug])

  // Handle Scroll Progress & TOC highlight & Scroll Top visibility
  useEffect(() => {
    const handleScroll = () => {
      // 1. Reading progress percentage
      if (articleContentRef.current) {
        const rect = articleContentRef.current.getBoundingClientRect()
        const totalHeight = rect.height - window.innerHeight
        const scrolled = -rect.top
        
        if (totalHeight > 0) {
          const percentage = Math.min(100, Math.max(0, (scrolled / totalHeight) * 100))
          setScrollProgress(percentage)
        } else {
          setScrollProgress(0)
        }
      }

      // 2. Scroll to top button visibility
      setShowScrollTop(window.scrollY > 500)

      // 3. Dynamic active TOC item detection
      if (metadata?.toc && metadata.toc.length > 0) {
        const headings = metadata.toc.map(item => document.getElementById(item.id)).filter(Boolean) as HTMLElement[]
        
        let currentActiveId = ''
        // Find header currently near top of page (offset margin)
        for (const h of headings) {
          const rect = h.getBoundingClientRect()
          if (rect.top <= 120) {
            currentActiveId = h.id
          }
        }
        
        if (currentActiveId) {
          setActiveTocId(currentActiveId)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [metadata])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const copyPageLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }



  if (error || (!MDXComponent && !isLoading)) {
    return (
      <>
        <Helmet>
          <title>Article Coming Soon | DevAtlas</title>
        </Helmet>
        <div className={styles.comingSoonPage}>
          <div className={styles.comingSoonCard}>
            <span className={styles.comingSoonBadge}>Coming Soon</span>
            <h1 className={styles.comingSoonTitle}>Article Coming Soon</h1>
            <p className={styles.comingSoonDesc}>
              This article is currently being curated by our engineers. Please wait.
            </p>
            <CodingAnimation />
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

  if (isLoading || !animationDone || !mdxLoaded) {
    return (
      <TerminalLoader 
        slug={slug} 
        onComplete={() => setAnimationDone(true)} 
      />
    )
  }

  if (error || !metadata || !MDXComponent) {
    return (
      <>
        <Helmet>
          <title>Article Coming Soon | DevAtlas</title>
        </Helmet>
        <div className={styles.comingSoonPage}>
          <div className={styles.comingSoonCard}>
            <span className={styles.comingSoonBadge}>Coming Soon</span>
            <h1 className={styles.comingSoonTitle}>Article Coming Soon</h1>
            <p className={styles.comingSoonDesc}>
              This article is currently being curated by our engineers. Please wait.
            </p>
            <CodingAnimation />
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

  const publishDate = new Date(metadata.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const updateDate = metadata.updated
    ? new Date(metadata.updated).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <>
      <Helmet>
        <title>{metadata.seoTitle || `${metadata.title} — DevAtlas`}</title>
        <meta name="description" content={metadata.seoDescription || metadata.description} />
        {metadata.keywords && <meta name="keywords" content={metadata.keywords.join(', ')} />}
        <meta property="og:title" content={metadata.seoTitle || metadata.title} />
        <meta property="og:description" content={metadata.seoDescription || metadata.description} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={metadata.date} />
        {metadata.updated && <meta property="article:modified_time" content={metadata.updated} />}
        {metadata.cover && <meta property="og:image" content={metadata.cover} />}
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Reading Progress Indicator */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${scrollProgress}%` }}></div>
      </div>

      <article className={styles.article}>
        {/* Article Breadcrumbs & Hero Header */}
        <div className={styles.heroBanner}>
          <div className={styles.heroContainer}>
            <div className={styles.breadcrumbs}>
              <Link to="/">Home</Link>
              <span className={styles.separator}>/</span>
              <Link to={`/${metadata.category}`}>{formatCategoryName(metadata.category)}</Link>
              <span className={styles.separator}>/</span>
              <span className={styles.activeBreadcrumb}>{metadata.title}</span>
            </div>

            <h1 className={styles.title}>{metadata.title}</h1>
            
            <p className={styles.description}>{metadata.description}</p>

            <div className={styles.metadata}>
              <div className={styles.dateMeta} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} />
                <span>Published {publishDate}</span>
                {updateDate && updateDate !== publishDate && (
                  <span className={styles.updatedDate}> (Updated {updateDate})</span>
                )}
              </div>

              <div className={styles.readingMeta}>
                <Clock size={16} />
                <span>{metadata.readingTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Large Immersive Cover Image */}
        {metadata.cover && (
          <div className={styles.coverWrapper}>
            <img src={metadata.cover} alt={metadata.title} className={styles.coverImage} />
          </div>
        )}

        {/* Main Article Body Layout */}
        <div className={styles.contentLayout}>
          
          {/* Left: Sticky Sidebar with TOC & Shares */}
          <aside className={styles.sidebar}>
            {metadata.toc && metadata.toc.length > 0 && (
              <div className={styles.tocContainer}>
                <h4 className={styles.tocTitle}>Table of Contents</h4>
                <nav className={styles.tocNav}>
                  {metadata.toc.map(item => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`${styles.tocLink} ${activeTocId === item.id ? styles.tocActive : ''}`}
                      style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            <div className={styles.shareContainer}>
              <h4 className={styles.shareTitle}>Share</h4>
              <div className={styles.shareButtons}>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(metadata.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.shareButton} ${styles.shareButtonX}`}
                  title="Share on X"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4l11.733 16h4.267l-11.733 -16z"/>
                    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/>
                  </svg>
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.shareButton} ${styles.shareButtonLinkedin}`}
                  title="Share on LinkedIn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <button onClick={copyPageLink} className={`${styles.shareButton} ${styles.shareButtonCopy}`} title="Copy Link">
                  {copiedLink ? <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>Copied!</span> : <Link2 size={16} />}
                </button>
              </div>
            </div>
          </aside>

          {/* Center: MDX Article Content */}
          <div ref={articleContentRef} className={`${styles.content} prose`}>
            <MDXComponent components={mdxComponents} />
          </div>

        </div>

        {/* Previous & Next Navigation */}
        <div className={styles.navContainer}>
          <div className={styles.navInner}>
            {prevArticle ? (
              <Link to={`/${prevArticle.category}/${prevArticle.slug}`} className={styles.navCard}>
                <span className={styles.navDirection}>
                  <ArrowLeft size={14} /> Previous Article
                </span>
                <span className={styles.navCardTitle}>{prevArticle.title}</span>
              </Link>
            ) : (
              <div className={styles.navCardPlaceholder}></div>
            )}

            {nextArticle ? (
              <Link to={`/${nextArticle.category}/${nextArticle.slug}`} className={`${styles.navCard} ${styles.navCardNext}`}>
                <span className={styles.navDirection}>
                  Next Article <ArrowRight size={14} />
                </span>
                <span className={styles.navCardTitle}>{nextArticle.title}</span>
              </Link>
            ) : (
              <div className={styles.navCardPlaceholder}></div>
            )}
          </div>
        </div>

        {/* Related Articles Footer section */}
        {relatedArticles.length > 0 && (
          <section className={styles.relatedSection}>
            <div className={styles.relatedContainer}>
              <h3 className={styles.relatedHeader}>Related Engineering Insights</h3>
              <div className={styles.relatedGrid}>
                {relatedArticles.map(article => (
                  <Link key={article.slug} to={`/${article.category}/${article.slug}`} className={styles.relatedCard}>
                    <img src={article.thumbnail || article.cover || '/placeholder-thumb.webp'} alt={article.title} className={styles.relatedThumb} />
                    <div className={styles.relatedInfo}>
                      <span className={styles.relatedCategory}>{formatCategoryName(article.category)}</span>
                      <h4 className={styles.relatedCardTitle}>{article.title}</h4>
                      <div className={styles.relatedMeta}>
                        <span>{article.readingTime}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>

      {/* Floating Scroll to Top button */}
      {showScrollTop && (
        <button onClick={scrollToTop} className={`${styles.scrollTopButton} glass`} aria-label="Scroll to top">
          <ChevronUp size={20} />
        </button>
      )}
    </>
  )
}

export default ArticlePage
