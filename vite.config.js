import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
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
    rollupOptions: {
      output: {
        manualChunks: {
          univer: [
            '@univerjs/core',
            '@univerjs/engine-render',
            '@univerjs/engine-formula',
            '@univerjs/sheets',
          ],
          'univer-ui': [
            '@univerjs/ui',
            '@univerjs/sheets-ui',
            '@univerjs/docs',
            '@univerjs/docs-ui',
          ],
        },
      },
    },
  },
})
