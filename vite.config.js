import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  plugins: [
    vue(),
    // Pre-generate .gz files at build time so nginx serves them directly
    // via gzip_static (no runtime CPU cost on the Pi)
    compression({
      algorithm: 'gzip',
      exclude: [/\.(png|jpe?g|gif|svg|ico|woff2?)$/i],
      threshold: 1024,  // only compress files > 1 KB
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
    // Emit source maps only in dev; keep prod bundle lean
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Univer core engine (heaviest, changes rarely)
          'univer-core': [
            '@univerjs/core',
            '@univerjs/engine-render',
            '@univerjs/engine-formula',
          ],
          // Univer sheet data model
          'univer-sheets': [
            '@univerjs/sheets',
            '@univerjs/sheets-formula',
            '@univerjs/sheets-numfmt',
          ],
          // Univer UI layer
          'univer-ui': [
            '@univerjs/design',
            '@univerjs/ui',
            '@univerjs/docs',
            '@univerjs/docs-ui',
            '@univerjs/sheets-ui',
            '@univerjs/sheets-formula-ui',
          ],
          // Facade + xlsx (user-facing API, smaller)
          'univer-facade': ['@univerjs/facade'],
          'xlsx': ['xlsx'],
        },
      },
    },
  },
})
