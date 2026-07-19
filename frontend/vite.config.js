import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      fastRefresh: true,
      include: "**/*.{jsx,tsx}",
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // ── Production Optimizations ──
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,

    rollupOptions: {
      output: {
        // ── Manual Chunk Splitting for optimal caching ──
        manualChunks: {
          // React core — changes rarely, cache long
          'react-vendor': ['react', 'react-dom'],
          // Router
          'router': ['react-router-dom'],
          // Animation libs — large, cache separately
          'animation': ['framer-motion', 'gsap'],
          // UI primitives
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
          ],
          // Charting
          'charts': ['recharts'],
          // 3D
          'three-vendor': ['three'],
          // Firebase
          'firebase': ['firebase/app', 'firebase/auth'],
        },
      },
    },

    // Increase chunk size warning (3D libs are inherently large)
    chunkSizeWarningLimit: 600,
  },

  // ── Dependency Pre-bundling ──
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'axios',
      'zustand',
    ],
  },
})
