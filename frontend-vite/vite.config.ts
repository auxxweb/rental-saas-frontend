import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Vite `proxy.target` must be an **origin only** (protocol + host + port), without `/api`.
 * Requests to `/api/*` are forwarded to `{target}/api/*`.
 * If `VITE_DEV_PROXY_TARGET` accidentally includes `/api`, strip it so paths are not doubled.
 */
function normalizeProxyTarget(raw: string | undefined, fallback: string): string {
  const s = (raw && String(raw).trim()) || fallback
  return s.replace(/\/api\/?$/i, '').replace(/\/$/, '') || fallback
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = normalizeProxyTarget(env.VITE_DEV_PROXY_TARGET, 'http://localhost:5000/api')

  const apiProxy = {
    target: apiTarget,
    changeOrigin: true,
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'app-icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'Rental Store Billing SaaS',
          short_name: 'Rental SaaS',
          lang: 'en',
          description: 'Cloud-based Rental Store Billing Platform',
          theme_color: '#9AE66E',
          background_color: '#F6F7F9',
          display: 'standalone',
          orientation: 'any',
          scope: '/',
          start_url: '/',
          id: '/',
          categories: ['business', 'productivity'],
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api/],
          /** Never let the SW satisfy API calls from cache (avoids stale 404/HTML). */
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api'),
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
        devOptions: {
          /** Set `true` to test install / SW in dev (more overhead). */
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': apiProxy,
      },
    },
    /** Same proxy as `server` so `vite preview` can reach the API when using relative `/api`. */
    preview: {
      port: 4173,
      proxy: {
        '/api': apiProxy,
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})
