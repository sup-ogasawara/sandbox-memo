import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 開発中は API を wrangler（pnpm dev:api）に転送する
    proxy: { '/api': 'http://localhost:8788' },
  },
})
