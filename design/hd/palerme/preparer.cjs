/**
 * Préparer les matières de Palerme (Higgsfield, 4K et 5K) pour le site, sans Python ni ImageMagick :
 * ce petit serveur local sert les originaux et une page qui fait le travail dans le navigateur
 * (décodage, détourage du papier blanc, raccord des frises, redimensionnement, WebP), puis
 * reçoit les fichiers produits et les range dans public/hd/palerme/.
 *
 *   node design/hd/palerme/preparer.cjs <dossier des originaux> [port]
 *   puis ouvrir http://127.0.0.1:<port>/ (5190 par défaut) et attendre « Terminé ».
 *
 * Originaux attendus (noms de fichier) : frise-or, frise-palatine, frise-marbres, etoile-tesselles,
 * page-marbre, fond-A-mosaique, fond-D-mosaique (.png).
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const SOURCES = path.resolve(process.argv[2] || '.');
const SORTIE = path.resolve(__dirname, '..', '..', '..', 'public', 'hd', 'palerme');
const PORT = Number(process.argv[3] || 5190);
fs.mkdirSync(SORTIE, { recursive: true });

const PAGE = String.raw`<!doctype html><meta charset="utf-8"><title>Préparer Palerme</title>
<body style="font:15px system-ui;background:#1b1a1d;color:#eee;padding:20px"><h1 style="font-size:18px">Matières de Palerme</h1><pre id="journal"></pre>
<script>
const log = (t) => { document.getElementById('journal').textContent += t + '\n'; };
const charger = (nom) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error(nom)); i.src = '/src/' + nom + '.png'; });
const toile = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
async function envoyer(nom, toileOuBlob, type = 'image/webp', q = 0.88) {
  const blob = toileOuBlob instanceof Blob ? toileOuBlob : await new Promise((r) => toileOuBlob.toBlob(r, type, q));
  const r = await fetch('/out/' + nom, { method: 'POST', body: blob });
  log((r.ok ? '✓ ' : '✗ ') + nom + ' — ' + Math.round(blob.size / 1024) + ' Ko');
}
/** Réduit par paliers de moitié (lissage propre), puis à la taille exacte. */
function reduire(src, w, h, sx = 0, sy = 0, sw = src.width, sh = src.height) {
  let c = toile(sw, sh); c.getContext('2d').drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
  while (c.width / 2 > w && c.height / 2 > h) { const d = toile(Math.round(c.width / 2), Math.round(c.height / 2)); const x = d.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, d.width, d.height); c = d; }
  const f = toile(w, h); const x = f.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, w, h); return f;
}
/** La couleur du papier : la teinte médiane des 40 % de pixels les plus clairs (le papier domine ; les coins, parfois ombrés, ne servent pas de référence). */
function papier(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h).data; const px = [];
  const pas = Math.max(1, Math.floor((w * h) / 60000));
  for (let i = 0; i < w * h; i += pas) { const k = i * 4; px.push([d[k], d[k + 1], d[k + 2], d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11]); }
  px.sort((p, q) => q[3] - p[3]); const clairs = px.slice(0, Math.round(px.length * 0.4));
  const med = (k) => clairs.map((p) => p[k]).sort((a, b) => a - b)[clairs.length >> 1];
  return [med(0), med(1), med(2)];
}
/** Détoure le papier : l'opacité vient de ce qui est plus sombre ou plus coloré que le papier ; plus clair que le papier = papier. */
function detourer(c, seuil = 0.035) {
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const fond = papier(ctx, c.width, c.height);
  const im = ctx.getImageData(0, 0, c.width, c.height); const p = im.data;
  for (let i = 0; i < p.length; i += 4) {
    let a = 0;
    for (let k = 0; k < 3; k++) { const v = p[i + k], b = fond[k]; if (v < b) a = Math.max(a, (b - v) / b); }
    a = Math.min(1, Math.max(0, (a - seuil) / (1 - seuil)));
    a = Math.min(1, a * 1.35);
    if (a > 0.004) for (let k = 0; k < 3; k++) p[i + k] = Math.min(255, Math.max(0, fond[k] + (p[i + k] - fond[k]) / a));
    p[i + 3] = Math.round(a * 255);
  }
  ctx.putImageData(im, 0, 0);
  return c;
}
/** Efface doucement les bords : à gauche et à droite (frises), ou en cercle (étoile). */
function fondreBords(c, forme) {
  const x = c.getContext('2d'); x.globalCompositeOperation = 'destination-in';
  if (forme === 'cercle') {
    const r = Math.min(c.width, c.height) / 2; const g = x.createRadialGradient(c.width / 2, c.height / 2, r * 0.62, c.width / 2, c.height / 2, r * 0.98);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g;
  } else {
    const g = x.createLinearGradient(0, 0, c.width, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(forme, 'rgba(0,0,0,1)'); g.addColorStop(1 - forme, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g;
  }
  x.fillRect(0, 0, c.width, c.height); x.globalCompositeOperation = 'source-over'; return c;
}
/** La bande d'une frise : autour du pic de pigment, les colonnes voisines encore bien peintes (les bords de l'image, parfois ombrés, ne comptent pas). */
function bande(c) {
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const d = ctx.getImageData(0, 0, c.width, c.height).data; const brut = new Float64Array(c.width);
  for (let y = 0; y < c.height; y += 4) for (let x = 0; x < c.width; x++) brut[x] += d[(y * c.width + x) * 4 + 3];
  const col = brut.map((_, x) => { let s = 0, n = 0; for (let k = -4; k <= 4; k++) { const v = brut[x + k]; if (v !== undefined) { s += v; n++; } } return s / n; });
  const bord = Math.round(c.width * 0.06);
  let pic = bord; for (let x = bord; x < c.width - bord; x++) if (col[x] > col[pic]) pic = x;
  const seuil = col[pic] * 0.18, trou = Math.round(c.width * 0.04);
  let g = pic, dr = pic;
  for (let x = pic, vide = 0; x > bord && vide < trou; x--) { if (col[x] > seuil) { g = x; vide = 0; } else vide++; }
  for (let x = pic, vide = 0; x < c.width - bord && vide < trou; x++) { if (col[x] > seuil) { dr = x; vide = 0; } else vide++; }
  return [g, dr];
}
/** Raccorde le bas d'une frise à son haut (fondu sur k pixels) : elle se répète sans couture. */
function raccorder(c, k) {
  const h = c.height - k; const r = toile(c.width, h); const x = r.getContext('2d');
  x.drawImage(c, 0, 0, c.width, h, 0, 0, c.width, h);
  const bas = toile(c.width, k); const xb = bas.getContext('2d');
  xb.drawImage(c, 0, h, c.width, k, 0, 0, c.width, k);
  const g = xb.createLinearGradient(0, 0, 0, k); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  xb.globalCompositeOperation = 'destination-in'; xb.fillStyle = g; xb.fillRect(0, 0, c.width, k);
  const haut = toile(c.width, k); const xh = haut.getContext('2d');
  xh.drawImage(r, 0, 0, c.width, k, 0, 0, c.width, k);
  const g2 = xh.createLinearGradient(0, 0, 0, k); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,1)');
  xh.globalCompositeOperation = 'destination-in'; xh.fillStyle = g2; xh.fillRect(0, 0, c.width, k);
  x.clearRect(0, 0, c.width, k); x.drawImage(haut, 0, 0); x.drawImage(bas, 0, 0);
  return r;
}
(async () => {
  try {
    // 1. les frises : détourées, recadrées sur leur bande, ramenées à 112 px de bande, raccordées
    for (const nom of ['frise-or', 'frise-palatine', 'frise-marbres']) {
      const img = await charger(nom);
      // repérage seulement : un détourage très franc, pour que le papier ne compte pas
      const petit = detourer(reduire(img, Math.round(img.width / 4), Math.round(img.height / 4)), 0.2);
      const [g, d] = bande(petit); const marge = Math.round((d - g) * 0.25);
      const x0 = Math.max(0, (g - marge) * 4), x1 = Math.min(img.width, (d + marge) * 4);
      const largeur = 168, echelle = largeur / (x1 - x0), hauteur = Math.round(img.height * echelle);
      const net = fondreBords(detourer(reduire(img, largeur, hauteur, x0, 0, x1 - x0, img.height), 0.07), 0.18);
      // on retire 4 % en haut et en bas (bords parfois coupés), puis on raccorde sur 90 px
      const coupe = Math.round(hauteur * 0.04); const t = toile(largeur, hauteur - 2 * coupe); t.getContext('2d').drawImage(net, 0, -coupe);
      log(nom + ' : bande ' + (x1 - x0) + ' px sur ' + img.width + ', tuile ' + largeur + ' × ' + (t.height - 90));
      await envoyer(nom + '.webp', raccorder(t, 90));
    }
    // 2. l'étoile en tesselles : détourée, en gris (le site la teinte), 512 px
    { const img = await charger('etoile-tesselles'); await envoyer('etoile-tesselles.webp', fondreBords(detourer(reduire(img, 512, 512), 0.09), 'cercle'), 'image/webp', 0.9); }
    // 3. les fonds 5K : ordinateur 2560 × 1440, téléphone 1080 × 1920 (centre du tableau)
    for (const nom of ['fond-A-mosaique', 'fond-D-mosaique', 'page-marbre']) {
      const img = await charger(nom);
      await envoyer(nom + '-16x9.webp', reduire(img, 2560, 1440), 'image/webp', 0.86);
      const sw = Math.round(img.height * 9 / 16); const sx = Math.round((img.width - sw) / 2);
      await envoyer(nom + '-9x16.webp', reduire(img, 1080, 1920, sx, 0, sw, img.height), 'image/webp', 0.86);
    }
    log('Terminé');
    window.__fini = true;
  } catch (e) { log('ERREUR ' + e.message); }
})();
</script>`;

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
      const f = path.join(SOURCES, m[2]);
      if (!f.startsWith(SOURCES + path.sep) || !fs.existsSync(f)) {
        rep.writeHead(404);
        return rep.end();
      }
      rep.writeHead(200, { 'content-type': 'image/png' });
      return fs.createReadStream(f).pipe(rep);
    }
    if (req.method === 'POST' && m[1] === 'out') {
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
  .listen(PORT, '127.0.0.1', () => console.log(`Préparer Palerme : http://127.0.0.1:${PORT}/  (originaux : ${SOURCES})`));
