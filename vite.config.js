import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: './', // Important pentru deploy
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable pentru production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log în production
        drop_debugger: true
      }
    }
  }
})
