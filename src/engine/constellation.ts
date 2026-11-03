import { drift, gaussian, hashString, rng } from '../lib/random';
import { bubbleSprite, provisionalSprite, SPRITE_DIAMETER, type Toile } from './bubbleSprite';
import { Peintre } from './peintre';

/**
 * Constellation de présences.
 *
 * Chaque bulle se promène comme une personne : elle avance, ralentit,
 * change progressivement de direction, fait une courbe, s'arrête presque,
 * repart. Pas d'orbite, pas de va-et-vient, pas de rebond : l'espace est
 * un tore sans bords. Quand deux bulles vont se croiser, elles infléchissent
 * doucement leur trajectoire, comme deux passants.
 *
 * Toutes les bulles ont exactement la même taille.
 */

export interface Presence {
  id: string;
  nom: string;
  hex: string;
  matiere?: number;
}

export type Mode = 'explore' | 'perdre' | 'trace' | 'creer' | 'texte' | 'minimal';

interface ModeSpec {
  alpha: number;
  speed: number;
  interactive: boolean;
}

export const MODES: Record<Mode, ModeSpec> = {
  explore: { alpha: 1, speed: 1, interactive: true },
  // hors de la constellation, les pages reposent sur le papier seul : plus aucune bulle derrière
  perdre: { alpha: 0, speed: 0.6, interactive: false },
  trace: { alpha: 0, speed: 0.4, interactive: false },
  creer: { alpha: 0, speed: 0.35, interactive: false },
  texte: { alpha: 0, speed: 0.5, interactive: false },
  minimal: { alpha: 0, speed: 0, interactive: false },
};

interface Bubble {
  p: Presence;
  x: number;
  y: number;
  th: number;
  v: number;
  pref: number;
  prefTimer: number;
  /** tempérament : certains marchent vite, d'autres flânent */
  temper: number;
  /** attention portée aux autres lors des croisements */
  heed: number;
  sa: number;
  sb: number;
  slow: number;
  scale: number;
  targetScale: number;
  breath: number;
  breathSpeed: number;
  alpha: number;
  sprite: Toile | ImageBitmap | null;
  /** le banc de la bulle (essai `?bancs=1`) */
  foyer?: number;
  /** la compression au contact (essai `?toucher=1`) : force 0 à 1, et l'angle de la rencontre */
  sq?: number;
  sqA?: number;
}

interface Cam {
  x: number;
  y: number;
  zoom: number;
}

export interface EngineEvents {
  onHover?: (id: string | null) => void;
  onSelect?: (id: string | null) => void;
  onFrame?: () => void;
  onMoved?: () => void;
  /** un second clic (ou une seconde touche) sur la bulle déjà ouverte : on entre dans sa mémoire */
  onEnter?: (id: string) => void;
}

const TAU = Math.PI * 2;
const angleDiff = (a: number, b: number) => {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Les bulles mises en beauté telles qu'elles sont (Tom, 26 octobre : « plus visibles », sans effet autour, jamais
 * noircies) : leurs propres couleurs, un peu plus lumineuses et plus franches, une seule fois quand la bulle est
 * peinte. Le dessin de la bulle ne change pas. `?eclat=0` les montre telles quelles, pour comparer.
 */
const ECLAT = typeof window === 'undefined' || new URLSearchParams(window.location.search).get('eclat') !== '0';
/** Essai du 30 octobre, `?bancs=1` : des bancs lâches portés par un courant commun, pour que le feutre respire entre eux. */
const BANCS = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('bancs') === '1';
/**
 * Essai du 3 novembre, `?toucher=1` (cahier §54.4 et §54.6) : au contact, une bulle se comprime à peine dans le sens
 * de la rencontre puis reprend sa forme ; et les bulles proches du curseur s'écartent d'un rien, « presque douteux ».
 */
const TOUCHER = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('toucher') === '1';
function embellir(sprite: Toile): Toile {
  if (!ECLAT) return sprite;
  const c = document.createElement('canvas');
  c.width = sprite.width;
  c.height = sprite.height;
  const x = c.getContext('2d');
  if (!x) return sprite;
  // mesuré sur 30 bulles : couleur +20 % environ, clarté +6 % (au-delà, elles s'éloignent des couleurs choisies)
  x.filter = 'saturate(1.12) brightness(1.06) contrast(1.02)';
  x.drawImage(sprite, 0, 0);
  return c;
}

export class Constellation {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private bubbles: Bubble[] = [];
  /** l'édition des archives affichée (null : le musée d'aujourd'hui) */
  edition: string | null = null;
  private byId = new Map<string, Bubble>();
  private worldW = 2000;
  private worldH = 1400;
  /** Diamètre d'une bulle à zoom 1, en px CSS. */
  private D = 30;
  cam: Cam = { x: 0, y: 0, zoom: 1 };
  private camVel = { x: 0, y: 0 };
  private keyVel = { x: 0, y: 0 };
  private keys = new Set<string>();
  private camAnim: { from: Cam; to: Cam; t0: number; dur: number; done?: () => void } | null = null;
  private savedCam: Cam | null = null;
  private defaultZoom = 1;
  private minZoom = 0.6;
  // on s'approche assez pour lire une bulle, jamais au point de la voir pixelisée
  private maxZoom = 2.2;
  /** Résolution des bulles : plus fine sur les écrans denses d'ordinateur, pour rester nettes de près. */
  private spriteSize = 160;
  private time = 0;
  private last = 0;
  private raf = 0;
  private modeAlpha = 1;
  private modeSpeed = 1;
  private mode: Mode = 'explore';
  private reduced = false;
  private enPause = false;
  private match: Set<string> | null = null;
  hoverId: string | null = null;
  selectedId: string | null = null;
  private enteringId: string | null = null;
  keyboardFocus = false;
  focusId: string | null = null;
  private pointer = { x: -9999, y: -9999, inside: false };
  nearIds: string[] = [];
  private drag: { id: number; x: number; y: number; sx: number; sy: number; t: number; moved: boolean } | null = null;
  private pinch: { d: number; zoom: number } | null = null;
  private touches = new Map<number, { x: number; y: number }>();
  private grid = new Map<number, Bubble[]>();
  private cell = 80;
  private cols = 1;
  private rows = 1;
  private spriteQueue: Bubble[] = [];
  /** chantier 6 : les sprites se peignent dans un travailleur quand c'est possible ; la constellation les reçoit prêts */
  readonly peintre = new Peintre((s) => {
    const b = this.byId.get(s.id);
    // une réponse d'avant un changement de taille ou de matière ne compte plus
    if (!b || s.size !== this.spriteSize || s.matiere !== b.p.matiere) return void s.image.close();
    b.sprite = s.image;
  });
  events: EngineEvents = {};
  /** Attend les matières HD avant de peindre les bulles (repli procédural sinon). */
  spritesAllowed = true;
  /** Zones calmes à l'écran (logo…) : les bulles s'y effacent doucement. */
  private calmZones: { x: number; y: number; w: number; h: number }[] = [];
  private foyers: { x: number; y: number; ph: number }[] = [];
  private rayonBanc = 0;
  /** le dernier clic sur une bulle : deux clics rapprochés sur la même ouvrent sa mémoire */
  private dernierClic: { id: string; t: number } | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    presences: Presence[],
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponible');
    this.ctx = ctx;
    this.resize();
    this.setPresences(presences);
    this.bind();
  }

  // ————————————————————————————————— population

  /** la liste et la classe d'écran (téléphone, moyen, grand) avec lesquelles le monde a été dimensionné */
  private liste: Presence[] = [];
  private classe = -1;
  private static classeEcran(): number {
    return window.innerWidth < 700 ? 0 : window.innerWidth < 1100 ? 1 : 2;
  }

  setPresences(list: Presence[]): void {
    this.liste = list;
    this.classe = Constellation.classeEcran();
    const small = window.innerWidth < 700;
    const medium = window.innerWidth < 1100;
    // Sur mobile, moins de bulles simultanées : espace, lisibilité, performances.
    const count = Math.min(list.length, small ? 150 : medium ? 260 : 380);
    // un peu plus grandes qu'avant (34 et 38) : plus visibles sur la peinture (Tom, 26 octobre)
    this.D = small ? 37 : 42;
    // un espace d'environ deux écrans sur deux : on s'y promène tranquillement, sans s'y perdre
    const spacing = small ? 108 : 128;
    this.spriteSize = !small && (window.devicePixelRatio || 1) >= 1.5 ? 208 : 160;
    const area = count * spacing * spacing;
    const aspect = this.w / Math.max(1, this.h);
    this.worldW = Math.max(Math.sqrt(area * aspect), this.w * 1.35);
    this.worldH = Math.max(area / this.worldW, this.h * 1.35);
    this.minZoom = Math.max(this.w / (this.worldW * 0.92), this.h / (this.worldH * 0.92));
    this.defaultZoom = Math.max(this.minZoom * 1.05, small ? 0.95 : 0.9);
    this.cam.zoom = this.defaultZoom;

    const r = rng(7);
    const keep = new Map(this.bubbles.map((b) => [b.p.id, b]));
    this.bubbles = list.slice(0, count).map((p) => {
      const old = keep.get(p.id);
      if (old) return old;
      const rr = rng(hashString(p.id));
      const b: Bubble = {
        p,
        x: r() * this.worldW,
        y: r() * this.worldH,
        th: rr() * TAU,
        v: 4 + rr() * 8,
        pref: rr() * TAU,
        prefTimer: 2 + rr() * 10,
        temper: 0.6 + rr() * 0.9,
        heed: 0.25 + rr() * 0.75,
        sa: rr() * 1000,
        sb: rr() * 1000,
        slow: 1,
        scale: 1,
        targetScale: 1,
        breath: rr() * TAU,
        breathSpeed: TAU / (7 + rr() * 6),
        alpha: 1,
        // visible dès la première image ; la vraie matière la remplace ensuite
        sprite: provisionalSprite(p.hex),
      };
      return b;
    });
    if (BANCS) this.formerBancs(r, keep);
    this.byId = new Map(this.bubbles.map((b) => [b.p.id, b]));
    this.spriteQueue = this.visiblesDabord(this.bubbles);
    this.cell = this.D * 2.8;
    this.cols = Math.max(1, Math.floor(this.worldW / this.cell));
    this.rows = Math.max(1, Math.floor(this.worldH / this.cell));
  }

  /** Neuf foyers semés au nombre d'or ; chaque nouvelle bulle naît autour du sien, en nuage lâche. */
  private formerBancs(r: () => number, keep: Map<string, Bubble>): void {
    const nb = 9;
    this.foyers = Array.from({ length: nb }, (_, i) => ({ x: ((i * 0.618034) % 1) * this.worldW, y: ((i * 0.381966 + 0.13) % 1) * this.worldH, ph: i * 2.4 }));
    this.rayonBanc = Math.min(this.worldW, this.worldH) * 0.2;
    for (const b of this.bubbles) {
      if (keep.has(b.p.id)) continue;
      b.foyer = hashString(b.p.id) % nb;
      const f = this.foyers[b.foyer]!;
      const a = r() * TAU;
      const d = Math.sqrt(-2 * Math.log(Math.max(1e-4, r()))) * this.rayonBanc;
      b.x = (f.x + Math.cos(a) * d + this.worldW) % this.worldW;
      b.y = (f.y + Math.sin(a) * d + this.worldH) % this.worldH;
    }
  }

  /**
   * Regénère toutes les bulles (ex. quand les matières HD sont chargées). Chaque
   * bulle garde son image actuelle jusqu'à ce que la nouvelle soit prête : aucune
   * ne disparaît, et celles qui sont à l'écran passent en premier.
   */
  resetSprites(): void {
    this.spriteQueue = this.visiblesDabord(this.bubbles);
  }

  /** Ordre de génération : les bulles les plus proches du centre de la vue d'abord. */
  private visiblesDabord(list: Bubble[]): Bubble[] {
    const d = (b: Bubble) => Math.hypot(this.wrapD(b.x - this.cam.x, this.worldW), this.wrapD(b.y - this.cam.y, this.worldH));
    return list
      .map((b) => [d(b), b] as const)
      .sort((a, b) => a[0] - b[0])
      .map(([, b]) => b);
  }

  /** Ajoute une nouvelle présence : elle apparaît fondue dans le décor puis devient comme les autres. */
  addPresence(p: Presence): void {
    if (this.byId.has(p.id)) return;
    const rr = rng(hashString(p.id));
    const b: Bubble = {
      p,
      x: this.cam.x + gaussian(rr) * 60,
      y: this.cam.y + gaussian(rr) * 60,
      th: rr() * TAU,
      v: 2,
      pref: rr() * TAU,
      prefTimer: 10,
      temper: 1,
      heed: 0.6,
      sa: rr() * 1000,
      sb: rr() * 1000,
      slow: 1,
      scale: 1,
      targetScale: 1,
      breath: 0,
      breathSpeed: TAU / 9,
      alpha: 0,
      sprite: provisionalSprite(p.hex),
    };
    this.bubbles.unshift(b);
    this.byId.set(p.id, b);
    this.spriteQueue.unshift(b);
  }

  // ————————————————————————————————— réglages

  setMode(mode: Mode): void {
    this.mode = mode;
    if (!MODES[mode].interactive) {
      this.setHover(null);
      this.nearIds = [];
    }
    if (mode !== 'explore' && this.enteringId) {
      // la bulle d'où l'on est entré reprend sa taille : toutes les bulles restent égales
      const b = this.byId.get(this.enteringId);
      if (b) b.targetScale = 1;
      this.enteringId = null;
    }
  }

  setReducedMotion(v: boolean): void {
    this.reduced = v;
  }

  /** Le bouton « pause » du visiteur : plus de dérive ni de respiration ; glisser et zoomer restent possibles. */
  setPause(v: boolean): void {
    this.enPause = v;
  }

  setCalmZones(z: { x: number; y: number; w: number; h: number }[]): void {
    this.calmZones = z;
  }

  private calmFactor(x: number, y: number): number {
    let f = 1;
    for (const z of this.calmZones) {
      const dx = Math.max(z.x - x, 0, x - (z.x + z.w));
      const dy = Math.max(z.y - y, 0, y - (z.y + z.h));
      const d = Math.hypot(dx, dy);
      f = Math.min(f, 0.08 + 0.92 * Math.min(1, d / 70));
    }
    return f;
  }

  private own = new Set<string>();
  setOwn(ids: Set<string>): void {
    this.own = ids;
  }

  setMatch(ids: Set<string> | null): void {
    this.match = ids;
  }

  /** Le visiteur s'est éloigné du point de départ (zoom ou promenade) : « Revenir au centre » a un sens. */
  get isMoved(): boolean {
    return Math.abs(this.cam.zoom - this.defaultZoom) > 0.05 || Math.hypot(this.wrapD(this.cam.x, this.worldW), this.wrapD(this.cam.y, this.worldH)) > 160;
  }

  /** Une présence au hasard parmi celles qui sont dans la constellation (pour « Une bulle au hasard »). */
  auHasard(sauf: string | null = null): string | null {
    const choix = this.bubbles.filter((b) => b.p.id !== sauf);
    return choix.length ? choix[Math.floor(Math.random() * choix.length)]!.p.id : null;
  }

  // ————————————————————————————————— caméra

  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    if (!this.bubbles.length) return;
    // l'écran change de classe (fenêtre agrandie, téléphone tourné, écran partagé) : le monde est redimensionné,
    // chaque bulle garde sa place ; sinon, dans un monde taillé pour un téléphone, un grand écran forcerait un zoom énorme
    if (this.classe !== Constellation.classeEcran()) {
      this.setPresences(this.liste);
      return;
    }
    this.minZoom = Math.max(this.w / (this.worldW * 0.92), this.h / (this.worldH * 0.92));
    this.cam.zoom = Math.max(this.cam.zoom, this.minZoom);
  }

  private animateCam(to: Partial<Cam>, dur: number, done?: () => void): void {
    const target: Cam = { ...this.cam, ...to };
    if (dur <= 0) {
      this.cam = target;
      done?.();
      return;
    }
    // chemin le plus court sur le tore
    const from = { ...this.cam };
    target.x = from.x + this.wrapD(target.x - from.x, this.worldW);
    target.y = from.y + this.wrapD(target.y - from.y, this.worldH);
    this.camAnim = { from, to: target, t0: performance.now(), dur, done };
  }

  /** Revenir au point de départ : le centre de la constellation, au zoom d'origine. */
  resetView(): void {
    this.animateCam({ x: 0, y: 0, zoom: this.defaultZoom }, 1400);
  }

  /** Entrer dans la mémoire d'une personne : la bulle devient le point de départ de la transition. */
  enter(id: string): Promise<void> {
    const b = this.byId.get(id);
    return new Promise((resolve) => {
      if (!b) return resolve();
      this.savedCam = { ...this.cam };
      this.enteringId = id;
      this.selectedId = id;
      b.targetScale = 1.5;
      this.animateCam({ x: b.x, y: b.y, zoom: Math.min(this.maxZoom, this.cam.zoom * 1.6) }, 1300);
      window.setTimeout(resolve, 950);
    });
  }

  /** Retour au musée : même endroit, même zoom, même contexte. */
  restore(): void {
    if (this.enteringId) {
      const b = this.byId.get(this.enteringId);
      if (b) b.targetScale = 1;
      this.enteringId = null;
    }
    this.selectedId = null;
    if (this.savedCam) {
      this.animateCam(this.savedCam, 1100);
      this.savedCam = null;
    }
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  focusOn(id: string): void {
    const b = this.byId.get(id);
    if (!b) return;
    this.animateCam({ x: b.x, y: b.y, zoom: Math.max(this.cam.zoom, 1.25) }, 1200, () => this.select(id));
  }

  // ————————————————————————————————— sélection

  select(id: string | null): void {
    if (this.selectedId && this.selectedId !== id) {
      const prev = this.byId.get(this.selectedId);
      if (prev) prev.targetScale = 1;
    }
    this.selectedId = id;
    if (id) {
      const b = this.byId.get(id);
      if (b) b.targetScale = 1.14;
    }
    this.events.onSelect?.(id);
  }

  /**
   * Montrer une bulle sans l'ouvrir (l'entrée du musée) : elle s'arrête et grandit un peu. Ni fiche ni nom
   * (Tom, 26 octobre : pas de nom pendant la dernière phrase), rien à fermer.
   */
  montrer(id: string | null): void {
    const avant = this.montreeId ? this.byId.get(this.montreeId) : undefined;
    if (avant && avant.p.id !== this.selectedId) avant.targetScale = 1;
    this.montreeId = id;
    const b = id ? this.byId.get(id) : undefined;
    if (b) b.targetScale = 1.14;
  }
  private montreeId: string | null = null;

  private setHover(id: string | null): void {
    if (id === this.hoverId) return;
    this.hoverId = id;
    this.canvas.style.cursor = id ? 'pointer' : this.drag ? 'grabbing' : 'grab';
    this.events.onHover?.(id);
  }

  screenPos(id: string): { x: number; y: number; r: number } | null {
    const b = this.byId.get(id);
    if (!b) return null;
    const x = this.wrapD(b.x - this.cam.x, this.worldW) * this.cam.zoom + this.w / 2;
    const y = this.wrapD(b.y - this.cam.y, this.worldH) * this.cam.zoom + this.h / 2;
    return { x, y, r: (this.D * this.cam.zoom * b.scale) / 2 };
  }

  presence(id: string): Presence | undefined {
    return this.byId.get(id)?.p;
  }

  /** La bulle sous le pointeur : on ne regarde que les cases de la grille autour de lui, pas les 380 bulles. */
  private hit(sx: number, sy: number): Bubble | null {
    let best: Bubble | null = null;
    let bestD = Infinity;
    const rad = (this.D * this.cam.zoom) / 2 + 6;
    const wx = this.cam.x + (sx - this.w / 2) / this.cam.zoom;
    const wy = this.cam.y + (sy - this.h / 2) / this.cam.zoom;
    const gx = Math.floor((((wx % this.worldW) + this.worldW) % this.worldW) / this.cell);
    const gy = Math.floor((((wy % this.worldH) + this.worldH) % this.worldH) / this.cell);
    const voir = (b: Bubble) => {
      if (b.alpha < 0.3) return;
      const x = this.wrapD(b.x - this.cam.x, this.worldW) * this.cam.zoom + this.w / 2;
      const y = this.wrapD(b.y - this.cam.y, this.worldH) * this.cam.zoom + this.h / 2;
      const d = Math.hypot(x - sx, y - sy);
      if (d < rad && d < bestD) {
        best = b;
        bestD = d;
      }
    };
    if (!this.grid.size) {
      this.bubbles.forEach(voir);
      return best;
    }
    for (let oy = -1; oy <= 1; oy++)
      for (let ox = -1; ox <= 1; ox++) this.grid.get(((gy + oy + this.rows) % this.rows) * this.cols + ((gx + ox + this.cols) % this.cols))?.forEach(voir);
    return best;
  }

  // ————————————————————————————————— entrées

  private onLeave = () => {
    this.pointer.inside = false;
    if (!this.drag) this.setHover(null);
    this.nearIds = [];
  };
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private onFocus = () => {
    // l'anneau de focus n'apparaît qu'à la navigation clavier
    this.keyboardFocus = this.canvas.matches(':focus-visible');
  };
  private onBlur = () => {
    this.keyboardFocus = false;
    this.keys.clear();
  };

  private bind(): void {
    const c = this.canvas;
    c.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    c.addEventListener('pointerleave', this.onLeave);
    c.addEventListener('wheel', this.onWheel, { passive: false });
    c.addEventListener('keydown', this.onKey);
    c.addEventListener('keyup', this.onKeyUp);
    c.addEventListener('focus', this.onFocus);
    c.addEventListener('blur', this.onBlur);
  }

  private get interactive(): boolean {
    return MODES[this.mode].interactive && !this.enteringId;
  }

  private onDown = (e: PointerEvent) => {
    if (!this.interactive) return;
    this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.touches.size === 2) {
      const [a, b] = [...this.touches.values()];
      this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.cam.zoom };
      this.drag = null;
      return;
    }
    this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false };
    this.camVel = { x: 0, y: 0 };
    this.camAnim = null;
    this.canvas.setPointerCapture?.(e.pointerId);
  };

  private onMove = (e: PointerEvent) => {
    if (this.touches.has(e.pointerId)) this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pinch && this.touches.size === 2) {
      const [a, b] = [...this.touches.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      this.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (this.pinch.zoom * d) / this.pinch.d);
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    this.pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top, inside: e.target === this.canvas };
    if (!this.interactive) return;
    if (this.drag && this.drag.id === e.pointerId) {
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      if (Math.hypot(e.clientX - this.drag.sx, e.clientY - this.drag.sy) > 6) {
        this.drag.moved = true;
        this.canvas.style.cursor = 'grabbing';
        this.events.onMoved?.();
      }
      this.cam.x -= dx / this.cam.zoom;
      this.cam.y -= dy / this.cam.zoom;
      this.camVel = { x: (-dx / this.cam.zoom) * 60, y: (-dy / this.cam.zoom) * 60 };
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
      return;
    }
    if (e.pointerType === 'mouse' && this.pointer.inside) {
      const b = this.hit(this.pointer.x, this.pointer.y);
      this.setHover(b ? b.p.id : null);
    }
  };

  private onUp = (e: PointerEvent) => {
    this.touches.delete(e.pointerId);
    if (this.touches.size < 2) this.pinch = null;
    if (!this.drag || this.drag.id !== e.pointerId) return;
    const d = this.drag;
    this.drag = null;
    this.canvas.style.cursor = this.hoverId ? 'pointer' : 'grab';
    if (!this.interactive) return;
    if (!d.moved && performance.now() - d.t < 600) {
      const rect = this.canvas.getBoundingClientRect();
      const b = this.hit(e.clientX - rect.left, e.clientY - rect.top);
      this.camVel = { x: 0, y: 0 };
      const maintenant = performance.now();
      // deux clics rapprochés sur la bulle déjà ouverte : on entre, sans chercher le bouton de la fiche
      if (b && this.dernierClic?.id === b.p.id && maintenant - this.dernierClic.t < 450 && this.selectedId === b.p.id) {
        this.dernierClic = null;
        this.events.onEnter?.(b.p.id);
        return;
      }
      this.dernierClic = b ? { id: b.p.id, t: maintenant } : null;
      this.select(b ? b.p.id : null);
    }
  };

  private zoomAt(sx: number, sy: number, z: number): void {
    const nz = Math.max(this.minZoom, Math.min(this.maxZoom, z));
    const wx = this.cam.x + (sx - this.w / 2) / this.cam.zoom;
    const wy = this.cam.y + (sy - this.h / 2) / this.cam.zoom;
    this.cam.zoom = nz;
    this.cam.x = wx - (sx - this.w / 2) / nz;
    this.cam.y = wy - (sy - this.h / 2) / nz;
    this.events.onMoved?.();
  }

  private onWheel = (e: WheelEvent) => {
    if (!this.interactive) return;
    e.preventDefault();
    this.camAnim = null;
    this.zoomAt(e.offsetX, e.offsetY, this.cam.zoom * Math.exp(-e.deltaY * 0.0012));
  };

  private onKey = (e: KeyboardEvent) => {
    if (!this.interactive) return;
    const k = e.key.toLowerCase();
    const panKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'z', 'q', 's', 'd', 'w', 'a'];
    this.keyboardFocus = true;
    if (panKeys.includes(k)) {
      e.preventDefault();
      this.keys.add(k);
      this.events.onMoved?.();
    } else if (k === '+' || k === '=') {
      this.zoomAt(this.w / 2, this.h / 2, this.cam.zoom * 1.15);
    } else if (k === '-') {
      this.zoomAt(this.w / 2, this.h / 2, this.cam.zoom / 1.15);
    } else if (k === 'home' || k === '0') {
      e.preventDefault();
      this.resetView();
    } else if (k === 'escape') {
      this.select(null);
    }
  };

  // ————————————————————————————————— simulation

  private wrapD(d: number, size: number): number {
    return d - Math.round(d / size) * size;
  }

  private rebuildGrid(): void {
    this.grid.clear();
    for (const b of this.bubbles) {
      const cx = Math.floor((((b.x % this.worldW) + this.worldW) % this.worldW) / this.cell) % this.cols;
      const cy = Math.floor((((b.y % this.worldH) + this.worldH) % this.worldH) / this.cell) % this.rows;
      const key = cy * this.cols + cx;
      const arr = this.grid.get(key);
      if (arr) arr.push(b);
      else this.grid.set(key, [b]);
    }
  }

  private step(dt: number): void {
    const spec = MODES[this.mode];
    this.time += this.enPause ? 0 : dt;
    // en quittant la constellation, les bulles s'effacent un peu plus vite (le moteur s'arrête ensuite)
    this.modeAlpha += (spec.alpha - this.modeAlpha) * Math.min(1, dt * 1.6);
    // « réduire les animations » du système : le mouvement ralentit mais ne s'arrête jamais
    const targetSpeed = this.enPause ? 0 : spec.speed * (this.reduced ? 0.35 : 1);
    this.modeSpeed += (targetSpeed - this.modeSpeed) * Math.min(1, dt * 1.2);

    // caméra
    if (this.camAnim) {
      const a = this.camAnim;
      const t = Math.min(1, (performance.now() - a.t0) / a.dur);
      const e = easeInOut(t);
      this.cam.x = a.from.x + (a.to.x - a.from.x) * e;
      this.cam.y = a.from.y + (a.to.y - a.from.y) * e;
      this.cam.zoom = a.from.zoom + (a.to.zoom - a.from.zoom) * e;
      if (t >= 1) {
        const done = a.done;
        this.camAnim = null;
        done?.();
      }
    } else if (!this.drag) {
      this.cam.x += this.camVel.x * dt;
      this.cam.y += this.camVel.y * dt;
      const decay = Math.exp(-dt * 3.2);
      this.camVel.x *= decay;
      this.camVel.y *= decay;
    }
    // clavier : déplacement doux avec inertie
    const kx = (this.keys.has('arrowright') || this.keys.has('d') ? 1 : 0) - (this.keys.has('arrowleft') || this.keys.has('q') || this.keys.has('a') ? 1 : 0);
    const ky = (this.keys.has('arrowdown') || this.keys.has('s') ? 1 : 0) - (this.keys.has('arrowup') || this.keys.has('z') || this.keys.has('w') ? 1 : 0);
    const kspeed = 420 / this.cam.zoom;
    this.keyVel.x += (kx * kspeed - this.keyVel.x) * Math.min(1, dt * 4);
    this.keyVel.y += (ky * kspeed - this.keyVel.y) * Math.min(1, dt * 4);
    this.cam.x += this.keyVel.x * dt;
    this.cam.y += this.keyVel.y * dt;

    // on ne regarde que les passants proches : les bulles peuvent se frôler, voire se chevaucher un instant
    const avoidR = this.D * 1.7;
    const t = this.time;
    this.rebuildGrid();

    for (const b of this.bubbles) {
      const held = b.p.id === this.hoverId || b.p.id === this.selectedId || b.p.id === this.montreeId;
      b.slow += ((held ? 0 : 1) - b.slow) * Math.min(1, dt * (held ? 3 : 0.8));
      b.scale += (b.targetScale - b.scale) * Math.min(1, dt * 3);
      const targetAlpha = this.match ? (this.match.has(b.p.id) ? 1 : 0.13) : 1;
      b.alpha += (targetAlpha - b.alpha) * Math.min(1, dt * (b.alpha < 0.2 && targetAlpha === 1 ? 0.35 : 1.5));
      b.breath += b.breathSpeed * dt;

      if (this.modeSpeed < 0.001) continue;

      // 1. errance : une courbure qui change sans cesse, jamais périodique
      let turn = drift(t * 0.11 + b.sa) * 0.95;
      if (b.foyer !== undefined) {
        // le banc rappelle doucement ses bulles égarées ; son centre dérive, lui aussi
        const f = this.foyers[b.foyer]!;
        const ddx = this.wrapD(f.x + Math.sin(t * 0.021 + f.ph) * this.worldW * 0.09 - b.x, this.worldW);
        const ddy = this.wrapD(f.y + Math.cos(t * 0.017 + f.ph * 1.3) * this.worldH * 0.09 - b.y, this.worldH);
        const rappel = Math.min(1, Math.max(0, (Math.hypot(ddx, ddy) - this.rayonBanc * 0.9) / (this.rayonBanc * 1.2)));
        turn += angleDiff(Math.atan2(ddy, ddx), b.th) * 0.55 * rappel;
      }
      // 2. intentions : régulièrement, la bulle « décide » d'aller ailleurs
      b.prefTimer -= dt;
      if (b.prefTimer < 0) {
        b.pref = b.th + gaussian(Math.random) * 1.9;
        b.prefTimer = 3 + Math.random() * 11;
      }
      turn += angleDiff(b.pref, b.th) * 0.28;

      // 3. croisements : chacun fait un léger écart pour ceux qui arrivent en face,
      //    avec plus ou moins d'attention (certains passent sans détour)
      let ax = 0;
      let ay = 0;
      let crowd = 0;
      const gx = Math.floor((((b.x % this.worldW) + this.worldW) % this.worldW) / this.cell);
      const gy = Math.floor((((b.y % this.worldH) + this.worldH) % this.worldH) / this.cell);
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const cx = (gx + ox + this.cols) % this.cols;
          const cy = (gy + oy + this.rows) % this.rows;
          const arr = this.grid.get(cy * this.cols + cx);
          if (!arr) continue;
          for (const o of arr) {
            if (o === b) continue;
            const dx = this.wrapD(b.x - o.x, this.worldW);
            const dy = this.wrapD(b.y - o.y, this.worldH);
            const d = Math.hypot(dx, dy);
            if (d > avoidR || d === 0) continue;
            const ahead = -(dx * Math.cos(b.th) + dy * Math.sin(b.th)) / d;
            if (ahead < 0.2) continue; // derrière ou à côté : on ne s'en soucie pas
            const wgt = (1 - d / avoidR) ** 2 * ahead * b.heed;
            ax += (dx / d) * wgt;
            ay += (dy / d) * wgt;
            crowd += wgt;
            // au contact, la bulle se comprime à peine dans le sens de la rencontre (essai `?toucher=1`)
            if (TOUCHER && d < this.D * 1.02) {
              const force = (1 - d / (this.D * 1.02)) * 0.6;
              if (force > (b.sq ?? 0)) {
                b.sq = force;
                b.sqA = Math.atan2(dy, dx);
              }
            }
            // superposés presque exactement : on se sépare, très lentement
            // (dans un banc, plus tôt et plus franchement : serrées, elles se chevaucheraient plus qu'aujourd'hui)
            const ecart = this.D * (BANCS ? 1.25 : 0.3);
            if (d < ecart) {
              const push = (ecart - d) * (BANCS ? 1.3 : 0.3) * dt;
              b.x += (dx / d) * push;
              b.y += (dy / d) * push;
            }
          }
        }
      }
      if (crowd > 0) {
        const away = Math.atan2(ay, ax);
        turn += angleDiff(away, b.th) * Math.min(1.2, crowd * 1.6);
      }
      const maxTurn = 1.4;
      b.th += Math.max(-maxTurn, Math.min(maxTurn, turn)) * dt;

      // 4. allure : chacun son tempérament — avance, flâne, s'arrête presque, repart
      const n = drift(t * 0.06 + b.sb);
      const target = (n < -0.4 ? 0.6 : 4 + ((n + 0.4) / 1.4) * 22) * b.temper;
      b.v += (target - b.v) * Math.min(1, dt * 0.6);

      const sp = b.v * b.slow * this.modeSpeed;
      if (TOUCHER) {
        // la compression se relâche d'elle-même
        if (b.sq) b.sq *= Math.exp(-dt * 3.5);
        // les bulles proches du curseur s'écartent d'un rien, comme une nappe qu'on effleure
        if (this.pointer.inside && !this.drag) {
          const px = this.cam.x + (this.pointer.x - this.w / 2) / this.cam.zoom;
          const py = this.cam.y + (this.pointer.y - this.h / 2) / this.cam.zoom;
          const dx = this.wrapD(b.x - px, this.worldW);
          const dy = this.wrapD(b.y - py, this.worldH);
          const d = Math.hypot(dx, dy);
          const R = this.D * 2.6;
          if (d > 1 && d < R) {
            const k = (1 - d / R) ** 2 * 14 * dt;
            b.x += (dx / d) * k;
            b.y += (dy / d) * k;
          }
        }
      }
      if (BANCS) {
        // un courant commun, large et lent, emporte les bancs
        const cx = b.x * 0.0016;
        const cy = b.y * 0.0016;
        const ct = t * 0.018;
        b.x += (Math.sin(cy * 1.7 + ct) + 0.5 * Math.sin(cy * 3.1 - ct * 0.6 + 1.3)) * 7 * b.slow * this.modeSpeed * dt;
        b.y += (Math.sin(cx * 1.5 - ct * 0.8 + 2.1) + 0.5 * Math.sin(cx * 2.9 + ct * 0.5)) * 7 * b.slow * this.modeSpeed * dt;
      }
      b.x += Math.cos(b.th) * sp * dt;
      b.y += Math.sin(b.th) * sp * dt;
      b.x = ((b.x % this.worldW) + this.worldW) % this.worldW;
      b.y = ((b.y % this.worldH) + this.worldH) % this.worldH;
    }

    // pas de sélection au clavier (choix du créateur) : aucune bulle n'est mise en évidence
    this.focusId = null;

    // un seul nom à la fois : celui de la bulle survolée (les noms voisins, qui
    // apparaissaient et disparaissaient au gré du curseur, faisaient mécanique)
    this.nearIds = [];
  }

  // ————————————————————————————————— rendu

  private draw(): void {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'source-over';
    const z = this.cam.zoom;
    const base = (this.D * z) / SPRITE_DIAMETER;
    const margin = base;

    // génération progressive des sprites : budget de temps par image, jamais de saccade
    const t0 = performance.now();
    if (this.peintre.actif && this.peintre.pret) {
      // à côté : une vingtaine de bulles en route à la fois, les plus proches d'abord ; la page ne s'arrête jamais
      while (this.spritesAllowed && this.spriteQueue.length && this.peintre.enAttente < 24) {
        const b = this.spriteQueue.shift()!;
        this.peintre.peindre(b.p.id, b.p.hex, this.spriteSize, b.p.matiere, ECLAT);
      }
    } else if (!this.peintre.actif) {
      while (this.spritesAllowed && this.spriteQueue.length && performance.now() - t0 < 7) {
        const b = this.spriteQueue.shift()!;
        b.sprite = embellir(bubbleSprite(b.p.id, b.p.hex, { matiere: b.p.matiere, size: this.spriteSize }));
      }
    }

    let focusDraw: { x: number; y: number; r: number } | null = null;
    const ownDraw: { x: number; y: number; r: number; a: number }[] = [];
    for (const b of this.bubbles) {
      if (!b.sprite) continue;
      const x = this.wrapD(b.x - this.cam.x, this.worldW) * z + this.w / 2;
      const y = this.wrapD(b.y - this.cam.y, this.worldH) * z + this.h / 2;
      if (x < -margin || y < -margin || x > this.w + margin || y > this.h + margin) continue;
      const breath = 1 + Math.sin(b.breath) * 0.018;
      const size = base * b.scale * breath;
      let a = this.modeAlpha * b.alpha * (this.calmZones.length ? this.calmFactor(x, y) : 1);
      if (this.enteringId && b.p.id !== this.enteringId) a *= 0.35;
      if (this.enteringId === b.p.id) a = Math.max(a, 1);
      ctx.globalAlpha = Math.min(1, a);
      if (b.p.id === this.selectedId) {
        // une présence plus affirmée : un second voile de pigment autour
        ctx.globalAlpha = Math.min(1, a) * 0.16;
        ctx.drawImage(b.sprite, x - size * 0.68, y - size * 0.68, size * 1.36, size * 1.36);
        ctx.globalAlpha = Math.min(1, a);
      }
      if (TOUCHER && b.sq && b.sq > 0.01) {
        // comprimée dans le sens de la rencontre, un peu plus large en travers : le volume se garde
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(b.sqA ?? 0);
        ctx.scale(1 - b.sq * 0.14, 1 + b.sq * 0.09);
        ctx.drawImage(b.sprite, -size / 2, -size / 2, size, size);
        ctx.restore();
      } else ctx.drawImage(b.sprite, x - size / 2, y - size / 2, size, size);
      if (b.p.id === this.focusId) focusDraw = { x, y, r: (this.D * z * b.scale) / 2 + 7 };
      if (this.own.has(b.p.id)) ownDraw.push({ x, y, r: (this.D * z * b.scale) / 2, a });
    }
    ctx.globalAlpha = 1;

    // ta propre bulle : un fil brodé tout autour et « ta trace » en dessous
    for (const o of ownDraw) {
      const rr = o.r + 7 + Math.sin(this.time * 0.8) * 0.8;
      ctx.globalAlpha = Math.min(1, o.a) * 0.85;
      ctx.strokeStyle = 'rgb(87, 83, 92)';
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.setLineDash([3.2, 3.4]);
      ctx.lineDashOffset = -this.time * 2.5;
      ctx.beginPath();
      ctx.arc(o.x, o.y, rr, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgb(47, 44, 51)';
      ctx.font = 'italic 14px "Newsreader Variable", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('ta trace', o.x, o.y + rr + 16);
    }
    ctx.globalAlpha = 1;

    if (focusDraw) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(47, 44, 51, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(focusDraw.x, focusDraw.y, focusDraw.r, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  start(): void {
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
      this.last = now;
      // onglet caché : rien à montrer, la batterie se repose (le temps de la promenade s'arrête aussi)
      if (document.hidden) return;
      // hors de la constellation, plus rien à calculer ni à dessiner : la toile s'efface
      // par un fondu CSS (sur la carte graphique) ; les sprites continuent de se préparer,
      // pour un retour immédiat
      if (!MODES[this.mode].interactive && !this.enteringId) {
        if (this.spriteQueue.length) this.step(dt);
        return;
      }
      this.step(dt);
      this.draw();
      this.events.onFrame?.();
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.peintre.destroy();
    const c = this.canvas;
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('pointerleave', this.onLeave);
    c.removeEventListener('wheel', this.onWheel);
    c.removeEventListener('keydown', this.onKey);
    c.removeEventListener('keyup', this.onKeyUp);
    c.removeEventListener('focus', this.onFocus);
    c.removeEventListener('blur', this.onBlur);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
  }
}
