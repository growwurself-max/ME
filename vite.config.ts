import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'react'
          }
          if (id.includes('node_modules/@react-three/')) return 'r3f'
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('node_modules/gsap/') || id.includes('node_modules/lenis/')) return 'gsap'
        },
      },
    },
  },
})
