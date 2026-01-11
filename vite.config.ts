import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2019',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (id.includes('react')) return 'react-vendor'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('emoji-mart') || id.includes('@emoji-mart')) return 'emoji'
          return 'vendor'
        },
      },
    },
  },
})
