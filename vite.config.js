import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/admin':    { target: 'http://localhost:8000', changeOrigin: true },
      '/sync':     { target: 'http://localhost:8000', changeOrigin: true },
      '/auth':     { target: 'http://localhost:8081', changeOrigin: true },
      '/accounts': { target: 'http://localhost:8082', changeOrigin: true },
    },
  },
})
