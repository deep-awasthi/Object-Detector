import * as fs from 'fs'
import * as path from 'path'
import mammoth from 'mammoth'
import sharp from 'sharp'
import readingTime from 'reading-time'

// Types for article metadata and search index
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

interface SearchEntry {
  slug: string
  category: string
  title: string
  description: string
  headings: string[]
  content: string
}

// Config variables
const IMPORTS_DIR = path.join(process.cwd(), 'imports')
const ARTICLES_DIR = path.join(process.cwd(), 'src', 'articles')
const PUBLIC_DIR = path.join(process.cwd(), 'public')
const INDEX_JSON_PATH = path.join(ARTICLES_DIR, 'index.json')
const SEARCH_JSON_PATH = path.join(ARTICLES_DIR, 'search-data.json')
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

// Load categories from src/data/categories.json dynamically
const CATEGORIES_JSON_PATH = path.join(process.cwd(), 'src', 'data', 'categories.json')

function loadCategories(): any[] {
  if (fs.existsSync(CATEGORIES_JSON_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CATEGORIES_JSON_PATH, 'utf-8'))
    } catch (e) {
      console.error('Failed to parse categories.json:', e)
    }
  }
  return []
}

// Resolve parent folder to a category slug dynamically using config
function resolveCategory(folderName: string, categories: any[]): string {
  const normalizedFolder = folderName.toLowerCase().replace(/[-_\s]+/g, '')
  
  for (const cat of categories) {
    const slug = cat.slug.toLowerCase()
    const cleanSlug = slug.replace(/[-_\s]+/g, '')
    const cleanName = cat.name.toLowerCase().replace(/[-_\s]+/g, '')
    const aliases = (cat.aliases || []).map((a: string) => a.toLowerCase().replace(/[-_\s]+/g, ''))
    
    if (normalizedFolder === cleanSlug || normalizedFolder === cleanName || aliases.includes(normalizedFolder)) {
      return cat.slug
    }
  }
  
  // Fallback: If not in categories.json, resolve to the slugified folder name
  return slugify(folderName)
}

// Utility: Recursively find all docx files in imports directory
function getDocxFiles(dir: string): string[] {
  let results: string[] = []
  if (!fs.existsSync(dir)) return []
  const list = fs.readdirSync(dir)
  list.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getDocxFiles(filePath))
    } else if (file.endsWith('.docx') && !file.startsWith('~$')) {
      results.push(filePath)
    }
  })
  return results
}

// Utility: Recursively find all mdx files in articles directory
function getMdxFiles(dir: string): string[] {
  let results: string[] = []
  if (!fs.existsSync(dir)) return []
  const list = fs.readdirSync(dir)
  list.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getMdxFiles(filePath))
    } else if (file.endsWith('.mdx')) {
      results.push(filePath)
    }
  })
  return results
}

// Utility: Recursively remove empty folders, skipping the top-level directories
function cleanEmptyDirs(dir: string) {
  if (!fs.existsSync(dir)) return

  const files = fs.readdirSync(dir)
  if (files.length > 0) {
    files.forEach(file => {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) {
        cleanEmptyDirs(fullPath)
      }
    })
  }

  // Re-read directory contents in case children were deleted
  const remainingFiles = fs.readdirSync(dir)
  if (remainingFiles.length === 0 && dir !== ARTICLES_DIR && dir !== path.join(PUBLIC_DIR, 'articles', 'assets')) {
    fs.rmdirSync(dir)
    console.log(`Removed empty folder: ${dir}`)
  }
}


// Helper: Slugify string
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Heuristic fallback pipeline for formatting and metadata extraction
function runHeuristicPipeline(rawHtml: string, category: string, baseSlug: string): {
  metadata: Partial<ArticleMetadata>
  content: string
  toc: TocItem[]
} {
  console.log('Running heuristic parsing...')

  // Preprocess HTML paragraphs to detect code blocks/commands and convert them to pre/code blocks
  const preprocessedHtml = rawHtml.replace(/<p>([\s\S]*?)<\/p>/g, (match, content) => {
    // If the paragraph contains an image element, preserve it and do not treat it as a code block
    if (content.includes('<img')) {
      return `<p>${content}</p>`
    }

    // Replace br tags with newlines for code detection
    const text = content.trim().replace(/<br\s*\/?>/g, '\n')
    const plainText = text.replace(/<[^>]*>/g, '') // Strip inline HTML elements
    
    if (plainText.trim() === '') {
      return `<p>${content}</p>`
    }
    
    // Command line detections
    const isCommandLine = /^(docker|npm|npx|git|kubectl|go|python|node|cargo|pip|sh|bash|yarn|aws|gcloud|mvn|gradle|docker-compose)\s/.test(plainText)
    const isMultipleCommands = plainText.split('\n').every((line: string) => {
      const trimLine = line.trim()
      return !trimLine || /^(docker|npm|npx|git|kubectl|go|python|node|cargo|pip|sh|bash|yarn|aws|gcloud|mvn|gradle|docker-compose|\$)\s/.test(trimLine)
    })
    
    // Coding language signatures
    const codeKeywords = ['import ', 'export ', 'const ', 'let ', 'var ', 'function ', 'class ', 'def ', 'package ', 'public class ', 'public static ', 'func ', 'SELECT ', 'INSERT ', 'CREATE TABLE ', 'apiVersion: ', 'services: ', 'FROM ']
    const containsKeywords = codeKeywords.some(keyword => plainText.includes(keyword))
    const isCodeBraces = plainText.includes('{') && plainText.includes('}')
    
    if (isCommandLine || isMultipleCommands || containsKeywords || isCodeBraces) {
      return `<pre><code>${plainText}</code></pre>`
    }
    
    return `<p>${content}</p>`
  })

  // Simple HTML to Markdown conversions
  let markdown = preprocessedHtml
    .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
    .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
    .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
    .replace(/<img\s+src="([^"]+)"[^>]*>/g, '![Image]($1)')
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<li>(.*?)<\/li>/g, '* $1\n')
    .replace(/<ul>/g, '\n')
    .replace(/<\/ul>/g, '\n')
    .replace(/<ol>/g, '\n')
    .replace(/<\/ol>/g, '\n')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```\n\n')
    // Extract tables
    .replace(/<tr>/g, '\n|')
    .replace(/<\/tr>/g, '|')
    .replace(/<td>(.*?)<\/td>/g, ' $1 |')
    .replace(/<th>(.*?)<\/th>/g, ' **$1** |')
    .replace(/<table>/g, '\n')
    .replace(/<\/table>/g, '\n')
    // Clean up anchor tags
    .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')

  // 1. Detect code blocks and guess language
  // Look for blocks formatted as code (e.g. within pre tags or starting with code elements)
  markdown = markdown.replace(/```\n([\s\S]*?)\n```/g, (match, codeText) => {
    let lang = 'typescript'
    if (codeText.includes('public class ') || codeText.includes('import java.')) lang = 'java'
    else if (codeText.includes('def ') || codeText.includes('import os')) lang = 'python'
    else if (codeText.includes('func ') || codeText.includes('package main')) lang = 'go'
    else if (codeText.includes('SELECT ') || codeText.includes('CREATE TABLE')) lang = 'sql'
    else if (codeText.includes('docker ') || codeText.includes('FROM ')) lang = 'dockerfile'
    else if (codeText.includes('apiVersion:') || codeText.includes('metadata:')) lang = 'yaml'
    return `\`\`\`${lang}\n${codeText.trim()}\n\`\`\``
  })

  // 2. Convert text callout indicators into Callout components
  // Matches "Note: hello world" or "Tip: context" at beginnings
  const lines = markdown.split('\n')
  const processedLines = lines.map(line => {
    const trim = line.trim()
    const calloutMatch = trim.match(/^(note|tip|warning|important):\s*(.*)$/i)
    if (calloutMatch) {
      const type = calloutMatch[1].toLowerCase()
      const text = calloutMatch[2]
      return `<Callout type="${type}">${text}</Callout>`
    }
    return line
  })
  markdown = processedLines.join('\n')

  // 3. Extract Headings and compile Table of Contents
  const toc: TocItem[] = []
  const headerLines = markdown.split('\n')
  headerLines.forEach(line => {
    const match = line.match(/^(##|###)\s+(.*)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      const id = slugify(text)
      toc.push({ id, text, level })
    }
  })

  // 4. Generate metadata values
  const title = (markdown.match(/^#\s+(.*)$/m)?.[1] || baseSlug.replace(/-/g, ' ')).trim()
  const cleanContent = markdown.replace(/^#\s+.*$/m, '').trim() // Strip main H1

  // Extract description (first standard paragraph length)
  const paragraph = cleanContent.split('\n\n').find(p => p.trim() && !p.startsWith('##') && !p.startsWith('<Callout')) || ''
  const description = paragraph.length > 150 ? paragraph.substring(0, 147) + '...' : paragraph || 'An expert engineering article.'

  const metadata: Partial<ArticleMetadata> = {
    title,
    description,
    author: 'DevAtlas Architect',
    date: new Date().toISOString().split('T')[0],
    category,
    seoTitle: `${title} | DevAtlas`,
    seoDescription: description.substring(0, 160),
    keywords: [category, 'devatlas', 'architecture'],
    toc
  }

  return {
    metadata,
    content: cleanContent,
    toc
  }
}

// AI Enhancement pipeline calling Gemini API
async function runAiPipeline(rawHtml: string, category: string, baseSlug: string): Promise<{
  metadata: Partial<ArticleMetadata>
  content: string
  toc: TocItem[]
}> {
  console.log('Sending article text to Gemini for layout enhancement...')

  const prompt = `
You are the Technical Presentation and Layout Enhancement Engine for DevAtlas.
Your task is to take the HTML version of an engineering article converted from a DOCX file, clean it up, structure it as clean MDX format, and extract structured metadata.

IMPORTANT RULES:
- STRICTLY PRESERVE all technical accuracy, details, facts, explanations, and code.
- NEVER rewrite the author's meaning, invent new facts, or add text/explanations not present.
- Do NOT modify the syntax or execution of code blocks.
- Your sole job is to enhance layout presentation, typography, code block wrappers, and SEO parameters.

LAYOUT IMPROVEMENTS TO MAKE:
1. Formatting callout components: Convert any paragraphs starting with "Note:", "Tip:", "Warning:", or "Important:" (case-insensitive) into DevAtlas callouts like:
   <Callout type="note|tip|warning|important">Callout content</Callout>
2. Identify code snippets/blocks in the text. Make sure they are marked as standard markdown code blocks with their correct language tags (e.g. \`\`\`java, \`\`\`go, \`\`\`python, \`\`\`sql, \`\`\`sh, \`\`\`yaml).
3. Split very long paragraphs into readable, shorter paragraphs.
4. Clean up lists, inline bolding, and tables into perfect markdown.
5. Retain relative links like [text](url) and images like ![alt](./assets/slug/image.webp) (do not modify image URLs).
6. Create an automated Table of Contents (TOC) list containing the text, heading level (2 for H2, 3 for H3), and generated slugs for the TOC navigation links.

Respond ONLY with a valid JSON object matching this schema (do not wrap the JSON in Markdown backticks):
{
  "metadata": {
    "title": "Title of the article",
    "description": "Concise summary (120-150 chars) for previews",
    "author": "Author name (if extracted, else 'DevAtlas Contributor')",
    "seoTitle": "SEO title tag",
    "seoDescription": "Meta description (150-160 chars)",
    "keywords": ["keyword1", "keyword2"]
  },
  "content": "The fully formatted MDX article content without the main title header.",
  "toc": [
    { "id": "heading-slug", "text": "Heading Text", "level": 2 }
  ]
}

HTML Content:
${rawHtml}
`

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`)
    }

    const data = await response.json()
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Parse response JSON
    const parsed = JSON.parse(textResult.trim())
    return {
      metadata: {
        ...parsed.metadata,
        date: new Date().toISOString().split('T')[0],
        category,
        toc: parsed.toc
      },
      content: parsed.content,
      toc: parsed.toc
    }
  } catch (error) {
    console.error('AI pipeline error:', error)
    console.log('Falling back to Heuristic pipeline due to AI pipeline failure.')
    return runHeuristicPipeline(rawHtml, category, baseSlug)
  }
}

// Generate RSS Feed
function generateRss(articles: ArticleMetadata[]) {
  const items = articles
    .map(a => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>https://devatlas.com/${a.category}/${a.slug}</link>
      <guid>https://devatlas.com/${a.category}/${a.slug}</guid>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
      <description><![CDATA[${a.description}]]></description>
      <category>${a.category}</category>
    </item>`)
    .join('')

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>DevAtlas</title>
  <link>https://devatlas.com</link>
  <description>Premium Filesystem-Driven Engineering Publication</description>
  <language>en-us</language>
  <atom:link href="https://devatlas.com/rss.xml" rel="self" type="application/rss+xml" />
  ${items}
</channel>
</rss>`

  fs.writeFileSync(path.join(PUBLIC_DIR, 'rss.xml'), rss)
  console.log('Generated public/rss.xml')
}

// Generate XML Sitemap
function generateSitemap(articles: ArticleMetadata[]) {
  const urls = articles
    .map(a => `
  <url>
    <loc>https://devatlas.com/${a.category}/${a.slug}</loc>
    <lastmod>${a.updated || a.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`)
    .join('')

  // Add categories urls
  const categories = Array.from(new Set(articles.map(a => a.category)))
  const catUrls = categories
    .map(c => `
  <url>
    <loc>https://devatlas.com/${c}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`)
    .join('')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://devatlas.com</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${catUrls}
  ${urls}
</urlset>`

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap)
  console.log('Generated public/sitemap.xml')
}

// Generate robots.txt
function generateRobots() {
  const robots = `User-agent: *
Allow: /

Sitemap: https://devatlas.com/sitemap.xml
`
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robots)
  console.log('Generated public/robots.txt')
}

// Main Import Execution Flow
async function importArticles() {
  console.log('--- Starting DevAtlas Document Import ---')

  const categories = loadCategories()

  // Ensure main articles directory and category subdirectories exist
  fs.mkdirSync(ARTICLES_DIR, { recursive: true })
  for (const cat of categories) {
    fs.mkdirSync(path.join(ARTICLES_DIR, cat.slug), { recursive: true })
  }

  // Ensure index.json and search-data.json exist
  if (!fs.existsSync(INDEX_JSON_PATH)) {
    fs.writeFileSync(INDEX_JSON_PATH, '[]', 'utf-8')
  }
  if (!fs.existsSync(SEARCH_JSON_PATH)) {
    fs.writeFileSync(SEARCH_JSON_PATH, '[]', 'utf-8')
  }

  const docxFiles = getDocxFiles(IMPORTS_DIR)
  console.log(`Discovered ${docxFiles.length} document(s) to process.`)

  // Track processed slugs to find and clean up stale articles
  const processedSlugs = new Set<string>()

  // Load existing metadata indices
  let existingMetadataList: ArticleMetadata[] = []
  try {
    existingMetadataList = JSON.parse(fs.readFileSync(INDEX_JSON_PATH, 'utf-8'))
  } catch {
    existingMetadataList = []
  }

  let existingSearchList: SearchEntry[] = []
  try {
    existingSearchList = JSON.parse(fs.readFileSync(SEARCH_JSON_PATH, 'utf-8'))
  } catch {
    existingSearchList = []
  }

  for (const filePath of docxFiles) {
    const filename = path.basename(filePath)
    const baseSlug = slugify(path.basename(filePath, '.docx'))
    processedSlugs.add(baseSlug)

    // Determine category based on parent folder
    const parentDir = path.dirname(filePath)
    const parentFolder = path.basename(parentDir)
    const category = resolveCategory(parentFolder, categories)
    
    if (!category) {
      console.log(`Warning: Folder name "${parentFolder}" could not be resolved. Skipping file "${filename}".`)
      continue
    }

    console.log(`\nProcessing: ${filename} -> category: "${category}", slug: "${baseSlug}"`)

    const categoryDir = path.join(ARTICLES_DIR, category)
    const assetsDir = path.join(PUBLIC_DIR, 'articles', 'assets', baseSlug)

    // Ensure folders exist
    fs.mkdirSync(categoryDir, { recursive: true })
    fs.mkdirSync(assetsDir, { recursive: true })

    const imagesToProcess: { id: number; buffer: Buffer; format: string }[] = []

    // mammoth convert image handler
    const options = {
      convertImage: mammoth.images.imgElement((image) => {
        const imageId = imagesToProcess.length + 1
        const ext = image.contentType.split('/')[1] || 'png'
        
        return image.read().then((buffer) => {
          imagesToProcess.push({ id: imageId, buffer, format: ext })
          // MDX static reference path (served from public/)
          return {
            src: `/articles/assets/${baseSlug}/image-${imageId}.webp`
          }
        })
      }),
      styleMap: [
        "p[font-family='Courier New'] => pre > code:fresh",
        "p[style-name='Code'] => pre > code:fresh",
        "p[style-name='Preformatted Text'] => pre > code:fresh",
        "p[style-name='Source Code'] => pre > code:fresh"
      ]
    }

    try {
      // Parse DOCX with Mammoth
      const result = await mammoth.convertToHtml({ path: filePath }, options)
      const rawHtml = result.value

      // Process and optimize images using Sharp
      console.log(`Processing ${imagesToProcess.length} embedded image(s)...`)
      for (const img of imagesToProcess) {
        const destWebp = path.join(assetsDir, `image-${img.id}.webp`)
        await sharp(img.buffer)
          .webp({ quality: 85 })
          .toFile(destWebp)
      }

      // Check if first image is cover, otherwise check if cover already exists
      let coverPath = ''
      if (imagesToProcess.length > 0) {
        coverPath = `/articles/assets/${baseSlug}/image-1.webp`
      }

      // Run layouts through pipeline (Gemini or local heuristic rules)
      let parsedArticle
      if (GEMINI_API_KEY) {
        parsedArticle = await runAiPipeline(rawHtml, category, baseSlug)
      } else {
        parsedArticle = runHeuristicPipeline(rawHtml, category, baseSlug)
      }

      // Formulate complete MDX contents with frontmatter
      const stats = readingTime(parsedArticle.content)
      
      const finalMetadata: ArticleMetadata = {
        slug: baseSlug,
        category,
        title: parsedArticle.metadata.title || baseSlug.replace(/-/g, ' '),
        description: parsedArticle.metadata.description || '',
        author: parsedArticle.metadata.author || 'DevAtlas Contributor',
        date: parsedArticle.metadata.date || new Date().toISOString().split('T')[0],
        readingTime: stats.text,
        seoTitle: parsedArticle.metadata.seoTitle,
        seoDescription: parsedArticle.metadata.seoDescription,
        keywords: parsedArticle.metadata.keywords,
        cover: coverPath || undefined,
        thumbnail: coverPath || undefined,
        featured: parsedArticle.metadata.featured || false,
        draft: parsedArticle.metadata.draft || false,
        toc: parsedArticle.toc || []
      }

      // Check if we are updating an existing entry
      const existingMetaIdx = existingMetadataList.findIndex(a => a.slug === baseSlug)
      if (existingMetaIdx >= 0) {
        finalMetadata.date = existingMetadataList[existingMetaIdx].date // Keep original publish date
        finalMetadata.updated = new Date().toISOString().split('T')[0] // Set updated date
        existingMetadataList[existingMetaIdx] = finalMetadata
      } else {
        existingMetadataList.push(finalMetadata)
      }

      // Update Search Data list
      const headings = parsedArticle.toc.map(item => item.text)
      
      // Clean HTML / Markdown tags for pure text index
      const plainContent = parsedArticle.content
        .replace(/<[^>]*>/g, '')
        .replace(/[#*`[\]()|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      const searchEntry: SearchEntry = {
        slug: baseSlug,
        category,
        title: finalMetadata.title,
        description: finalMetadata.description,
        headings,
        content: plainContent
      }

      const existingSearchIdx = existingSearchList.findIndex(a => a.slug === baseSlug)
      if (existingSearchIdx >= 0) {
        existingSearchList[existingSearchIdx] = searchEntry
      } else {
        existingSearchList.push(searchEntry)
      }

      // Compile MDX File with frontmatter
      const yamlFrontmatter = `---
title: "${finalMetadata.title.replace(/"/g, '\\"')}"
description: "${finalMetadata.description.replace(/"/g, '\\"')}"
author: "${finalMetadata.author.replace(/"/g, '\\"')}"
date: "${finalMetadata.date}"
${finalMetadata.updated ? `updated: "${finalMetadata.updated}"` : ''}
category: "${finalMetadata.category}"
readingTime: "${finalMetadata.readingTime}"
${finalMetadata.cover ? `cover: "${finalMetadata.cover}"` : ''}
${finalMetadata.thumbnail ? `thumbnail: "${finalMetadata.thumbnail}"` : ''}
featured: ${finalMetadata.featured}
draft: ${finalMetadata.draft}
seoTitle: "${(finalMetadata.seoTitle || '').replace(/"/g, '\\"')}"
seoDescription: "${(finalMetadata.seoDescription || '').replace(/"/g, '\\"')}"
keywords: ${JSON.stringify(finalMetadata.keywords || [])}
---

${parsedArticle.content}
`

      // Write MDX file to disk
      const mdxPath = path.join(categoryDir, `${baseSlug}.mdx`)
      fs.writeFileSync(mdxPath, yamlFrontmatter)
      console.log(`Published MDX: ${mdxPath}`)

    } catch (e) {
      console.error(`Failed to process article "${filename}":`, e)
    }
  }

  // Find and remove stale MDX files and their assets
  const allMdxFiles = getMdxFiles(ARTICLES_DIR)
  for (const mdxPath of allMdxFiles) {
    const slug = path.basename(mdxPath, '.mdx')
    if (!processedSlugs.has(slug)) {
      console.log(`Removing stale MDX file: ${mdxPath}`)
      fs.unlinkSync(mdxPath)
      
      const assetsDir = path.join(PUBLIC_DIR, 'articles', 'assets', slug)
      if (fs.existsSync(assetsDir)) {
        console.log(`Removing stale assets folder: ${assetsDir}`)
        fs.rmSync(assetsDir, { recursive: true, force: true })
      }
    }
  }

  // Filter out any articles whose files no longer exist on disk (deleted articles cleanup)
  const cleanedMetadataList: ArticleMetadata[] = []
  const cleanedSearchList: SearchEntry[] = []

  for (const meta of existingMetadataList) {
    const filePath = path.join(ARTICLES_DIR, meta.category, `${meta.slug}.mdx`)
    if (fs.existsSync(filePath)) {
      cleanedMetadataList.push(meta)
      const sEntry = existingSearchList.find(s => s.slug === meta.slug)
      if (sEntry) cleanedSearchList.push(sEntry)
    }
  }

  // Write updated metadata and search indexes back to disk
  fs.writeFileSync(INDEX_JSON_PATH, JSON.stringify(cleanedMetadataList, null, 2))
  fs.writeFileSync(SEARCH_JSON_PATH, JSON.stringify(cleanedSearchList, null, 2))
  console.log('\nUpdated src/articles/index.json')
  console.log('Updated src/articles/search-data.json')

  // Generate public feeds & configurations
  const activeArticles = cleanedMetadataList.filter(a => !a.draft)
  generateRss(activeArticles)
  generateSitemap(activeArticles)
  generateRobots()
  // Remove empty category folders and empty asset folders
  cleanEmptyDirs(ARTICLES_DIR)
  cleanEmptyDirs(path.join(PUBLIC_DIR, 'articles', 'assets'))

  console.log('--- DevAtlas Document Import Completed Successfully ---')
}

// Run Script
importArticles()
