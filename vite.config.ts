import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 8080,
    host: true,
    allowedHosts: ['healthcheck.railway.app', 'localhost', '0.0.0.0']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
