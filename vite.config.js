import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // O registo agora é feito manualmente no index.html
      includeManifestIcons: false, // <-- A MÁGICA ESTÁ AQUI: Impede a Vercel de quebrar com links externos
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(i\.ibb\.co|fonts\.googleapis\.com|fonts\.gstatic\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 31536000 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        name: 'Caixa de Sugestões',
        short_name: 'Sugestões',
        description: 'Caixa de Sugestões Anónima',
        theme_color: '#002400',
        background_color: '#002400',
        display: 'standalone',
        // Os seus ícones voltaram! E agora não causarão erros.
        icons: [
          {
            src: 'https://i.ibb.co/Kx7RP4QC/g2.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'https://i.ibb.co/Kx7RP4QC/g2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
