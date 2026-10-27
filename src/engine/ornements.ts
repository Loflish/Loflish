import { FONDS } from '../lib/hd';
import { gaussian, hashString, pick, rng } from '../lib/random';

/**
 * Les ornements de Palerme, au-dessus de la peinture vivante de la constellation.
 *
 * Inspirés des églises de Palerme et de Monreale (photos de Tom, octobre 2026) :
 * - les frises d'étoiles à huit branches qui courent le long des murs, entre
 *   deux filets, peintes ici à l'or et à l'ivoire, un peu tremblées, comme à
 *   la main ; elles se cousent de haut en bas à leur apparition, puis un reflet
 *   doré les parcourt lentement, comme la lumière d'un cierge sur les tesselles ;
 * - des semis de tesselles d'or dans les taches (Byzance, et Klimt après elle),
 *   dont quelques-unes accrochent la lumière.
 *
 * Variante « klimt » (choisie par Tom le 21 octobre, les frises étant trop chargées) : plus aucune
 * frise, seulement une touche d'or à la manière de Klimt, posée DANS les taches colorées de la
 * peinture actuelle (repérées en lisant l'image du fond) : quelques carrés d'or, de fines spirales,
 * de petits cercles. Elle reste collée à la peinture et respire avec elle.
 *
 * Tout est peint une fois dans des toiles hors écran ; chaque image ne fait que
 * les poser et ajouter les reflets (une trentaine d'images par seconde suffit).
 * Les couleurs sont celles relevées sur les photos, pas des couleurs inventées.
 */

export const PALERME = {
  orVif: '#daa441',
  orProfond: '#98753b',
  ocre: '#d38618',
  roseBreche: '#a58476',
  vertAntique: '#546562',
  lapis: '#587288',
  cielMosaique: '#90b7df',
  ivoire: '#e2e3dc',
  brunRinceaux: '#251c14',
} as const;

export type VarianteOrnements = 'tout' | 'bandes' | 'or' | 'klimt';

/** Les ornements ne s'affichent que si l'adresse le demande (?klimt=1 ; archives : ?palerme=1, bandes, or), le temps de les juger. */
export function varianteOrnements(): VarianteOrnements | null {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search);
  if (q.get('klimt') === '1') return 'klimt';
  const v = q.get('palerme');
  if (v === 'bandes' || v === 'or') return v;
  if (v === '1' || v === 'tout') return 'tout';
  return null;
}

interface Cam {
  x: number;
  y: number;
  zoom: number;
}

interface Bande {
  /** position de départ, en pixels d'écran, avant le décalage de la caméra */
  x: number;
  /** largeur posée à l'écran (px CSS) ; la tuile peut être plus fine (pixels réels de l'écran) */
  largeur: number;
  /** pixels de la tuile par pixel d'écran */
  k: number;
  /** décalage du motif de fragments (chaque frise affleure à d'autres endroits) */
  graine: number;
  tuile: HTMLCanvasElement;
  /** hauteur d'un motif complet, en px CSS (la frise se répète au-delà) */
  periode: number;
  phase: number;
  vitesse: number;
}

interface Tessere {
  x: number;
  y: number;
  taille: number;
  angle: number;
  phase: number;
  vitesse: number;
}

interface Semis {
  x: number;
  y: number;
  image: HTMLCanvasElement;
  rayon: number;
  tesseres: Tessere[];
}

const LARGEUR_BANDE = 34;
const MARGE = 14;
/** une étoile, puis une rosette : la frise se répète toutes les deux cases */
const CASES_PAR_TUILE = 6;
const PARALLAXE_BANDES = 0.22;
const PARALLAXE_OR = 0.45;

/** Les frises peintes (Higgsfield, Seedream 4.5 en 4K, détourées et raccordées par design/hd/palerme/preparer.cjs). */
const FRISES_PEINTES = ['frise-or', 'frise-palatine', 'frise-marbres'];
/** largeur d'une frise peinte à l'écran, marges transparentes comprises (px CSS) */
const LARGEUR_PEINTE = 64;

function chargerFrises(): Promise<HTMLImageElement[]> {
  const base = `${import.meta.env.BASE_URL}hd/palerme/`;
  return Promise.all(
    FRISES_PEINTES.map(
      (n) =>
        new Promise<HTMLImageElement | null>((ok) => {
          const i = new Image();
          i.onload = () => ok(i);
          i.onerror = () => ok(null);
          i.src = `${base}${n}.webp`;
        }),
    ),
  ).then((l) => l.filter((i): i is HTMLImageElement => !!i));
}

/** Une frise peinte, mise à l'échelle de l'écran une fois pour toutes. */
function tuilePeinte(img: HTMLImageElement, dpr: number): { tuile: HTMLCanvasElement; periode: number; k: number } {
  const periode = (img.height * LARGEUR_PEINTE) / img.width;
  const t = toile(LARGEUR_PEINTE * dpr, periode * dpr);
  const x = t.getContext('2d')!;
  x.imageSmoothingQuality = 'high';
  x.drawImage(img, 0, 0, t.width, t.height);
  return { tuile: t, periode: t.height / dpr, k: dpr };
}

function toile(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

/** Un trait tremblé, comme posé au pinceau fin : la ligne est recoupée tous les 5 px et légèrement déviée. */
function trait(ctx: CanvasRenderingContext2D, pts: [number, number][], alea: () => number, ferme = false) {
  const tout = ferme ? [...pts, pts[0]!] : pts;
  ctx.beginPath();
  for (let i = 0; i < tout.length - 1; i++) {
    const [x1, y1] = tout[i]!;
    const [x2, y2] = tout[i + 1]!;
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / 5));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const x = x1 + (x2 - x1) * t + (alea() - 0.5) * 0.7;
      const y = y1 + (y2 - y1) * t + (alea() - 0.5) * 0.7;
      if (i === 0 && k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

function carre(cx: number, cy: number, r: number, angle: number): [number, number][] {
  return [0, 1, 2, 3].map((i) => {
    const a = angle + Math.PI / 4 + (i * Math.PI) / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
}

/**
 * Une tuile de frise, raccordable de haut en bas : un lavis ivoire et or aux bords irréguliers,
 * deux filets, puis des étoiles à huit branches (deux carrés croisés) et des rosettes, reliées
 * par un entrelacs, avec un point de couleur au cœur de chaque étoile.
 */
function peindreTuile(alea: () => number): { tuile: HTMLCanvasElement; periode: number } {
  const w = LARGEUR_BANDE;
  const cas = w;
  const periode = cas * CASES_PAR_TUILE;
  const t = toile(w + MARGE * 2, periode);
  const ctx = t.getContext('2d')!;
  const x0 = MARGE;

  // lavis : des voiles très légers, recopiés au-dessus et en dessous pour que la tuile se raccorde
  for (let i = 0; i < 26; i++) {
    const y = alea() * periode;
    const h = 20 + alea() * 70;
    const dx = (alea() - 0.5) * 7;
    const ww = w + (alea() - 0.3) * 10;
    ctx.fillStyle = alea() < 0.65 ? PALERME.ivoire : PALERME.orVif;
    ctx.globalAlpha = 0.025 + alea() * 0.03;
    for (const k of [-periode, 0, periode]) {
      ctx.beginPath();
      ctx.ellipse(x0 + w / 2 + dx, y + k, ww / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // les deux filets, de part et d'autre
  ctx.strokeStyle = PALERME.orProfond;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 1.1;
  trait(ctx, [[x0 + 1.5, -2], [x0 + 1.5, periode + 2]], alea);
  trait(ctx, [[x0 + w - 1.5, -2], [x0 + w - 1.5, periode + 2]], alea);

  const coeurs = [PALERME.vertAntique, PALERME.lapis, PALERME.roseBreche, PALERME.ocre, PALERME.cielMosaique];
  for (let i = 0; i < CASES_PAR_TUILE; i++) {
    const cx = x0 + w / 2;
    const cy = i * cas + cas / 2;
    if (i % 2 === 0) {
      const r = w * 0.31;
      // l'étoile : deux carrés croisés, à l'or, puis un point de couleur en son cœur
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = PALERME.orVif;
      ctx.lineWidth = 1.35;
      trait(ctx, carre(cx, cy, r, 0), alea, true);
      trait(ctx, carre(cx, cy, r, Math.PI / 4), alea, true);
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = coeurs[(i / 2) % coeurs.length]!;
      ctx.beginPath();
      ctx.arc(cx + (alea() - 0.5) * 0.6, cy + (alea() - 0.5) * 0.6, 2.1 + alea() * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // la rosette : un cercle et quatre pétales en vert antique
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = PALERME.vertAntique;
      for (let p = 0; p < 4; p++) {
        const a = (p * Math.PI) / 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * 4.2, cy + Math.sin(a) * 4.2, 3.4, 1.7, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = PALERME.orProfond;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    // l'entrelacs qui relie chaque motif au suivant
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = PALERME.orVif;
    ctx.lineWidth = 0.9;
    trait(ctx, [[cx - 2.2, cy + cas * 0.3], [cx + 2.2, cy + cas * 0.7]], alea);
    trait(ctx, [[cx + 2.2, cy + cas * 0.3], [cx - 2.2, cy + cas * 0.7]], alea);
  }

  // le grain du pigment, raccordé lui aussi
  for (let i = 0; i < 260; i++) {
    const x = x0 + alea() * w;
    const y = alea() * periode;
    ctx.globalAlpha = 0.05 + alea() * 0.1;
    ctx.fillStyle = alea() < 0.7 ? PALERME.orProfond : PALERME.brunRinceaux;
    for (const k of [-periode, 0, periode]) ctx.fillRect(x, y + k, 0.9, 0.9);
  }
  ctx.globalAlpha = 1;
  return { tuile: t, periode };
}

/** Un semis de tesselles d'or, rassemblées comme une tache : dense au centre, éparses au bord. */
function peindreSemis(alea: () => number, rayon: number): { image: HTMLCanvasElement; tesseres: Tessere[] } {
  const d = rayon * 2 + 20;
  const t = toile(d, d);
  const ctx = t.getContext('2d')!;
  const couleurs = [PALERME.orVif, PALERME.orVif, PALERME.orProfond, PALERME.ocre, PALERME.orVif, PALERME.ivoire, PALERME.lapis, PALERME.vertAntique];
  const tesseres: Tessere[] = [];
  const n = Math.round(rayon * 1.25);
  for (let i = 0; i < n; i++) {
    const x = d / 2 + gaussian(alea) * rayon * 0.42;
    const y = d / 2 + gaussian(alea) * rayon * 0.36;
    if (Math.hypot(x - d / 2, y - d / 2) > rayon) continue;
    const taille = 2 + alea() * 2.6;
    const angle = (alea() - 0.5) * 0.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.4 + alea() * 0.45;
    ctx.fillStyle = pick(alea, couleurs);
    ctx.fillRect(-taille / 2, -taille / 2, taille, taille);
    ctx.restore();
    if (alea() < 0.35) tesseres.push({ x: x - d / 2, y: y - d / 2, taille, angle, phase: alea() * Math.PI * 2, vitesse: 0.35 + alea() * 0.7 });
  }
  return { image: t, tesseres };
}

/**
 * Une touche de Klimt : des carrés d'or (quelques-uns de lapis ou de vert antique), une ou deux
 * spirales fines, de petits cercles au cœur doré. Clairsemé : l'or éclaire la tache, il ne la couvre pas.
 */
function peindreKlimt(alea: () => number, rayon: number): { image: HTMLCanvasElement; tesseres: Tessere[] } {
  const d = rayon * 2 + 24;
  const t = toile(d, d);
  const ctx = t.getContext('2d')!;
  const c = d / 2;
  const couleurs = [PALERME.orVif, PALERME.orVif, PALERME.orVif, PALERME.orProfond, PALERME.orProfond, PALERME.ocre, PALERME.ivoire, PALERME.lapis, PALERME.vertAntique];
  const tesseres: Tessere[] = [];
  const n = Math.round(rayon * 0.42);
  for (let i = 0; i < n; i++) {
    const x = c + gaussian(alea) * rayon * 0.4;
    const y = c + gaussian(alea) * rayon * 0.34;
    if (Math.hypot(x - c, y - c) > rayon) continue;
    const taille = 2.4 + alea() * 3.6;
    const angle = (alea() - 0.5) * 0.7;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.45 + alea() * 0.4;
    ctx.fillStyle = pick(alea, couleurs);
    ctx.fillRect(-taille / 2, -taille / 2, taille, taille);
    ctx.restore();
    if (alea() < 0.4) tesseres.push({ x: x - c, y: y - c, taille, angle, phase: alea() * Math.PI * 2, vitesse: 0.3 + alea() * 0.6 });
  }
  // une ou deux spirales, tracées d'un fil d'or un peu tremblé
  ctx.lineCap = 'round';
  const nbSpirales = alea() < 0.55 ? 1 : 2;
  for (let s = 0; s < nbSpirales; s++) {
    const sx = c + (alea() - 0.5) * rayon * 0.9;
    const sy = c + (alea() - 0.5) * rayon * 0.7;
    const rMax = 7 + alea() * 9;
    const tours = 2.5 + alea() * 1.5;
    const sens = alea() < 0.5 ? 1 : -1;
    ctx.globalAlpha = 0.5 + alea() * 0.25;
    ctx.strokeStyle = alea() < 0.6 ? PALERME.orProfond : PALERME.orVif;
    ctx.lineWidth = 0.9 + alea() * 0.4;
    ctx.beginPath();
    const pas = Math.round(70 * tours);
    for (let k = 0; k <= pas; k++) {
      const th = (k / pas) * tours * Math.PI * 2;
      const r = (k / pas) * rMax;
      const x = sx + Math.cos(th * sens) * r + (alea() - 0.5) * 0.3;
      const y = sy + Math.sin(th * sens) * r + (alea() - 0.5) * 0.3;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // de petits cercles au cœur doré, comme les « yeux » des robes de Klimt
  const nbCercles = 2 + Math.floor(alea() * 3);
  for (let i = 0; i < nbCercles; i++) {
    const x = c + gaussian(alea) * rayon * 0.42;
    const y = c + gaussian(alea) * rayon * 0.36;
    const r = 2.6 + alea() * 2.6;
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = PALERME.orProfond;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = PALERME.orVif;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return { image: t, tesseres };
}

/**
 * Les zones les plus colorées de la peinture du fond, en coordonnées de la toile des ornements
 * (même cadrage que l'image : object-fit cover). Le haut (logo) et le bas (dock) sont évités.
 */
function zonesColorees(img: HTMLImageElement, w: number, h: number, nb: number, ecart: number): { x: number; y: number }[] {
  const cw = 120;
  const ch = Math.max(1, Math.round((cw * h) / w));
  const t = toile(cw, ch);
  const ctx = t.getContext('2d', { willReadFrequently: true })!;
  const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  ctx.drawImage(img, (cw - img.naturalWidth * s) / 2, (ch - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
  const d = ctx.getImageData(0, 0, cw, ch).data;
  const cands: { x: number; y: number; v: number }[] = [];
  for (let y = 1; y < ch - 1; y++)
    for (let x = 1; x < cw - 1; x++) {
      const yy = y / ch;
      if (yy < 0.16 || yy > 0.84 || (x / cw < 0.32 && yy < 0.24)) continue;
      const i = (y * cw + x) * 4;
      const mx = Math.max(d[i]!, d[i + 1]!, d[i + 2]!);
      const mn = Math.min(d[i]!, d[i + 1]!, d[i + 2]!);
      cands.push({ x: (x / cw) * w, y: yy * h, v: mx ? (mx - mn) / mx : 0 });
    }
  cands.sort((a, b) => b.v - a.v);
  const choisis: { x: number; y: number }[] = [];
  for (const p of cands) {
    if (choisis.length >= nb) break;
    if (choisis.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > ecart)) choisis.push(p);
  }
  return choisis;
}

export class Ornements {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private bandes: Bande[] = [];
  private semis: Semis[] = [];
  private espacement = 0;
  private mondeW = 0;
  private mondeH = 0;
  private raf = 0;
  private dernier = 0;
  private temps = 0;
  /** l'apparition : les frises se cousent de haut en bas (0 → 1) */
  private couture = 0;
  private actif = true;
  private enPause = false;
  private reduit = false;
  private peintes: HTMLImageElement[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private variante: VarianteOrnements,
    private camera: () => Cam | undefined,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    // les frises peintes remplacent les frises dessinées dès qu'elles sont là (sinon, le dessin reste)
    if (variante !== 'or')
      void chargerFrises().then((l) => {
        if (!l.length) return;
        this.peintes = l;
        this.resize();
      });
  }

  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    // en Klimt, la toile a le cadre exact de la peinture (débord de 4 %) et respire avec elle (CSS)
    this.w = this.variante === 'klimt' ? this.canvas.offsetWidth || window.innerWidth : window.innerWidth;
    this.h = this.variante === 'klimt' ? this.canvas.offsetHeight || window.innerHeight : window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    const alea = rng(hashString('palerme-monreale'));
    // les frises : une tous les 30 à 45 % de la largeur, comme les bandes des murs de Monreale
    this.espacement = Math.max(260, this.w * (this.w < 700 ? 0.62 : 0.36));
    const n = Math.ceil((this.w + LARGEUR_BANDE * 4) / this.espacement) + 1;
    this.bandes = [];
    if (this.variante !== 'or' && this.variante !== 'klimt') {
      for (let i = 0; i < n; i++) {
        const peinte = this.peintes.length ? this.peintes[i % this.peintes.length]! : null;
        const { tuile, periode, k } = peinte ? tuilePeinte(peinte, this.dpr) : { ...peindreTuile(rng(hashString(`frise-${i}`))), k: 1 };
        const largeur = tuile.width / k;
        this.bandes.push({ x: i * this.espacement + this.espacement * 0.18, largeur, k, graine: alea() * 100, tuile, periode, phase: alea(), vitesse: 1 / (11 + alea() * 7) });
      }
    }
    // les semis d'or, posés dans un monde un peu plus grand que l'écran, qui se répète
    this.mondeW = this.w * 1.7;
    this.mondeH = this.h * 1.7;
    this.semis = [];
    if (this.variante === 'klimt') {
      this.posersKlimt();
    } else if (this.variante !== 'bandes') {
      const nb = this.w < 700 ? 4 : 7;
      for (let i = 0; i < nb; i++) {
        const rayon = (this.w < 700 ? 55 : 75) + alea() * 70;
        const { image, tesseres } = peindreSemis(rng(hashString(`semis-${i}`)), rayon);
        this.semis.push({ x: alea() * this.mondeW, y: alea() * this.mondeH, image, rayon, tesseres });
      }
    }
    this.dessiner();
  }

  private fondLu: HTMLImageElement | null = null;

  /** La touche de Klimt : quelques semis d'or, chacun dans une des taches les plus colorées de la peinture. */
  private posersKlimt(): void {
    const poser = (img: HTMLImageElement | null) => {
      const nb = this.w < 700 ? 3 : 5;
      const alea = rng(hashString('klimt'));
      const zones = img ? zonesColorees(img, this.w, this.h, nb, Math.min(this.w, this.h) * 0.3) : [];
      while (zones.length < nb) zones.push({ x: (0.2 + alea() * 0.6) * this.w, y: (0.25 + alea() * 0.5) * this.h });
      this.semis = zones.map((z, i) => {
        const rayon = (this.w < 700 ? 34 : 46) + alea() * 26;
        const { image, tesseres } = peindreKlimt(rng(hashString(`klimt-${i}`)), rayon);
        return { x: z.x, y: z.y, image, rayon, tesseres };
      });
      this.dessiner();
    };
    if (this.fondLu) return poser(this.fondLu);
    const img = new Image();
    img.onload = () => {
      this.fondLu = img;
      poser(img);
    };
    img.onerror = () => poser(null);
    img.src = window.matchMedia('(max-aspect-ratio: 3/4)').matches ? FONDS.explorer.haut : FONDS.explorer.large;
  }

  /** Visible seulement dans la constellation ; ailleurs, plus rien ne tourne. */
  setActif(v: boolean): void {
    this.actif = v;
  }

  setPause(v: boolean): void {
    this.enPause = v;
    if (v) this.dessiner();
  }

  setReduit(v: boolean): void {
    this.reduit = v;
  }

  start(): void {
    const boucle = (now: number) => {
      this.raf = requestAnimationFrame(boucle);
      if (!this.actif || document.hidden) return;
      if (now - this.dernier < 33) return;
      const dt = Math.min(0.1, (now - (this.dernier || now)) / 1000);
      this.dernier = now;
      if (this.enPause) return;
      this.temps += this.reduit ? 0 : dt;
      this.couture = Math.min(1, this.couture + dt / 3.6);
      this.dessiner();
    };
    this.raf = requestAnimationFrame(boucle);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
  }

  private dessiner(): void {
    const ctx = this.ctx;
    const cam = this.camera() ?? { x: 0, y: 0, zoom: 1 };
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    this.dessinerSemis(ctx, cam);
    this.dessinerBandes(ctx, cam);
    // les ornements s'effacent en haut (autour du logo) et en bas (le dock)
    ctx.globalCompositeOperation = 'destination-in';
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.14, 'rgba(0,0,0,1)');
    g.addColorStop(0.84, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'source-over';
  }

  private dessinerBandes(ctx: CanvasRenderingContext2D, cam: Cam): void {
    if (!this.bandes.length) return;
    const total = this.bandes.length * this.espacement;
    const decalX = -cam.x * cam.zoom * PARALLAXE_BANDES;
    const decalY = -cam.y * cam.zoom * PARALLAXE_BANDES;
    for (const b of this.bandes) {
      const largeur = b.largeur;
      const x = ((((b.x + decalX) % total) + total) % total) - largeur;
      if (x > this.w || x + largeur < 0) continue;
      // la frise se coud de haut en bas, puis reste
      const hauteurVisible = this.h * easeOut(this.couture);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, 0, largeur, hauteurVisible);
      ctx.clip();
      // la frise est posée par tranches de 6 px, chacune à sa propre intensité : elle affleure par
      // endroits, s'efface ailleurs, et ces fragments glissent très lentement
      const y0 = ((decalY % b.periode) + b.periode) % b.periode - b.periode;
      const TR = 6;
      for (let y = 0; y < hauteurVisible; y += TR) {
        const a = fragment((y - decalY) / 230 + b.graine + this.temps * 0.012);
        if (a < 0.02) continue;
        ctx.globalAlpha = 0.85 * a;
        const ySrc = ((((y - y0) % b.periode) + b.periode) % b.periode);
        const hTr = Math.min(TR, b.periode - ySrc);
        ctx.drawImage(b.tuile, 0, ySrc * b.k, b.tuile.width, hTr * b.k, x, y, largeur, hTr);
        if (hTr < TR) ctx.drawImage(b.tuile, 0, 0, b.tuile.width, (TR - hTr) * b.k, x, y + hTr, largeur, TR - hTr);
      }
      // le reflet : une lumière dorée qui descend lentement le long de la frise
      if (!this.reduit) {
        const p = (this.temps * b.vitesse + b.phase) % 1;
        const yr = -this.h * 0.3 + p * this.h * 1.6;
        const g = ctx.createLinearGradient(0, yr - 140, 0, yr + 140);
        g.addColorStop(0, 'rgba(255, 236, 190, 0)');
        g.addColorStop(0.5, 'rgba(255, 236, 190, 0.85)');
        g.addColorStop(1, 'rgba(255, 236, 190, 0)');
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = g;
        ctx.fillRect(x, yr - 140, largeur, 280);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
      // l'aiguille : un point de lumière là où la frise est en train de se coudre
      if (this.couture < 1) {
        ctx.globalAlpha = 0.9 * (1 - this.couture);
        const r = ctx.createRadialGradient(x + largeur / 2, hauteurVisible, 0, x + largeur / 2, hauteurVisible, 16);
        r.addColorStop(0, 'rgba(255, 240, 205, 0.9)');
        r.addColorStop(1, 'rgba(255, 240, 205, 0)');
        ctx.fillStyle = r;
        ctx.fillRect(x + largeur / 2 - 16, hauteurVisible - 16, 32, 32);
        ctx.globalAlpha = 1;
      }
    }
  }

  private dessinerSemis(ctx: CanvasRenderingContext2D, cam: Cam): void {
    if (!this.semis.length) return;
    const colle = this.variante === 'klimt';
    const dx = colle ? 0 : -cam.x * cam.zoom * PARALLAXE_OR;
    const dy = colle ? 0 : -cam.y * cam.zoom * PARALLAXE_OR;
    for (const s of this.semis) {
      // collés à la peinture (Klimt), ou dans un monde qui glisse un peu avec la caméra (Palerme)
      const x = colle ? s.x - s.image.width / 2 : ((((s.x + dx) % this.mondeW) + this.mondeW) % this.mondeW) - s.rayon * 1.5;
      const y = colle ? s.y - s.image.height / 2 : ((((s.y + dy) % this.mondeH) + this.mondeH) % this.mondeH) - s.rayon * 1.5;
      if (x > this.w + 20 || y > this.h + 20 || x + s.image.width < -20 || y + s.image.height < -20) continue;
      ctx.globalAlpha = 0.85 * easeOut(this.couture);
      ctx.drawImage(s.image, x, y);
      if (this.reduit) continue;
      // quelques tesselles accrochent la lumière, chacune à son rythme
      ctx.globalCompositeOperation = 'lighter';
      const cx = x + s.image.width / 2;
      const cy = y + s.image.height / 2;
      for (const t of s.tesseres) {
        const eclat = Math.pow(Math.max(0, Math.sin(this.temps * t.vitesse + t.phase)), 14);
        if (eclat < 0.04) continue;
        ctx.globalAlpha = eclat * 0.75;
        ctx.fillStyle = '#fff0c8';
        ctx.save();
        ctx.translate(cx + t.x, cy + t.y);
        ctx.rotate(t.angle);
        ctx.fillRect(-t.taille / 2, -t.taille / 2, t.taille, t.taille);
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }
}

/** Un bruit doux à une dimension (0 → 1), seuillé : de longs fragments visibles, séparés par des vides. */
function fragment(v: number): number {
  const i = Math.floor(v);
  const f = v - i;
  const h = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const s = f * f * (3 - 2 * f);
  const n = h(i) * (1 - s) + h(i + 1) * s;
  const t = Math.min(1, Math.max(0, (n - 0.32) / 0.3));
  return t * t * (3 - 2 * t);
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
}
