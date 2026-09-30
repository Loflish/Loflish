import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' : le build fonctionne sur n'importe quel hébergement statique (chemins relatifs).
export default defineConfig({
  base: './',
  plugins: [react()],
});
