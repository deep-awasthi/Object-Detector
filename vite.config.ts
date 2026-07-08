import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkFrontmatter from 'remark-frontmatter'
import rehypeKatex from 'rehype-katex'
import rehypeShiki from '@shikijs/rehype'

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkGfm, remarkMath],
        rehypePlugins: [
          [rehypeShiki, { theme: 'github-dark-dimmed' }],
          rehypeKatex
        ],
        providerImportSource: undefined // Do not require MDXProvider unless needed
      })
    },
    react()
  ],
  resolve: {
    alias: {
      src: '/src'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('mermaid')) {
              return 'vendor-mermaid'
            }
            if (id.includes('katex')) {
              return 'vendor-katex'
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer-motion'
            }
            return 'vendor-core'
          }
        }
      }
    }
  }
})
