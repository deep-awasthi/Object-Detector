/**
 * src/utils/categories.ts
 *
 * Single source-of-truth helpers for category metadata.
 * All data is driven by src/data/categories.json.
 * To add a new category: add an entry to categories.json — no code changes needed.
 */

import categoriesData from '../data/categories.json'

export interface CategoryMeta {
  slug: string
  name: string
  description: string
  color: string
  /** Raw SVG inner markup (paths, circles, rects…). Rendered inside a 24×24 SVG wrapper. */
  icon: string
  aliases?: string[]
}

/** All categories in display order, exactly as defined in categories.json */
export const CATEGORIES: CategoryMeta[] = categoriesData as CategoryMeta[]

/** Lookup map: slug → CategoryMeta */
const BY_SLUG: Record<string, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map(c => [c.slug, c])
)

/**
 * Returns the CategoryMeta for a given slug, or undefined if not found.
 */
export function getCategoryMeta(slug: string): CategoryMeta | undefined {
  return BY_SLUG[slug.toLowerCase()]
}

/**
 * Returns the human-readable display name for a category slug.
 * Falls back to title-casing the slug if not found in categories.json.
 */
export function formatCategoryName(slug: string): string {
  const meta = BY_SLUG[slug.toLowerCase()]
  if (meta) return meta.name
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Returns the accent color for a category slug.
 * Falls back to the CSS variable --accent-primary.
 */
export function getCategoryColor(slug: string): string {
  return BY_SLUG[slug.toLowerCase()]?.color ?? 'var(--accent-primary)'
}

/**
 * Returns the category description.
 * Falls back to a generic string if not found.
 */
export function getCategoryDescription(slug: string): string {
  const meta = BY_SLUG[slug.toLowerCase()]
  if (meta) return meta.description
  return `Deep dives, architectural insights, and technical guides in ${formatCategoryName(slug)}.`
}

/**
 * Returns the path to the SVG icon file (e.g., "/src/assets/icons/java.svg").
 */
export function getCategoryIconPath(slug: string): string {
  return BY_SLUG[slug.toLowerCase()]?.icon ?? ''
}

/** Ordered list of all category slugs (derived from categories.json) */
export const CATEGORY_SLUGS: string[] = CATEGORIES.map(c => c.slug)
