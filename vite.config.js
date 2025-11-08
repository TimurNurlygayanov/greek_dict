import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Ellinaki - Greek Vocabulary Learning',
        short_name: 'Ellinaki',
        description: 'Master Greek vocabulary for A1, A2, B1, B2 exams with 6,660+ words',
        theme_color: '#0D5EAF',
        background_color: '#0a0f1a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['education', 'productivity'],
        lang: 'en-US'
      },
      workbox: {
        // Cache dictionary data
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/accounts\.google\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-auth-cache',
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ],

  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },

    // Optimize chunk size
    chunkSizeWarningLimit: 1000,

    // Manual chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk - React and core libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Google OAuth library
          'vendor-google': ['@react-oauth/google'],
          // Dictionary data (large JSON file)
          'dictionary': ['/src/dictionary.json']
        }
      }
    },

    // Source maps for production debugging (optional - remove if not needed)
    sourcemap: false,

    // Enable CSS code splitting
    cssCodeSplit: true
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})

