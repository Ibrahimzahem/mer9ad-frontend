import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Plain client-side SPA. Port 5173 is REQUIRED: the Shield backend only
// allows CORS for http://localhost:5173 (WebCorsConfig.java).
//
// host: true exposes the dev server on the LAN (0.0.0.0) so a phone can reach
// it. The browser then only ever talks to the Vite origin; /api is proxied
// server-side to the backend, so CORS never comes into play regardless of
// which host/IP the phone uses. Keep VITE_API_BASE empty to use this proxy.
export default defineConfig({
  appType: 'spa',
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  preview: { host: true, port: 5173, strictPort: true },
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: {
      '#': new URL('./src', import.meta.url).pathname,
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
})
