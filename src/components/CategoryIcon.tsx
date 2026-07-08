/**
 * CategoryIcon — renders the SVG icon for a category from its source SVG asset.
 * Loads SVGs dynamically at compile time using Vite's eager raw glob imports.
 */
import React from 'react'
import { getCategoryIconPath } from '../utils/categories'

// Eagerly import all category icons in src/assets/icons/ as raw strings
const icons = import.meta.glob('/src/assets/icons/*.svg', { query: '?raw', import: 'default', eager: true })

interface CategoryIconProps {
  slug: string
  size?: number
  className?: string
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ slug, size = 24, className }) => {
  const iconPath = getCategoryIconPath(slug)
  const rawSvg = (icons[iconPath] as string) || ''

  // Strip outer <svg...> and </svg> wrapper so we can style it inline
  const innerSvg = rawSvg
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>/i, '')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: innerSvg }}
    />
  )
}

export default CategoryIcon
