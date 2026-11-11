/**
 * Essai « filaments » (Tom, 11 novembre 2026) : la matière de la constellation faite de milliers de fils de broderie
 * qui suivent un courant, « comme l'eau et l'encre ». Derrière `?fils=1` (ou `?fils=2`, plus dense) : sans ce
 * drapeau, rien de ce fichier n'est créé et la constellation reste exactement celle d'avant.
 *
 * Chaque fil est une courte ligne au point avant (quatre points de fil, deux de vide) qui avance dans un champ de
 * courant sans source ni puits (le rotationnel d'un potentiel lisse) : les fils ne s'entassent jamais, ils glissent
 * les uns le long des autres comme des veines d'eau. Près d'une bulle, le courant s'enroule autour d'elle, et un
 * fil sur trois naît sur son bord et prend sa couleur : le fil de chacun rejoint la trame de tous.
 *
 * Le moteur n'est pas modifié : on lit seulement sa caméra et la position des bulles à l'écran.
 */

export type VarianteFils = 1 | 2;

export function varianteFils(): VarianteFils | null {
  if (typeof window === 'undefined') return null;
  // l'adresse (?fils=1), ou un essai mémorisé pour l'onglet (bouton d'essai de l'aperçu partagé)
  let v = new URLSearchParams(window.location.search).get('fils');
  try {
    v ??= window.sessionStorage.getItem('nmm:essai-fils');
  } catch {
    /* stockage refusé : l'adresse seule décide */
  }
  return v === '1' ? 1 : v === '2' ? 2 : null;
}

interface Cam {
  x: number;
  y: number;
  zoom: number;
}
export interface BulleVue {
  x: number;
  y: number;
  r: number;
  hex: string;
}

/** Les fils de la boîte à couture : les tons du musée, plus profonds, et le fil bordeaux du linge écrit. */
const BOBINES = ['#7a2f45', '#3f6fb5', '#7d55a8', '#c4566f', '#d2693c', '#c98f1e', '#4d9468', '#2f8f9a', '#a0527a', '#5b6c8f'];
const FIL_ROUGE = 0;
/** Points gardés par fil, et pas entre deux points (en images) : la longueur d'un fil. */
const POINTS = 22;
const PAS = 5;

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** La couleur d'une bulle en fil teint : plus saturée et un ton plus bas, pour se lire sur la peinture pâle. */
function teindre(hex: string): string {
  const [r, g, b] = rgb(hex);
  const m = (r + g + b) / 3;
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, (m + (v - m) * 1.7) * 0.78)));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

export class Filaments {
  private ctx: CanvasRenderingContext2D;
  private n: number;
  private w = 0;
  private h = 0;
  private dpr = 1;
  /** positions dans le monde de la constellation (un pixel à zoom 1), en anneau par fil */
  private px: Float32Array;
  private py: Float32Array;
  private tete: Uint8Array;
  private longueur: Uint8Array;
  private age: Uint16Array;
  private vie: Uint16Array;
  private allure: Float32Array;
  private phase: Uint8Array;
  private couleur: string[];
  private image = 0;
  private temps = 0;
  private raf = 0;
  private actif = true;
  private reduit = false;
  private pause = false;
  private derniereCam: Cam = { x: NaN, y: NaN, zoom: NaN };
  private peinture: { data: Uint8ClampedArray; w: number; h: number } | null = null;
  private lent = 0;
  private dernierInstant = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    variante: VarianteFils,
    private cam: () => Cam | undefined,
    private bulles: () => BulleVue[],
    fond?: string,
  ) {
    this.ctx = canvas.getContext('2d')!;
    const petit = Math.min(window.innerWidth, window.innerHeight) < 700;
    this.n = Math.round((petit ? 520 : 1500) * (variante === 2 ? 2 : 1));
    const t = this.n * POINTS;
    this.px = new Float32Array(t);
    this.py = new Float32Array(t);
    this.tete = new Uint8Array(this.n);
    this.longueur = new Uint8Array(this.n);
    this.age = new Uint16Array(this.n);
    this.vie = new Uint16Array(this.n);
    this.allure = new Float32Array(this.n);
    this.phase = new Uint8Array(this.n);
    this.couleur = new Array<string>(this.n).fill(BOBINES[FIL_ROUGE]!);
    this.resize();
    if (fond) this.lirePeinture(fond);
  }

  /** La peinture du fond, réduite à quelques pixels : un fil né loin des bulles prend le ton de ce qu'il traverse. */
  private lirePeinture(src: string) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const w = 64;
      const h = Math.max(1, Math.round((64 * img.naturalHeight) / img.naturalWidth));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true });
      if (!x) return;
      x.drawImage(img, 0, 0, w, h);
      try {
        this.peinture = { data: x.getImageData(0, 0, w, h).data, w, h };
      } catch {
        this.peinture = null;
      }
    };
    img.src = src;
  }

  private bobinePour(sx: number, sy: number): string {
    const p = this.peinture;
    if (!p || Math.random() < 0.16) return BOBINES[Math.random() < 0.5 ? FIL_ROUGE : Math.floor(Math.random() * BOBINES.length)]!;
    // l'image couvre l'écran (object-fit: cover)
    const e = Math.max(this.w / p.w, this.h / p.h);
    const ix = Math.min(p.w - 1, Math.max(0, Math.floor((sx - (this.w - p.w * e) / 2) / e)));
    const iy = Math.min(p.h - 1, Math.max(0, Math.floor((sy - (this.h - p.h * e) / 2) / e)));
    const i = (iy * p.w + ix) * 4;
    const r = p.data[i]!, g = p.data[i + 1]!, b = p.data[i + 2]!;
    // la bobine de même teinte que le fond : la peinture est pâle, on compare donc les directions de couleur
    // (l'écart au gris), pas les valeurs
    const m = (r + g + b) / 3;
    const cr = r - m, cg = g - m, cb = b - m;
    const force = Math.hypot(cr, cg, cb);
    if (force < 5) return BOBINES[BOBINES.length - 1]!;
    let mieux = 1, sMax = -Infinity;
    for (let k = 0; k < BOBINES.length; k++) {
      const [br, bg, bb] = rgb(BOBINES[k]!);
      const bm = (br + bg + bb) / 3;
      const s = (cr * (br - bm) + cg * (bg - bm) + cb * (bb - bm)) / (force * (Math.hypot(br - bm, bg - bm, bb - bm) || 1)) + Math.random() * 0.25;
      if (s > sMax) {
        sMax = s;
        mieux = k;
      }
    }
    return BOBINES[mieux]!;
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth || window.innerWidth;
    this.h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.derniereCam.zoom = NaN;
  }

  setActif(v: boolean) {
    this.actif = v;
    if (v) this.boucle();
  }
  setReduit(v: boolean) {
    this.reduit = v;
  }
  setPause(v: boolean) {
    this.pause = v;
  }

  start() {
    const cam = this.cam() ?? { x: 0, y: 0, zoom: 1 };
    const b = this.bulles();
    for (let i = 0; i < this.n; i++) this.naitre(i, cam, b, true);
    // la trame est déjà là à l'arrivée : quelques centaines de pas, sans rien dessiner
    for (let k = 0; k < 150; k++) this.avancer(cam, b, 1);
    this.boucle();
  }
  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private naitre(i: number, cam: Cam, bulles: BulleVue[], partout: boolean) {
    let sx: number, sy: number;
    let teinte: string | null = null;
    if (bulles.length && Math.random() < 0.34) {
      // sur le bord d'une bulle, dans sa couleur
      const b = bulles[Math.floor(Math.random() * bulles.length)]!;
      const a = Math.random() * Math.PI * 2;
      const d = b.r * (1.08 + Math.random() * 0.5);
      sx = b.x + Math.cos(a) * d;
      sy = b.y + Math.sin(a) * d;
      teinte = teindre(b.hex);
    } else {
      sx = -60 + Math.random() * (this.w + 120);
      sy = -60 + Math.random() * (this.h + 120);
    }
    const o = i * POINTS;
    this.px[o] = (sx - this.w / 2) / cam.zoom + cam.x;
    this.py[o] = (sy - this.h / 2) / cam.zoom + cam.y;
    this.tete[i] = 0;
    this.longueur[i] = 1;
    this.vie[i] = 360 + Math.floor(Math.random() * 900);
    this.age[i] = partout ? Math.floor(Math.random() * this.vie[i]! * 0.6) : 0;
    this.allure[i] = 0.55 + Math.random() * 0.8;
    this.phase[i] = Math.floor(Math.random() * 6);
    this.couleur[i] = teinte ?? this.bobinePour(sx, sy);
  }

  /** Le courant en un point du monde : rotationnel d'un potentiel fait de quatre ondes lentes, plus une dérive. */
  private courant(x: number, y: number, t: number): [number, number] {
    let vx = 0.22, vy = 0.07;
    // (nombre d'onde kx, ky ; amplitude ; pulsation ; phase)
    const o = ONDES;
    for (let i = 0; i < o.length; i += 5) {
      const kx = o[i]!, ky = o[i + 1]!, a = o[i + 2]!;
      const c = a * Math.cos(kx * x + ky * y + o[i + 3]! * t + o[i + 4]!);
      vx += c * ky;
      vy -= c * kx;
    }
    return [vx, vy];
  }

  private avancer(cam: Cam, bulles: BulleVue[], dt: number) {
    this.image++;
    this.temps += dt;
    const pousser = this.image % PAS === 0;
    const { w, h } = this;
    const z = cam.zoom;
    for (let i = 0; i < this.n; i++) {
      const o = i * POINTS;
      let t = this.tete[i]!;
      const x = this.px[o + t]!, y = this.py[o + t]!;
      let [vx, vy] = this.courant(x, y, this.temps);
      const sx = (x - cam.x) * z + w / 2, sy = (y - cam.y) * z + h / 2;
      // autour d'une bulle, le courant s'enroule ; contre elle, il s'écarte
      for (let k = 0; k < bulles.length; k++) {
        const b = bulles[k]!;
        const dx = sx - b.x, dy = sy - b.y;
        const lim = b.r * 3;
        if (dx > lim || dx < -lim || dy > lim || dy < -lim) continue;
        const d = Math.hypot(dx, dy) || 1;
        if (d > lim) continue;
        const e = (d - b.r * 1.18) / (b.r * 0.62);
        const s = Math.exp(-e * e);
        const sens = k & 1 ? 1 : -1;
        vx = vx * (1 - 0.86 * s) + ((-dy / d) * sens * 1.15 + (dx / d) * 0.1) * s;
        vy = vy * (1 - 0.86 * s) + ((dx / d) * sens * 1.15 + (dy / d) * 0.1) * s;
        if (d < b.r * 1.06) {
          const p = (1 - d / (b.r * 1.06)) * 2.4;
          vx += (dx / d) * p;
          vy += (dy / d) * p;
        }
      }
      const a = (this.allure[i]! * dt) / z;
      const nx = x + vx * a, ny = y + vy * a;
      if (pousser) {
        t = (t + 1) % POINTS;
        this.tete[i] = t;
        if (this.longueur[i]! < POINTS) this.longueur[i]!++;
      }
      this.px[o + t] = nx;
      this.py[o + t] = ny;
      const age = ++this.age[i]!;
      if (age > this.vie[i]! || sx < -140 || sx > w + 140 || sy < -140 || sy > h + 140) this.naitre(i, cam, bulles, false);
    }
  }

  private dessiner(cam: Cam) {
    const { ctx, w, h, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const z = cam.zoom;
    const cx = w / 2 - cam.x * z, cy = h / 2 - cam.y * z;
    // un tracé par bobine : quelques dizaines de traits à l'écran, pas un par fil
    const parBobine = new Map<string, number[]>();
    for (let i = 0; i < this.n; i++) {
      const c = this.couleur[i]!;
      let l = parBobine.get(c);
      if (!l) parBobine.set(c, (l = []));
      l.push(i);
    }
    for (const [c, fils] of parBobine) {
      ctx.strokeStyle = c;
      for (let passe = 0; passe < 2; passe++) {
        // deux grosseurs de fil : un fil sur quatre est un fil double
        ctx.lineWidth = passe ? 1.7 : 1.05;
        ctx.globalAlpha = passe ? 0.62 : 0.8;
        ctx.beginPath();
        for (const i of fils) {
          if ((i % 4 === 0 ? 1 : 0) !== passe) continue;
          const o = i * POINTS;
          const n = this.longueur[i]!;
          if (n < 2) continue;
          const t = this.tete[i]!;
          const ph = this.phase[i]!;
          // le fil naît et meurt en se raccourcissant : on ne dessine que la part vivante
          const fin = Math.min(1, (this.vie[i]! - this.age[i]!) / 90);
          const depuis = Math.floor((n - 1) * (1 - Math.max(0, fin)));
          let leve = true;
          for (let j = depuis; j < n; j++) {
            const k = o + ((t - (n - 1) + j + POINTS * 2) % POINTS);
            // point avant : quatre points de fil, deux de vide (la phase avance avec le fil)
            if ((j + ph + ((this.image / PAS) | 0)) % 6 >= 4) {
              leve = true;
              continue;
            }
            const sx = this.px[k]! * z + cx, sy = this.py[k]! * z + cy;
            if (leve) {
              ctx.moveTo(sx, sy);
              leve = false;
            } else ctx.lineTo(sx, sy);
          }
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  private boucle = () => {
    if (this.raf || !this.actif) return;
    const pas = (instant: number) => {
      this.raf = 0;
      if (!this.actif) return;
      this.raf = requestAnimationFrame(pas);
      if (document.hidden) return;
      const cam = this.cam();
      if (!cam) return;
      const bouge = cam.x !== this.derniereCam.x || cam.y !== this.derniereCam.y || cam.zoom !== this.derniereCam.zoom;
      // la constellation est un monde qui se referme sur lui-même : si la caméra saute d'un bord à l'autre, les fils la suivent
      const sx = cam.x - this.derniereCam.x, sy = cam.y - this.derniereCam.y;
      if (Math.abs(sx) > 1800 || Math.abs(sy) > 1800) {
        for (let i = 0; i < this.px.length; i++) {
          this.px[i]! += Math.abs(sx) > 1800 ? sx : 0;
          this.py[i]! += Math.abs(sy) > 1800 ? sy : 0;
        }
      }
      this.derniereCam = { x: cam.x, y: cam.y, zoom: cam.zoom };
      const fige = this.pause || this.reduit;
      if (!fige) {
        const dt = this.dernierInstant ? Math.min(2.5, (instant - this.dernierInstant) / 16.67) : 1;
        this.avancer(cam, this.bulles(), dt);
        // un appareil qui peine : on retire des fils plutôt que de saccader
        this.lent = instant - this.dernierInstant > 34 ? this.lent + 1 : Math.max(0, this.lent - 1);
        if (this.lent > 40 && this.n > 240) {
          this.n = Math.round(this.n * 0.8);
          this.lent = 0;
        }
      }
      this.dernierInstant = instant;
      if (!fige || bouge) this.dessiner(cam);
    };
    this.raf = requestAnimationFrame(pas);
  };
}

/** Quatre ondes : longueurs de 1 100 à 240 px, directions sans alignement, pulsations très lentes. */
const ONDES = (() => {
  const l: number[] = [];
  const def: [number, number, number, number][] = [
    // longueur d'onde, angle, vitesse donnée, pulsation
    [1100, 0.5, 0.62, 0.0011],
    [640, 2.1, 0.5, -0.0016],
    [390, 3.9, 0.36, 0.0021],
    [240, 5.3, 0.22, -0.0027],
  ];
  for (const [lambda, angle, v, w] of def) {
    const k = (Math.PI * 2) / lambda;
    // amplitude du potentiel telle que la vitesse (a·k) vaille v
    l.push(Math.cos(angle) * k, Math.sin(angle) * k, v / k, w, angle * 7);
  }
  return l;
})();
