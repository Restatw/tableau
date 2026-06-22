import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { compression } from 'vite-plugin-compression2'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // Pre-cache everything built by Vite
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // Univer chunks are large — bump the cache limit
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            // index.html: network-first so updates are picked up immediately
            urlPattern: /\/$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },

      manifest: {
        name: 'Tableau — Web Spreadsheet',
        short_name: 'Tableau',
        description: 'Standalone web spreadsheet — edit, import and export Excel files in the browser.',
        theme_color: '#1a73e8',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'landscape',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'utilities'],
        lang: 'en',
        icons: [
          { src: '/icons/icon-72x72.png',      sizes: '72x72',   type: 'image/png' },
          { src: '/icons/icon-96x96.png',      sizes: '96x96',   type: 'image/png' },
          { src: '/icons/icon-128x128.png',    sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png',    sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png',    sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192x192.png',    sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-384x384.png',    sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png',    sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',   // Android adaptive icon safe zone
          },
        ],
        screenshots: [],
      },

      // Dev options — enable SW in dev for easier testing
      devOptions: {
        enabled: false,
      },
    }),

    // Pre-generate .gz for nginx gzip_static
    compression({
      algorithm: 'gzip',
      exclude: [/\.(png|jpe?g|gif|svg|ico|woff2?)$/i],
      threshold: 1024,
    }),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  optimizeDeps: {
    include: ['xlsx'],
    exclude: ['@univerjs/engine-render'],
  },

  build: {
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'univer-core':   ['@univerjs/core', '@univerjs/engine-render', '@univerjs/engine-formula'],
          'univer-sheets': ['@univerjs/sheets', '@univerjs/sheets-formula', '@univerjs/sheets-numfmt'],
          'univer-ui':     ['@univerjs/design', '@univerjs/ui', '@univerjs/docs', '@univerjs/docs-ui', '@univerjs/sheets-ui', '@univerjs/sheets-formula-ui'],
          'univer-facade': ['@univerjs/facade'],
          'xlsx':          ['xlsx'],
        },
      },
    },
  },
})
