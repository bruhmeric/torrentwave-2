import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/prowlarr': {
        target: 'http://localhost:9696', // Your local Prowlarr server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/prowlarr/, ''),
      }
    }
  }
})