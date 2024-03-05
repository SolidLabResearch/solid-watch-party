import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import config from './config.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: config.baseDir,
  build: {
    outDir: config.outDir
  },
})
