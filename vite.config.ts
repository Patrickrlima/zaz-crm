import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    base: '/zaz-crm/',
    plugins: [
          react(),
          tailwindcss(),
          VitePWA({
                  registerType: 'autoUpdate',
                  includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
                  manifest: {
                            name: 'Central do Vendedor - ZAZ CRM',
                            short_name: 'ZAZ CRM',
                            description: 'Plataforma CRM para vendedores externos ZAZ Vendas',
                            theme_color: '#5B2A86',
                            background_color: '#0F1117',
                            display: 'standalone',
                            start_url: '/zaz-crm/',
                            scope: '/zaz-crm/',
                            icons: [
                              { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                              { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                              { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                                      ],
                  },
                  workbox: {
                            globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff2}'],
                            maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
                            cleanupOutdatedCaches: true,
                            clientsClaim: true,
                            skipWaiting: true,
                  },
          }),
        ],
    resolve: {
          alias: {
                  '@': '/src',
          },
    },
})
