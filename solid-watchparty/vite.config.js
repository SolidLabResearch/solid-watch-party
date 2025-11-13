import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import config from './config.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: `${config.baseDir}`,
  build: {
    outDir: config.outDir
  },
  server: {
    host: true, // 0.0.0.0
    port: 8080,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 200
    }
  }
})
