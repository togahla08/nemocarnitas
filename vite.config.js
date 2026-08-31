import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postcss from 'postcss'

// Configuración de Tailwind mediante PostCSS
const tailwindConfig = {
  plugins: [],
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  css: {
    postcss: tailwindConfig,
  },
  server: {
    open: true,
    port: 5173,
  },
})