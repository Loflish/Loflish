// Découpe une planche 2 × 2 (Higgsfield) en quatre matières de bulles, comme preparer.py le fait pour les
// planches 3 × 3 de la palette A, mais sans scipy et en 512 px :
//   node design/hd/taches_vie.cjs <dossier: taches-vie|taches-da> <préfixe: vie|da> <numéros: 14,1,2,27 (ordre : haut gauche, haut droite, bas gauche, bas droite)> <planche.png>
// Chaque matière reste en gris : alpha = quantité de pigment, gris = densité (le site la teinte ensuite).
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FFD = path.join(process.env.LOCALAPPDATA, 'Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin');
const FF = path.join(FFD, 'ffmpeg.exe');
const FP = path.join(FFD, 'ffprobe.exe');
const [dossier, prefixe, liste, planche] = process.argv.slice(2);
const numeros = liste.split(",").map(Number);
const OUT = path.resolve(__dirname, '../../public/hd', dossier);
fs.mkdirSync(OUT, { recursive: true });
const N = 512;

const [W, H] = execFileSync(FP, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', planche]).toString().trim().split(',').map(Number);
const gris = (filtre, w, h) => execFileSync(FF, ['-v', 'error', '-i', planche, '-vf', `${filtre},format=gray,scale=${w}:${h}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1 << 28 });
const centile = (arr, p) => { const s = Float32Array.from(arr).sort(); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };

// 0. le papier : certaines planches sont photographiées sur une table sombre. Une ligne (ou colonne) est du papier
// si au moins 10 % de ses pixels sont blancs (les marges entre les taches le sont toujours) ; les quarts se coupent dans le papier.
const P = 512;
const feuille = gris('null', P, P);
const blancFeuille = centile(feuille, 0.92);
const papier = (val) => {
  const ok = Array.from({ length: P }, (_, i) => centile(val(i), 0.9) > blancFeuille - 40);
  return [ok.indexOf(true), P - 1 - ok.slice().reverse().indexOf(true)];
};
const [py0, py1] = papier((y) => feuille.subarray(y * P, y * P + P));
const [px0, px1] = papier((x) => Array.from({ length: P }, (_, y) => feuille[y * P + x]));
const bx = Math.round((px0 / P) * W), by = Math.round((py0 / P) * H);
const bw = Math.round(((px1 + 1 - px0) / P) * W), bh = Math.round(((py1 + 1 - py0) / P) * H);
if (bw < W * 0.98 || bh < H * 0.98) console.log(`papier ${bw}×${bh} à ${bx},${by} (bord sombre écarté)`);

for (const [k, [qy, qx]] of [[0, 0], [0, 1], [1, 0], [1, 1]].entries()) {
  const n = numeros[k];
  if (!n) continue;
  const qw = Math.floor(bw / 2), qh = Math.floor(bh / 2), ox = bx + qx * qw, oy = by + qy * qh;
  // 1. repérer la tache dans le quart (en petit)
  const A = 256;
  const g = gris(`crop=${qw}:${qh}:${ox}:${oy}`, A, A);
  const fond = centile(g, 0.92);
  const lignes = new Array(A).fill(0), colonnes = new Array(A).fill(0);
  // le pourtour du quart est ignoré : le bord gris d'une feuille scannée y passe parfois
  const marge = Math.round(A * 0.04);
  for (let y = marge; y < A - marge; y++) for (let x = marge; x < A - marge; x++) if (fond - g[y * A + x] > 14) { lignes[y]++; colonnes[x]++; }
  const seuil = A * 0.04; // une ligne compte si au moins 4 % de ses pixels sont peints (ignore poussières et bords)
  // seulement la bande d'un seul tenant autour du milieu du quart (où est la tache) : un trait de cadre séparé par la marge blanche n'y entre pas
  const bande = (compte) => {
    const m = Math.floor(A / 2);
    let c = -1;
    for (let d = 0; d < A / 4 && c < 0; d++) c = compte[m - d] > seuil ? m - d : compte[m + d] > seuil ? m + d : -1;
    if (c < 0) return [];
    let a = c, b = c;
    const trou = 6;
    for (let i = c - 1; i >= 0 && a - i <= trou; i--) if (compte[i] > seuil) a = i;
    for (let i = c + 1; i < compte.length && i - b <= trou; i++) if (compte[i] > seuil) b = i;
    return [a, b];
  };
  const ys = bande(lignes), xs = bande(colonnes);
  if (!ys.length || !xs.length) { console.log('quart vide', qy, qx); continue; }
  const cy = ((ys[0] + ys[ys.length - 1]) / 2 / A) * qh, cx = ((xs[0] + xs[xs.length - 1]) / 2 / A) * qw;
  const diam = (Math.max(ys[ys.length - 1] - ys[0], xs[xs.length - 1] - xs[0]) / A) * Math.max(qw, qh);
  const cote = Math.round(diam / 0.82); // comme la palette A : la tache occupe ~82 % de sa vignette
  const x0 = Math.round(ox + cx - cote / 2), y0 = Math.round(oy + cy - cote / 2);
  // 2. la vignette carrée, en pleine définition puis réduite à 512 px
  const v = gris(`pad=iw+${cote}:ih+${cote}:${Math.round(cote / 2)}:${Math.round(cote / 2)}:white,crop=${cote}:${cote}:${x0 + Math.round(cote / 2)}:${y0 + Math.round(cote / 2)}`, N, N);
  const fondV = Math.max(fond, centile(v, 0.92));
  const d = new Float32Array(N * N);
  for (let i = 0; i < d.length; i++) d[i] = Math.max(0, fondV - v[i]);
  const hi = centile(d.filter((x) => x > 3), 0.98) || 1;
  const rgba = Buffer.alloc(N * N * 4);
  const r0 = (N * 0.82) / 2;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    // hors de la tache (un peu au-delà de son bord), plus rien : ni poussière ni voisine
    const rr = Math.hypot(x - N / 2, y - N / 2) / r0;
    const garde = rr < 1.06 ? 1 : rr < 1.16 ? (1.16 - rr) / 0.1 : 0;
    const a = Math.min(1, d[i] / hi) ** 0.8 * garde;
    const alpha = Math.min(1, a * 1.35);
    const teinte = 255 - a * 105;
    rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = Math.round(teinte);
    rgba[i * 4 + 3] = Math.round(alpha * 255);
  }
  const sortie = path.join(OUT, `${prefixe}-${String(n).padStart(2, '0')}.webp`);
  execFileSync(FF, ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${N}x${N}`, '-i', '-', '-c:v', 'libwebp', '-pix_fmt', 'yuva420p', '-quality', '88', sortie], { input: rgba });
  console.log(path.basename(sortie), `centre ${Math.round(cx)},${Math.round(cy)} diamètre ${Math.round(diam)} px`);
}

// la liste des matières prêtes, lue par le site (pas de requête pour celles qui restent à faire)
const pretes = fs
  .readdirSync(OUT)
  .filter((f) => f.startsWith(`${prefixe}-`) && f.endsWith('.webp'))
  .map((f) => Number(f.slice(prefixe.length + 1, -5)))
  .filter((k) => Number.isInteger(k) && k > 0)
  .sort((a, b) => a - b);
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(pretes));
console.log(`${pretes.length} matières prêtes dans ${dossier}`);
