import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-syntax-highlighter') || id.includes('react-markdown')) return 'markdown'
            if (id.includes('@tanstack')) return 'query'
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor'
          }
        },
      },
    },
  },
})
