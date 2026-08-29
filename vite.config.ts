import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Explicit base so asset paths resolve correctly when served from nginx /
  base: '/',
  build: {
    // Emit source maps only in dev builds; keep prod bundle clean
    sourcemap: false,
    // Chunk size warning threshold (bytes) — inform but don't block CI
    chunkSizeWarningLimit: 600,
  },
})
