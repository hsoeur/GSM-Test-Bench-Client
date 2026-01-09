import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 18082,
    strictPort: false,
    proxy: {
      // Separate proxies to avoid path conflicts between backends
      '/gsm-api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/gsm-api/, ''),
      },
      '/data-api': {
        target: 'http://localhost:5252',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/data-api/, ''),
      },
    },
  },
})
