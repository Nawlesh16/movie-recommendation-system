import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration for the React app
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Future-proofing: proxy API requests to backend when it's built
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})