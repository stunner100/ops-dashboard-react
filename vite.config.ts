import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()]

  if (process.env.ANALYZE === 'true') {
    const { visualizer } = await import('rollup-plugin-visualizer')
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    )
  }

  return {
    plugins,
    build: {
      target: 'es2019',
      sourcemap: false,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('react')) return 'react-vendor'
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('emoji-mart') || id.includes('@emoji-mart')) return 'emoji'
            return 'vendor'
          },
        },
      },
    },
  }
})
