import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * L'atelier des bulles (développement seulement) : les avis de Tom et ses duels de la coupe des bulles sont aussi
 * écrits dans design/, pour survivre à un navigateur qui perd sa mémoire (26 octobre : quatre avis perdus ainsi).
 * Une adresse par fichier, jamais dans le site publié.
 */
function atelierBulles(): Plugin {
  const dossier = path.join(path.dirname(fileURLToPath(import.meta.url)), 'design');
  const fichiers: Record<string, string> = {
    '/__atelier-bulles': path.join(dossier, 'atelier-bulles.json'),
    '/__coupe-bulles': path.join(dossier, 'coupe-bulles.json'),
  };
  return {
    name: 'atelier-bulles',
    apply: 'serve',
    configureServer(server) {
      for (const [adresse, fichier] of Object.entries(fichiers)) server.middlewares.use(adresse, (req, res) => {
        if (req.method === 'POST') {
          let corps = '';
          req.on('data', (morceau) => (corps += morceau));
          req.on('end', () => {
            try {
              JSON.parse(corps);
              fs.mkdirSync(path.dirname(fichier), { recursive: true });
              fs.writeFileSync(fichier, corps);
              res.statusCode = 204;
            } catch {
              res.statusCode = 400;
            }
            res.end();
          });
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(fs.existsSync(fichier) ? fs.readFileSync(fichier, 'utf8') : '{}');
      });
    },
  };
}

// base './' : le build fonctionne sur n'importe quel hébergement statique (chemins relatifs).
// En développement « en ligne » (npm run dev:en-ligne), /api est renvoyé vers le serveur local.
export default defineConfig({
  base: './',
  plugins: [react(), atelierBulles()],
  server: {
    proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: false } },
  },
});
