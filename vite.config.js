import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      external: ['dompurify', 'canvg'],
      output: {
        manualChunks: {
          'vendor-charts': ['chart.js'],
          'vendor-pdf': ['pdfjs-dist'],
          'vendor-ml': ['brain.js']
        },
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      format: {
        comments: false
      }
    },
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500
  },
  optimizeDeps: {
    include: [
      'pdfjs-dist',
      'chart.js',
      'brain.js',
      'tesseract.js'
    ],
    exclude: ['@sqlite.org/sqlite-wasm']
  },
  server: {
    port: 5173,
    strictPort: false,
    open: false,  // SCHIMBAT din true în false - NU mai deschide automat
    cors: true,
    host: 'localhost',
    // DISABLE CSP pentru development
    headers: {
      // Eliminăm CSP complet în dev
    }
  },
  preview: {
    port: 4173,
    open: false  // SCHIMBAT din true în false
  }
})