import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/admin':    'http://localhost:80',
      '/sync':     'http://localhost:80',
      '/auth':     'http://localhost:80',
      '/accounts': 'http://localhost:80',
    },
  },
})
