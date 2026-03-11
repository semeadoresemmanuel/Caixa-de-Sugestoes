import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Caixa de Sugestões Semeadores',
        short_name: 'Sugestões',
        description: 'Caixa de Sugestões Anónima',
        theme_color: '#002400',
        background_color: '#002400',
        display: 'standalone'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Guarda as nossas imagens do i.ibb.co para quando a internet cair
            urlPattern: /^https:\/\/i\.ibb\.co\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Guarda as nossas fontes de letra do Google
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
})
