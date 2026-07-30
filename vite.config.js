import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANTE: si tu repo se llama distinto de "cuyin-aprende",
// cambiá el valor de 'base' abajo por "/nombre-de-tu-repo/".
// Si vas a usar Vercel/Netlify en vez de GitHub Pages, poné base: './'
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/CUYIN-APRENDE/' : '/'
})
