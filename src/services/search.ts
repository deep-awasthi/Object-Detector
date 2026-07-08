import { Document } from 'flexsearch'

export interface SearchEntry {
  [key: string]: any
  slug: string
  category: string
  title: string
  description: string
  headings: string[]
  content: string
}

let searchIndex: Document<SearchEntry, false> | null = null
let articlesData: SearchEntry[] = []
let isInitializing = false

export const initSearch = async () => {
  if (searchIndex || isInitializing) return
  isInitializing = true

  try {
    // Dynamic import/fetch of search-data.json to keep initial page bundle small
    const response = await fetch('/src/articles/search-data.json')
    if (!response.ok) {
      // Fallback if file doesn't exist yet
      articlesData = []
    } else {
      articlesData = await response.json()
    }

    // Initialize FlexSearch Document Index
    searchIndex = new Document({
      document: {
        id: 'slug',
        index: ['title', 'description', 'category', 'headings', 'content'],
        store: ['title', 'description', 'category', 'slug']
      },
      tokenize: 'forward',
      resolution: 9
    })

    // Add all articles to the index
    if (searchIndex) {
      for (const article of articlesData) {
        searchIndex.add(article)
      }
    }
  } catch (error) {
    console.error('Failed to initialize search index:', error)
  } finally {
    isInitializing = false
  }
}

export const searchArticles = async (query: string): Promise<SearchEntry[]> => {
  if (!query.trim()) return []
  
  if (!searchIndex) {
    await initSearch()
  }

  if (!searchIndex) return []

  const results = searchIndex.search(query, {
    limit: 10,
    enrich: true
  })

  // FlexSearch returns results grouped by index field, let's combine and deduplicate them
  const matchedSlugs = new Set<string>()
  const finalResults: SearchEntry[] = []

  for (const fieldResult of results) {
    for (const doc of fieldResult.result) {
      const slug = doc.id as string
      if (!matchedSlugs.has(slug)) {
        matchedSlugs.add(slug)
        const match = articlesData.find(a => a.slug === slug)
        if (match) {
          finalResults.push(match)
        }
      }
    }
  }

  return finalResults
}
