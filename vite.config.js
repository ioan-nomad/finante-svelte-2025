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
          'vendor-svelte': ['svelte'],
          'vendor-chart': ['chart.js'],
          'vendor-pdf': ['pdfjs-dist', 'jspdf'],
          'vendor-xlsx': ['xlsx']
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
    include: ['chart.js', 'pdfjs-dist', 'xlsx', 'jspdf', 'dompurify', 'canvg'],
    exclude: ['@napi-rs/canvas']
  },
  server: {
    port: 5173,
    strictPort: false,
    open: false,  // SCHIMBAT din true în false - NU mai deschide automat
    cors: true,
    host: 'localhost'
  },
  preview: {
    port: 4173,
    open: false  // SCHIMBAT din true în false
  }
})