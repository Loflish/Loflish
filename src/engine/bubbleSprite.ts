import { hexToRgb, hsl, rgbToHsl } from '../lib/palette';
import { tacheFor } from '../lib/hd';
import { gaussian, hashString, rng } from '../lib/random';

/**
 * Une bulle = un petit fragment de tissu peint à l'aquarelle, puis
 * légèrement brodé. Une seule matière, pas quatre textures empilées :
 *
 *  1. forme irrégulière construite par déformations successives
 *     (contour diffus, jamais un cercle vectoriel net) ;
 *  2. dizaines de voiles translucides superposés → densité de pigment
 *     variable, bords plus chargés comme une aquarelle qui sèche ;
 *  3. granulation et trame de tissage visibles dans le pigment ;
 *  4. un fil qui court sur une partie du bord (point avant), dans une
 *     nuance du même pigment ou d'un fil écru.
 *
 * Chaque bulle est unique (graine = identifiant de la personne) mais toutes
 * ont exactement la même taille.
 */

export const SPRITE_SIZE = 160; // px du canvas source
export const SPRITE_DIAMETER = 0.6; // diamètre nominal de la bulle / taille du sprite

type Pt = [number, number];

function basePolygon(r: () => number, cx: number, cy: number, radius: number, n: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = radius * (1 + gaussian(r) * 0.035);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return pts;
}

/** Déformation récursive par points milieux (technique « aquarelle générative »). */
function deform(r: () => number, pts: Pt[], depth: number, variance: number): Pt[] {
  let cur = pts;
  let v = variance;
  for (let d = 0; d < depth; d++) {
    const next: Pt[] = [];
    for (let i = 0; i < cur.length; i++) {
      const a = cur[i];
      const b = cur[(i + 1) % cur.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      const off = gaussian(r) * len * v;
      const nx = -(b[1] - a[1]) / (len || 1);
      const ny = (b[0] - a[0]) / (len || 1);
      next.push(a, [mx + nx * off, my + ny * off]);
    }
    cur = next;
    v *= 0.62;
  }
  return cur;
}

function tracePath(ctx: CanvasRenderingContext2D, pts: Pt[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

const cache = new Map<string, HTMLCanvasElement>();

export function clearSpriteCache(): void {
  cache.clear();
}

export interface SpriteOptions {
  size?: number;
}

export function bubbleSprite(seedKey: string, hex: string, opts: SpriteOptions = {}): HTMLCanvasElement {
  const size = opts.size ?? SPRITE_SIZE;
  const key = `${seedKey}|${hex}|${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  // rendu logiciel : des centaines de petites opérations sont bien plus rapides sur CPU
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  const r = rng(hashString(seedKey));
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  const c = size / 2;
  const R = (size * SPRITE_DIAMETER) / 2;
  const k = size / 160; // échelle des détails

  const base = deform(r, basePolygon(r, c, c, R, 12), 4, 0.13);

  const tache = tacheFor(hashString(seedKey));
  if (tache) {
    paintTache(ctx, tache, hex, c, R, r);
  } else {
    // 0. léger halo : le pigment qui a « bu » dans la fibre autour de la tache
    for (let i = 0; i < 6; i++) {
      const halo = deform(r, base.map(([x, y]) => [c + (x - c) * (1.06 + i * 0.025), c + (y - c) * (1.06 + i * 0.025)] as Pt), 3, 0.18);
      ctx.fillStyle = hsl(h, s * 0.8, Math.min(0.9, l + 0.06), 0.03);
      tracePath(ctx, halo);
      ctx.fill();
    }

    // 1. voiles successifs
    const layers = 26;
    for (let i = 0; i < layers; i++) {
      const shrink = 1 - (i / layers) * 0.07;
      const poly = deform(
        r,
        base.map(([x, y]) => [c + (x - c) * shrink, c + (y - c) * shrink] as Pt),
        3,
        0.11,
      );
      const hh = h + gaussian(r) * 4;
      const ll = l + gaussian(r) * 0.03;
      ctx.fillStyle = hsl(hh, s * (0.9 + r() * 0.15), ll, 0.052);
      tracePath(ctx, poly);
      ctx.fill();
    }

    ctx.save();
    tracePath(ctx, base);
    ctx.clip();

    // 2. variations internes : zones plus chargées ou plus claires
    for (let i = 0; i < 7; i++) {
      const ang = r() * Math.PI * 2;
      const dist = r() * R * 0.55;
      const blob = deform(r, basePolygon(r, c + Math.cos(ang) * dist, c + Math.sin(ang) * dist, R * (0.18 + r() * 0.3), 7), 3, 0.35);
      const darker = r() < 0.55;
      for (let j = 0; j < 5; j++) {
        ctx.fillStyle = darker
          ? hsl(h + gaussian(r) * 6, Math.min(1, s * 1.08), l - 0.07, 0.05)
          : hsl(h + gaussian(r) * 8, s * 0.85, Math.min(0.95, l + 0.1), 0.06);
        tracePath(ctx, deform(r, blob, 1, 0.2));
        ctx.fill();
      }
    }

    // 3. « fleurs » d'aquarelle : l'eau repousse le pigment
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 3; i++) {
      const ang = r() * Math.PI * 2;
      const dist = R * (0.1 + r() * 0.45);
      const bloom = deform(r, basePolygon(r, c + Math.cos(ang) * dist, c + Math.sin(ang) * dist, R * (0.1 + r() * 0.16), 8), 3, 0.4);
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      tracePath(ctx, bloom);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // 4. trame du tissu, prise dans le pigment
    const step = 2.2 * k;
    for (let y = c - R * 1.1; y < c + R * 1.1; y += step) {
      ctx.strokeStyle = hsl(h, s, l - 0.12, 0.03 + r() * 0.03);
      ctx.lineWidth = 0.7 * k;
      ctx.beginPath();
      ctx.moveTo(c - R * 1.2, y + gaussian(r) * 0.3);
      ctx.lineTo(c + R * 1.2, y + gaussian(r) * 0.3);
      ctx.stroke();
    }
    for (let x = c - R * 1.1; x < c + R * 1.1; x += step) {
      ctx.strokeStyle = hsl(h, s * 0.6, l + 0.12, 0.035 + r() * 0.03);
      ctx.lineWidth = 0.7 * k;
      ctx.beginPath();
      ctx.moveTo(x + gaussian(r) * 0.3, c - R * 1.2);
      ctx.lineTo(x + gaussian(r) * 0.3, c + R * 1.2);
      ctx.stroke();
    }

    // 5. granulation du pigment
    for (let i = 0; i < 520 * k * Math.sqrt(k); i++) {
      const ang = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * R;
      ctx.fillStyle = hsl(h + gaussian(r) * 10, s, l - 0.16 - r() * 0.1, 0.07 + r() * 0.09);
      const sz = (0.5 + r() * 0.9) * Math.sqrt(k);
      ctx.fillRect(c + Math.cos(ang) * d, c + Math.sin(ang) * d, sz, sz);
    }
    ctx.restore();

    // 6. bord plus chargé en pigment (l'aquarelle sèche sur ses bords)
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = hsl(h, Math.min(1, s * 1.05), l - 0.08, 0.05);
      ctx.lineWidth = (1 + r() * 1.2) * k;
      tracePath(ctx, deform(r, base, 1, 0.06));
      ctx.stroke();
    }
  }

  // 7. le fil : un point avant qui court sur une partie du bord
  const creamThread = r() < 0.32;
  const inset = 0.84 + r() * 0.05;
  const loop = deform(r, base.map(([x, y]) => [c + (x - c) * inset, c + (y - c) * inset] as Pt), 1, 0.08);
  // longueur cumulée du contour
  const segs: number[] = [0];
  for (let i = 1; i <= loop.length; i++) {
    const a = loop[i - 1];
    const b = loop[i % loop.length];
    segs.push(segs[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = segs[segs.length - 1];
  const at = (d: number): Pt => {
    const dd = ((d % total) + total) % total;
    let i = 1;
    while (segs[i] < dd) i++;
    const a = loop[i - 1];
    const b = loop[i % loop.length];
    const t = (dd - segs[i - 1]) / (segs[i] - segs[i - 1] || 1);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  const start = r() * total;
  const cover = total * (0.35 + r() * 0.4);
  const stitch = (3.4 + r() * 1.2) * k;
  const gap = (2.3 + r() * 0.8) * k;
  const threadMain = creamThread ? 'rgba(246, 240, 226, 0.85)' : hsl(h + gaussian(r) * 5, Math.min(1, s * 1.1), l - 0.2, 0.78);
  const threadHi = creamThread ? 'rgba(255,255,255,0.5)' : hsl(h, s * 0.7, Math.min(0.92, l + 0.12), 0.45);
  const threadShadow = hsl(h, s, l - 0.3, 0.18);
  for (let d = 0; d < cover; d += stitch + gap) {
    const len = stitch * (0.8 + r() * 0.4);
    const [x1, y1] = at(start + d);
    const [x2, y2] = at(start + d + len);
    const jx = gaussian(r) * 0.35 * k;
    const jy = gaussian(r) * 0.35 * k;
    ctx.lineCap = 'round';
    // ombre portée du fil sur le tissu
    ctx.strokeStyle = threadShadow;
    ctx.lineWidth = 1.7 * k;
    ctx.beginPath();
    ctx.moveTo(x1 + 0.5 * k, y1 + 0.6 * k);
    ctx.lineTo(x2 + jx + 0.5 * k, y2 + jy + 0.6 * k);
    ctx.stroke();
    // fil
    ctx.strokeStyle = threadMain;
    ctx.lineWidth = 1.15 * k;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 + jx, y2 + jy);
    ctx.stroke();
    // torsion du fil : petit reflet
    ctx.strokeStyle = threadHi;
    ctx.lineWidth = 0.45 * k;
    ctx.beginPath();
    ctx.moveTo(x1 - 0.2 * k, y1 - 0.3 * k);
    ctx.lineTo((x1 + x2) / 2 + jx / 2 - 0.2 * k, (y1 + y2) / 2 + jy / 2 - 0.3 * k);
    ctx.stroke();
  }

  cache.set(key, canvas);
  return canvas;
}

/**
 * Version HD : une vraie tache d'aquarelle (planche générée en 4K) sert de
 * matière. Elle est teintée exactement dans la couleur GRIS de la personne ;
 * ses variations de densité, sa granulation et son bord séché sont conservés.
 */
function paintTache(ctx: CanvasRenderingContext2D, tache: HTMLImageElement, hex: string, c: number, R: number, r: () => number): void {
  const size = ctx.canvas.width;
  const side = (2 * R) / 0.82; // la tache occupe ~82 % de sa vignette
  const angle = r() * Math.PI * 2;
  const flip = r() < 0.5 ? -1 : 1;
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = size;
  const t = tmp.getContext('2d', { willReadFrequently: true });
  if (!t) return;
  const place = () => {
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.translate(c, c);
    t.rotate(angle);
    t.scale(flip, 1);
    t.drawImage(tache, -side / 2, -side / 2, side, side);
    t.setTransform(1, 0, 0, 1, 0, 0);
  };
  // 1. le pigment : couleur GRIS exacte, découpée par la forme de la tache
  place();
  t.globalCompositeOperation = 'source-in';
  t.fillStyle = hex;
  t.fillRect(0, 0, size, size);
  // 2. la densité : la tache assombrit là où elle était plus chargée
  t.globalCompositeOperation = 'multiply';
  t.globalAlpha = 0.6;
  place();
  ctx.drawImage(tmp, 0, 0);
}

/** Image de la bulle pour le DOM (profil, Se perdre, création). */
export function bubbleDataUrl(seedKey: string, hex: string, size = 320): string {
  return bubbleSprite(seedKey, hex, { size }).toDataURL('image/png');
}
