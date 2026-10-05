import { defineConfig } from 'vite'               // Vite configuration helper
import react from '@vitejs/plugin-react'          // React plugin for Vite
import tailwindcss from '@tailwindcss/vite'       // TailwindCSS plugin for Vite

// Export Vite configuration
export default defineConfig({
  plugins: [
    react(),          // Enable React support (JSX, fast refresh)
    tailwindcss()     // Enable TailwindCSS support
  ],
})
