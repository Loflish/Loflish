/**
 * Mélanger un nouveau fond Higgsfield (5K) avec la peinture actuelle de la constellation, comme Tom
 * l'a choisi le 21 octobre 2026 : le nouveau posé à moitié sur l'actuel (on garde son papier naturel,
 * on gagne les couleurs et la broderie). Même principe que design/hd/palerme/preparer.cjs : un petit
 * serveur local, et le travail se fait dans le navigateur (décodage, mélange, redimensionnement, WebP).
 *
 *   node design/hd/essais/melanger.cjs <original.png> <nom> [part du nouveau] [port]
 *   puis ouvrir http://127.0.0.1:<port>/ (5191 par défaut) et attendre « Terminé ».
 *
 * Produit public/hd/essais/<nom>-16x9.webp (2560 × 1440) et <nom>-9x16.webp (1080 × 1920).
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ORIGINAL = path.resolve(process.argv[2] || '');
const NOM = /^[a-z0-9-]+$/.test(process.argv[3] || '') ? process.argv[3] : 'fond-essai';
const PART = Math.min(1, Math.max(0, Number(process.argv[4] ?? 0.55)));
const PORT = Number(process.argv[5] || 5191);
const HD = path.resolve(__dirname, '..', '..', '..', 'public', 'hd');
const SORTIE = path.join(HD, 'essais');
fs.mkdirSync(SORTIE, { recursive: true });

const PAGE = String.raw`<!doctype html><meta charset="utf-8"><title>Mélanger le fond</title>
<body style="font:15px system-ui;background:#1b1a1d;color:#eee;padding:20px"><h1 style="font-size:18px">Mélange ${NOM} (${Math.round(PART * 100)} % du nouveau)</h1><pre id="journal"></pre>
<script>
const log = (t) => { document.getElementById('journal').textContent += t + '\n'; };
const charger = (url) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error(url)); i.src = url; });
const toile = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
async function envoyer(nom, c, q = 0.88) {
  const blob = await new Promise((r) => c.toBlob(r, 'image/webp', q));
  const r = await fetch('/out/' + nom, { method: 'POST', body: blob });
  log((r.ok ? '✓ ' : '✗ ') + nom + ' — ' + c.width + ' × ' + c.height + ', ' + Math.round(blob.size / 1024) + ' Ko');
}
/** Réduit par paliers de moitié (lissage propre), puis à la taille exacte, en couvrant le cadre. */
function couvrir(src, w, h) {
  const s = Math.max(w / src.width, h / src.height); const sw = w / s, sh = h / s;
  let c = toile(Math.round(sw), Math.round(sh)); c.getContext('2d').drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, c.width, c.height);
  while (c.width / 2 > w && c.height / 2 > h) { const d = toile(Math.round(c.width / 2), Math.round(c.height / 2)); const x = d.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, d.width, d.height); c = d; }
  const f = toile(w, h); const x = f.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, w, h); return f;
}
/** La peinture actuelle dessous, le nouveau fond par-dessus à la part choisie. */
function melanger(actuel, nouveau, w, h, part) {
  const c = couvrir(actuel, w, h); const x = c.getContext('2d');
  x.globalAlpha = part; x.drawImage(couvrir(nouveau, w, h), 0, 0); x.globalAlpha = 1; return c;
}
(async () => {
  try {
    const nouveau = await charger('/src/original.png');
    const [large, haut] = await Promise.all([charger('/src/fond-16x9.webp'), charger('/src/fond-9x16.webp')]);
    log('original ' + nouveau.width + ' × ' + nouveau.height);
    await envoyer('${NOM}-16x9.webp', melanger(large, nouveau, 2560, 1440, ${PART}), 0.88);
    await envoyer('${NOM}-9x16.webp', melanger(haut, nouveau, 1080, 1920, ${PART}), 0.88);
    log('Terminé');
    window.__fini = true;
  } catch (e) { log('ERREUR ' + e.message); }
})();
</script>`;

const SOURCES = { 'original.png': ORIGINAL, 'fond-16x9.webp': path.join(HD, 'fond-16x9.webp'), 'fond-9x16.webp': path.join(HD, 'fond-9x16.webp') };

http
  .createServer((req, rep) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    if (req.method === 'GET' && url === '/') {
      rep.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return rep.end(PAGE);
    }
    const m = /^\/(src|out)\/([a-zA-Z0-9-]+(?:\.[a-z0-9]+)*)$/.exec(url);
    if (!m) {
      rep.writeHead(404);
      return rep.end();
    }
    if (req.method === 'GET' && m[1] === 'src') {
      const f = SOURCES[m[2]];
      if (!f || !fs.existsSync(f)) {
        rep.writeHead(404);
        return rep.end();
      }
      rep.writeHead(200, { 'content-type': m[2].endsWith('.png') ? 'image/png' : 'image/webp' });
      return fs.createReadStream(f).pipe(rep);
    }
    if (req.method === 'POST' && m[1] === 'out' && m[2].startsWith(NOM + '-')) {
      const morceaux = [];
      req.on('data', (c) => morceaux.push(c));
      req.on('end', () => {
        fs.writeFileSync(path.join(SORTIE, m[2]), Buffer.concat(morceaux));
        console.log('écrit', m[2]);
        rep.writeHead(204);
        rep.end();
      });
      return;
    }
    rep.writeHead(405);
    rep.end();
  })
  .listen(PORT, '127.0.0.1', () => console.log(`Mélanger ${NOM} : http://127.0.0.1:${PORT}/  (original : ${ORIGINAL})`));
