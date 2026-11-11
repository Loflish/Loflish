/**
 * Essai « filaments » (Tom, 11 novembre 2026) : la matière de la constellation faite de milliers de fils de broderie
 * qui suivent un chemin, « comme l'eau et l'encre ». Derrière `?fils=1` (ou `?fils=2`, plus dense) : sans ce
 * drapeau, rien de ce fichier n'est créé et la constellation reste exactement celle d'avant.
 *
 * Deuxième version, d'après ses deux images (de longs traits fins tirés d'un même geste, et les hachures au crayon
 * de couleur des dessins de mise en place) : de longs fils très fins, presque droits, qui couvrent tout l'espace,
 * se suivent par faisceaux, se croisent en deux familles comme une hachure croisée, et prennent la couleur de la
 * peinture qu'ils traversent. Ils glissent lentement le long de leur propre chemin. Aspect brut : chaque point
 * est posé un peu à côté, comme à la main, et le fil est cousu en longs points lancés.
 * (La première version, des fils courts qui s'enroulaient autour des bulles, est dans l'historique : cbb9e77.)
 *
 * Le moteur n'est pas modifié : on lit seulement sa caméra et la position des bulles à l'écran.
 */

export type VarianteFils = 1 | 2;

export function varianteFils(): VarianteFils | null {
  if (typeof window === 'undefined') return null;
  // l'adresse (?fils=1), ou un essai mémorisé pour l'onglet (bouton d'essai de l'aperçu partagé)
  let v = new URLSearchParams(window.location.search).get('fils');
  // l'aperçu partagé, où l'adresse ne se modifie pas, pose son choix avant le chargement du site
  v ??= (window as unknown as { __nmmEssais?: { fils?: string | null } }).__nmmEssais?.fils ?? null;
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

/** Le fil bordeaux du linge écrit : un fil sur douze, pour tenir l'ensemble. */
const FIL_ROUGE = 'rgb(122,47,69)';
/** Points gardés par fil, et images entre deux points : un fil fait jusqu'à 15 segments de 16 à 36 px. */
const POINTS = 16;
const PAS = 32;

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/**
 * Une couleur de la peinture ou d'une bulle devient un fil teint : même teinte, plus saturée, un ton plus bas
 * (la peinture est pâle, un fil de sa couleur exacte ne se verrait pas). Arrondie à quelques valeurs : les fils
 * de même bobine sont tracés d'un seul geste.
 */
function teindre(r: number, g: number, b: number): string {
  const m = (r + g + b) / 3;
  const c = (v: number) => {
    const t = Math.min(255, Math.max(0, (m + (v - m) * 2.4) * 0.74));
    return Math.round(t / 24) * 24;
  };
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

export class Filaments {
  private ctx: CanvasRenderingContext2D;
  private n: number;
  private w = 0;
  private h = 0;
  private dpr = 1;
  /** les points posés, dans le monde de la constellation (un pixel à zoom 1), en anneau par fil */
  private px: Float32Array;
  private py: Float32Array;
  /** la pointe de l'aiguille : la position exacte, sans le tremblé de la main */
  private ax: Float32Array;
  private ay: Float32Array;
  private tete: Uint8Array;
  private longueur: Uint8Array;
  private age: Uint16Array;
  private vie: Uint16Array;
  private allure: Float32Array;
  /** la famille de hachure : 0, le grand geste ; 1, celle qui le croise */
  private famille: Uint8Array;
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
    this.n = Math.round((petit ? 1000 : 2800) * (variante === 2 ? 1.8 : 1));
    const t = this.n * POINTS;
    this.px = new Float32Array(t);
    this.py = new Float32Array(t);
    this.ax = new Float32Array(this.n);
    this.ay = new Float32Array(this.n);
    this.tete = new Uint8Array(this.n);
    this.longueur = new Uint8Array(this.n);
    this.age = new Uint16Array(this.n);
    this.vie = new Uint16Array(this.n);
    this.allure = new Float32Array(this.n);
    this.famille = new Uint8Array(this.n);
    this.couleur = new Array<string>(this.n).fill(FIL_ROUGE);
    this.resize();
    if (fond) this.lirePeinture(fond);
  }

  /** La peinture du fond, réduite à quelques pixels : chaque fil prend le ton de ce qu'il traverse. */
  private lirePeinture(src: string) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const w = 96;
      const h = Math.max(1, Math.round((96 * img.naturalHeight) / img.naturalWidth));
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
        return;
      }
      // les fils déjà cousus avant l'arrivée de la peinture prennent leur couleur maintenant
      const cam = this.cam() ?? { x: 0, y: 0, zoom: 1 };
      const b = this.bulles();
      for (let i = 0; i < this.n; i++) {
        const sx = (this.ax[i]! - cam.x) * cam.zoom + this.w / 2, sy = (this.ay[i]! - cam.y) * cam.zoom + this.h / 2;
        this.couleur[i] = this.bobinePour(sx, sy, b);
      }
    };
    img.src = src;
  }

  private bobinePour(sx: number, sy: number, bulles: BulleVue[]): string {
    const tirage = Math.random();
    if (tirage < 0.08) return FIL_ROUGE;
    // un fil sur cinq prend la couleur de la bulle la plus proche : le fil de chacun dans la trame de tous
    if (tirage < 0.28 && bulles.length) {
      let mieux = bulles[0]!, dMin = Infinity;
      for (const b of bulles) {
        const d = (b.x - sx) ** 2 + (b.y - sy) ** 2;
        if (d < dMin) {
          dMin = d;
          mieux = b;
        }
      }
      const [r, g, b] = rgb(mieux.hex);
      return teindre(r, g, b);
    }
    const p = this.peinture;
    if (!p) return 'rgb(120,96,120)';
    // l'image couvre l'écran (object-fit: cover)
    const e = Math.max(this.w / p.w, this.h / p.h);
    const ix = Math.min(p.w - 1, Math.max(0, Math.floor((sx - (this.w - p.w * e) / 2) / e)));
    const iy = Math.min(p.h - 1, Math.max(0, Math.floor((sy - (this.h - p.h * e) / 2) / e)));
    const i = (iy * p.w + ix) * 4;
    return teindre(p.data[i]!, p.data[i + 1]!, p.data[i + 2]!);
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
    // la trame est déjà là à l'arrivée : les fils sont tirés d'avance, sans rien dessiner
    for (let k = 0; k < PAS * (POINTS - 1); k++) this.avancer(cam, b, 1);
    this.boucle();
  }
  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private naitre(i: number, cam: Cam, bulles: BulleVue[], partout: boolean) {
    // partout sur la toile, et un peu au-delà : les fils entrent et sortent par les bords
    const sx = -160 + Math.random() * (this.w + 320);
    const sy = -160 + Math.random() * (this.h + 320);
    const o = i * POINTS;
    const x = (sx - this.w / 2) / cam.zoom + cam.x, y = (sy - this.h / 2) / cam.zoom + cam.y;
    this.px[o] = this.ax[i] = x;
    this.py[o] = this.ay[i] = y;
    this.tete[i] = 0;
    this.longueur[i] = 1;
    this.vie[i] = PAS * (POINTS + 4) + Math.floor(Math.random() * 1400);
    this.age[i] = partout ? Math.floor(Math.random() * 300) : 0;
    this.allure[i] = 0.5 + Math.random() * 0.62;
    this.famille[i] = Math.random() < 0.22 ? 1 : 0;
    this.couleur[i] = this.bobinePour(sx, sy, bulles);
  }

  /**
   * La direction du geste en un point du monde. Un grand mouvement d'ensemble (vers le haut et la droite), qui
   * s'incurve lentement d'un endroit à l'autre : les fils voisins se suivent, se resserrent en faisceaux là où le
   * geste converge, s'écartent ailleurs. La seconde famille croise la première d'un quart de tour environ.
   */
  private direction(x: number, y: number, t: number, famille: number): number {
    const a =
      0.62 * Math.sin(x * 0.00125 + y * 0.0007 + t * 0.00055) +
      0.4 * Math.sin(-x * 0.0019 + y * 0.0026 + 1.7 - t * 0.0008) +
      0.2 * Math.sin(x * 0.0052 + y * 0.0041 + 4.1 + t * 0.0011);
    return (famille ? -0.18 : -0.98) + a * (famille ? 0.7 : 1);
  }

  private avancer(cam: Cam, bulles: BulleVue[], dt: number) {
    this.image++;
    this.temps += dt;
    const pousser = this.image % PAS === 0;
    const { w, h } = this;
    const z = cam.zoom;
    for (let i = 0; i < this.n; i++) {
      const o = i * POINTS;
      const dir = this.direction(this.ax[i]!, this.ay[i]!, this.temps, this.famille[i]!);
      const a = (this.allure[i]! * dt) / z;
      const x = (this.ax[i] = this.ax[i]! + Math.cos(dir) * a);
      const y = (this.ay[i] = this.ay[i]! + Math.sin(dir) * a);
      let t = this.tete[i]!;
      if (pousser) {
        // le point posé : un peu à côté de la ligne idéale, comme à la main
        const ecart = (Math.random() - 0.5) * 2.6;
        this.px[o + t] = x - Math.sin(dir) * ecart;
        this.py[o + t] = y + Math.cos(dir) * ecart;
        t = (t + 1) % POINTS;
        this.tete[i] = t;
        if (this.longueur[i]! < POINTS) this.longueur[i] = this.longueur[i]! + 1;
      }
      this.px[o + t] = x;
      this.py[o + t] = y;
      const age = (this.age[i] = this.age[i]! + 1);
      const sx = (x - cam.x) * z + w / 2, sy = (y - cam.y) * z + h / 2;
      if (age > this.vie[i]! || sx < -520 || sx > w + 520 || sy < -520 || sy > h + 520) this.naitre(i, cam, bulles, false);
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
    // la part déjà parcourue du pas en cours : la queue du fil se retire d'autant, sans à-coup
    const part = (this.image % PAS) / PAS;
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
        // deux grosseurs : le fil simple, très fin, et un fil sur cinq, double
        ctx.lineWidth = passe ? 1.25 : 0.7;
        ctx.globalAlpha = passe ? 0.5 : 0.72;
        // de longs points lancés : le fil plonge un instant dans la toile, puis ressort
        ctx.setLineDash(passe ? [34, 3.5] : [22, 2.6]);
        ctx.beginPath();
        for (const i of fils) {
          if ((i % 5 === 0 ? 1 : 0) !== passe) continue;
          const n = this.longueur[i]!;
          if (n < 2) continue;
          const o = i * POINTS;
          const t = this.tete[i]!;
          const en = (j: number) => o + ((t - (n - 1) + j + POINTS * 2) % POINTS);
          // le fil s'efface par la queue en fin de vie : on ne dessine que la part vivante
          const reste = Math.min(1, (this.vie[i]! - this.age[i]!) / (PAS * 3));
          const depuis = Math.min(n - 2, Math.floor((n - 1) * (1 - Math.max(0, reste))));
          const k0 = en(depuis), k1 = en(depuis + 1);
          const f = n === POINTS && depuis === 0 ? part : 0;
          ctx.moveTo((this.px[k0]! + (this.px[k1]! - this.px[k0]!) * f) * z + cx, (this.py[k0]! + (this.py[k1]! - this.py[k0]!) * f) * z + cy);
          // une courbe douce par les milieux : pas d'angle entre deux points
          for (let j = depuis + 1; j < n - 1; j++) {
            const ka = en(j), kb = en(j + 1);
            const xa = this.px[ka]! * z + cx, ya = this.py[ka]! * z + cy;
            ctx.quadraticCurveTo(xa, ya, (xa + this.px[kb]! * z + cx) / 2, (ya + this.py[kb]! * z + cy) / 2);
          }
          ctx.lineTo(this.px[o + t]! * z + cx, this.py[o + t]! * z + cy);
        }
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
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
        const dx = Math.abs(sx) > 1800 ? sx : 0, dy = Math.abs(sy) > 1800 ? sy : 0;
        for (let i = 0; i < this.px.length; i++) {
          this.px[i] = this.px[i]! + dx;
          this.py[i] = this.py[i]! + dy;
        }
        for (let i = 0; i < this.n; i++) {
          this.ax[i] = this.ax[i]! + dx;
          this.ay[i] = this.ay[i]! + dy;
        }
      }
      this.derniereCam = { x: cam.x, y: cam.y, zoom: cam.zoom };
      const fige = this.pause || this.reduit;
      if (!fige) {
        const dt = this.dernierInstant ? Math.min(2.5, (instant - this.dernierInstant) / 16.67) : 1;
        this.avancer(cam, this.bulles(), dt);
        // un appareil qui peine : on retire des fils plutôt que de saccader
        this.lent = instant - this.dernierInstant > 34 ? this.lent + 1 : Math.max(0, this.lent - 1);
        if (this.lent > 40 && this.n > 400) {
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
