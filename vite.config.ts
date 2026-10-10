import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // the Firebase SDK alone is ~700 kB minified; the app is a single SPA bundle on purpose
  build: { chunkSizeWarningLimit: 1200 },
})
