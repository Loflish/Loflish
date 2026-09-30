import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' : le build fonctionne sur n'importe quel hébergement statique (chemins relatifs).
// En développement « en ligne » (npm run dev:en-ligne), /api est renvoyé vers le serveur local.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: false } },
  },
});
