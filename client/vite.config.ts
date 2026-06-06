import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'BibleVoice - விவிலியம்',
        short_name: 'BibleVoice',
        description: 'Tamil & English Bible - Hear the Word. Find it in a Fraction of a Second.',
        theme_color: '#7B1C1C',
        background_color: '#FDF6EC',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/bible\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'bible-api-cache', expiration: { maxEntries: 200 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
    },
  },
})
