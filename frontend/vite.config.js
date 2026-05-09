import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://taskflow-manager-production-371d.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
