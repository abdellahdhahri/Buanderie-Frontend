import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ['lottie-react']
  },
  define: {
    global: 'window'
  },
  server: {
    watch: {
      usePolling: true,
      interval: 100
    }
  }
})