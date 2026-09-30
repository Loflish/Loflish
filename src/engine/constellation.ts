import { drift, gaussian, hashString, rng } from '../lib/random';
import { bubbleSprite, SPRITE_DIAMETER } from './bubbleSprite';

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
}

export type Mode = 'explore' | 'perdre' | 'trace' | 'creer' | 'texte' | 'minimal';

interface ModeSpec {
  alpha: number;
  speed: number;
  interactive: boolean;
}

export const MODES: Record<Mode, ModeSpec> = {
  explore: { alpha: 1, speed: 1, interactive: true },
  perdre: { alpha: 0.42, speed: 0.6, interactive: false },
  trace: { alpha: 0.26, speed: 0.4, interactive: false },
  creer: { alpha: 0.14, speed: 0.35, interactive: false },
  texte: { alpha: 0.3, speed: 0.5, interactive: false },
  minimal: { alpha: 0.05, speed: 0, interactive: false },
};

interface Bubble {
  p: Presence;
  x: number;
  y: number;
  th: number;
  v: number;
  pref: number;
  prefTimer: number;
  sa: number;
  sb: number;
  slow: number;
  scale: number;
  targetScale: number;
  breath: number;
  breathSpeed: number;
  alpha: number;
  sprite: HTMLCanvasElement | null;
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
}

const TAU = Math.PI * 2;
const angleDiff = (a: number, b: number) => {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Constellation {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private bubbles: Bubble[] = [];
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
  private maxZoom = 2.6;
  private time = 0;
  private last = 0;
  private raf = 0;
  private modeAlpha = 1;
  private modeSpeed = 1;
  private mode: Mode = 'explore';
  private reduced = false;
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
  events: EngineEvents = {};
  /** Zones calmes à l'écran (logo…) : les bulles s'y effacent doucement. */
  private calmZones: { x: number; y: number; w: number; h: number }[] = [];

  constructor(private canvas: HTMLCanvasElement, presences: Presence[]) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponible');
    this.ctx = ctx;
    this.resize();
    this.setPresences(presences);
    this.bind();
  }

  // ————————————————————————————————— population

  setPresences(list: Presence[]): void {
    const small = window.innerWidth < 700;
    const medium = window.innerWidth < 1100;
    // Sur mobile, moins de bulles simultanées : espace, lisibilité, performances.
    const count = Math.min(list.length, small ? 150 : medium ? 260 : 380);
    this.D = small ? 34 : 38;
    const spacing = small ? 82 : 96;
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
        prefTimer: 4 + rr() * 16,
        sa: rr() * 1000,
        sb: rr() * 1000,
        slow: 1,
        scale: 1,
        targetScale: 1,
        breath: rr() * TAU,
        breathSpeed: TAU / (7 + rr() * 6),
        alpha: 1,
        sprite: null,
      };
      return b;
    });
    this.byId = new Map(this.bubbles.map((b) => [b.p.id, b]));
    this.spriteQueue = this.bubbles.filter((b) => !b.sprite);
    this.cell = this.D * 2.8;
    this.cols = Math.max(1, Math.floor(this.worldW / this.cell));
    this.rows = Math.max(1, Math.floor(this.worldH / this.cell));
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
      sa: rr() * 1000,
      sb: rr() * 1000,
      slow: 1,
      scale: 1,
      targetScale: 1,
      breath: 0,
      breathSpeed: TAU / 9,
      alpha: 0,
      sprite: null,
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
    if (mode !== 'explore') this.enteringId = null;
  }

  setReducedMotion(v: boolean): void {
    this.reduced = v;
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

  setMatch(ids: Set<string> | null): void {
    this.match = ids;
  }

  get isMoved(): boolean {
    return Math.abs(this.cam.zoom - this.defaultZoom) > 0.05;
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
    if (this.bubbles.length) {
      this.minZoom = Math.max(this.w / (this.worldW * 0.92), this.h / (this.worldH * 0.92));
      this.cam.zoom = Math.max(this.cam.zoom, this.minZoom);
    }
  }

  private animateCam(to: Partial<Cam>, dur: number, done?: () => void): void {
    const target: Cam = { ...this.cam, ...to };
    if (this.reduced || dur <= 0) {
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

  resetView(): void {
    this.animateCam({ zoom: this.defaultZoom }, 1400);
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
      window.setTimeout(resolve, this.reduced ? 0 : 950);
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

  private hit(sx: number, sy: number): Bubble | null {
    let best: Bubble | null = null;
    let bestD = Infinity;
    const rad = (this.D * this.cam.zoom) / 2 + 6;
    for (const b of this.bubbles) {
      if (b.alpha < 0.3) continue;
      const x = this.wrapD(b.x - this.cam.x, this.worldW) * this.cam.zoom + this.w / 2;
      const y = this.wrapD(b.y - this.cam.y, this.worldH) * this.cam.zoom + this.h / 2;
      const d = Math.hypot(x - sx, y - sy);
      if (d < rad && d < bestD) {
        best = b;
        bestD = d;
      }
    }
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
    } else if (k === 'enter' || k === ' ') {
      e.preventDefault();
      if (this.focusId) this.select(this.focusId);
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
    this.time += dt;
    const spec = MODES[this.mode];
    this.modeAlpha += (spec.alpha - this.modeAlpha) * Math.min(1, dt * 1.6);
    const targetSpeed = this.reduced ? 0 : spec.speed;
    this.modeSpeed = this.reduced ? 0 : this.modeSpeed + (targetSpeed - this.modeSpeed) * Math.min(1, dt * 1.2);

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

    const avoidR = this.D * 2.6;
    const t = this.time;
    this.rebuildGrid();

    for (const b of this.bubbles) {
      const held = b.p.id === this.hoverId || b.p.id === this.selectedId;
      b.slow += ((held ? 0 : 1) - b.slow) * Math.min(1, dt * (held ? 3 : 0.8));
      b.scale += (b.targetScale - b.scale) * Math.min(1, dt * 3);
      const targetAlpha = this.match ? (this.match.has(b.p.id) ? 1 : 0.13) : 1;
      b.alpha += (targetAlpha - b.alpha) * Math.min(1, dt * (b.alpha < 0.2 && targetAlpha === 1 ? 0.35 : 1.5));
      if (!this.reduced) b.breath += b.breathSpeed * dt;

      if (this.modeSpeed < 0.001) continue;

      // 1. errance : légère courbure permanente, jamais périodique
      let turn = drift(t * 0.07 + b.sa) * 0.42;
      // 2. intentions : de temps à autre la bulle « choisit » un nouveau cap
      b.prefTimer -= dt;
      if (b.prefTimer < 0) {
        b.pref = b.th + gaussian(Math.random) * 1.3;
        b.prefTimer = 7 + Math.random() * 20;
      }
      turn += angleDiff(b.pref, b.th) * 0.12;

      // 3. évitement : infléchir sa route quand quelqu'un arrive en face
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
            const wgt = (1 - d / avoidR) ** 2;
            // on anticipe davantage ceux qui sont devant soi
            const ahead = Math.max(0, -(dx * Math.cos(b.th) + dy * Math.sin(b.th)) / d);
            ax += (dx / d) * wgt * (0.6 + ahead);
            ay += (dy / d) * wgt * (0.6 + ahead);
            crowd += wgt;
            // chevauchement : séparation très douce, sans rebond
            if (d < this.D * 1.05) {
              const push = (this.D * 1.05 - d) * 0.5 * Math.min(1, dt * 2.2);
              b.x += (dx / d) * push;
              b.y += (dy / d) * push;
            }
          }
        }
      }
      if (crowd > 0) {
        const away = Math.atan2(ay, ax);
        turn += angleDiff(away, b.th) * Math.min(1.6, crowd * 1.4);
      }
      const maxTurn = 0.9;
      b.th += Math.max(-maxTurn, Math.min(maxTurn, turn)) * dt;

      // 4. allure : avance, ralentit, s'arrête presque, repart
      const n = drift(t * 0.045 + b.sb);
      let target = n < -0.42 ? 0.5 : 3 + ((n + 0.42) / 1.42) * 13;
      target *= 1 - Math.min(0.5, crowd * 0.25);
      b.v += (target - b.v) * Math.min(1, dt * 0.5);

      const sp = b.v * b.slow * this.modeSpeed;
      b.x += Math.cos(b.th) * sp * dt;
      b.y += Math.sin(b.th) * sp * dt;
      b.x = ((b.x % this.worldW) + this.worldW) % this.worldW;
      b.y = ((b.y % this.worldH) + this.worldH) % this.worldH;
    }

    // focus clavier : la présence la plus proche du centre de l'écran
    if (this.keyboardFocus && this.interactive) {
      let best: Bubble | null = null;
      let bd = Infinity;
      for (const b of this.bubbles) {
        const d = Math.hypot(this.wrapD(b.x - this.cam.x, this.worldW), this.wrapD(b.y - this.cam.y, this.worldH));
        if (d < bd && b.alpha > 0.5) {
          bd = d;
          best = b;
        }
      }
      this.focusId = best?.p.id ?? null;
    } else {
      this.focusId = null;
    }

    // noms qui émergent autour du curseur (3 au plus, très discrets)
    this.nearIds = [];
    if (this.interactive && this.pointer.inside && !this.drag) {
      const cand: [number, string][] = [];
      for (const b of this.bubbles) {
        if (b.p.id === this.hoverId || b.alpha < 0.5) continue;
        const x = this.wrapD(b.x - this.cam.x, this.worldW) * this.cam.zoom + this.w / 2;
        const y = this.wrapD(b.y - this.cam.y, this.worldH) * this.cam.zoom + this.h / 2;
        const d = Math.hypot(x - this.pointer.x, y - this.pointer.y);
        if (d < 120) cand.push([d, b.p.id]);
      }
      cand.sort((a, b) => a[0] - b[0]);
      this.nearIds = cand.slice(0, 3).map((c) => c[1]);
    }
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
    while (this.spriteQueue.length && performance.now() - t0 < 7) {
      const b = this.spriteQueue.shift()!;
      b.sprite = bubbleSprite(b.p.id, b.p.hex);
    }

    let focusDraw: { x: number; y: number; r: number } | null = null;
    for (const b of this.bubbles) {
      if (!b.sprite) continue;
      const x = this.wrapD(b.x - this.cam.x, this.worldW) * z + this.w / 2;
      const y = this.wrapD(b.y - this.cam.y, this.worldH) * z + this.h / 2;
      if (x < -margin || y < -margin || x > this.w + margin || y > this.h + margin) continue;
      const breath = this.reduced ? 1 : 1 + Math.sin(b.breath) * 0.018;
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
      ctx.drawImage(b.sprite, x - size / 2, y - size / 2, size, size);
      if (b.p.id === this.focusId) focusDraw = { x, y, r: (this.D * z * b.scale) / 2 + 7 };
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
      if (this.mode === 'minimal' && this.modeAlpha < 0.06 && !this.spriteQueue.length) {
        // quasiment invisible : on ne dessine qu'occasionnellement
        if (Math.floor(now / 500) === Math.floor((now - dt * 1000) / 500)) return;
      }
      this.step(dt);
      this.draw();
      this.events.onFrame?.();
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
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
