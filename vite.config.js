import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./src/test/setupRuntimeConfig.js'],
  },
  server: {
    host: 'localhost',
    port: 18082,
    strictPort: false,
  },
})
