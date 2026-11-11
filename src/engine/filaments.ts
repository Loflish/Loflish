/**
 * Essai « filaments » (Tom, 11 novembre 2026) : la matière de la constellation faite de milliers de fils de broderie
 * qui suivent un chemin, « comme l'eau et l'encre ». Derrière `?fils=1` (ou `?fils=2`, plus dense) : sans ce
 * drapeau, rien de ce fichier n'est créé et la constellation reste exactement celle d'avant.
 *
 * Troisième version (Tom : « encore plus fins », « plusieurs milliers », « détaillés ») : les fils sont tracés par
 * la carte graphique, d'un seul geste. Des dizaines de milliers de fils d'un pixel d'écran (un demi-pixel sur un
 * téléphone), dont plusieurs milliers visibles à la fois. Chaque fil est un long chemin dessiné une fois pour
 * toutes ; ce qu'on en voit est un brin qui glisse le long du chemin, net à la tête, effilé à la queue, cousu en
 * longs points lancés. Les fils voisins partent presque ensemble : ils se suivent par vagues. Deux familles se
 * croisent, comme une hachure. Chaque fil prend, à chaque endroit, la couleur de la peinture qu'il traverse.
 * (Versions précédentes dans l'historique : fils enroulés autour des bulles, cbb9e77 ; hachures en 2D, 5889a8b.)
 *
 * Le moteur n'est pas modifié : on lit seulement sa caméra.
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

/** Le plus petit zoom que la constellation permet, avec une marge : la trame couvre l'écran jusque-là. */
const ZOOM_MIN = 0.72;
/** Longueur d'un pas le long d'un chemin, en pixels du monde. */
const PAS = 26;

const SOMMET = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aBase;   // le milieu du chemin, en fraction de la trame
layout(location = 1) in vec2 aEcart;  // le point, par rapport à ce milieu (seizièmes de pixel)
layout(location = 2) in vec4 aFil;    // place le long du chemin, départ, allure, teinte
layout(location = 3) in vec4 aPlus;   // couture invisible entre deux fils, force du fil
uniform vec2 uTrame;
uniform vec2 uCam;
uniform float uZoom;
uniform vec2 uEcran;
uniform float uTemps;
out float vForce;
out float vPlace;
out float vTeinte;
void main() {
  vec2 base = aBase * uTrame;
  // la trame se répète à l'infini : chaque fil est dessiné dans sa copie la plus proche de la caméra
  base += uTrame * floor((uCam - base) / uTrame + 0.5);
  vec2 m = (base + aEcart / 16.0 - uCam) * uZoom;
  gl_Position = vec4(m.x / (uEcran.x * 0.5), -m.y / (uEcran.y * 0.5), 0.0, 1.0);
  // le brin visible : il parcourt le chemin, net à la tête, effilé à la queue
  float longueur = 0.5;
  float tour = fract(aFil.y + uTemps * (0.028 + aFil.z * 0.02));
  float derriere = tour * (1.0 + longueur) - aFil.x;
  float brin = smoothstep(0.0, 0.03, derriere) * (1.0 - smoothstep(longueur * 0.45, longueur, derriere));
  vForce = brin * (1.0 - aPlus.x) * (0.45 + aPlus.y * 0.55);
  vPlace = aFil.x;
  vTeinte = aFil.w;
}`;

const FRAGMENT = `#version 300 es
precision mediump float;
uniform sampler2D uPeinture;
uniform vec2 uToile;     // taille du calque, en pixels d'écran
uniform vec2 uCouvre;    // la part de la peinture que l'écran montre
uniform float uOpacite;
uniform float uPoints;   // nombre de points lancés le long d'un chemin
in float vForce;
in float vPlace;
in float vTeinte;
out vec4 couleur;
void main() {
  if (vForce < 0.02) discard;
  // le point lancé : le fil plonge un instant dans la toile, puis ressort
  if (fract(vPlace * uPoints + vTeinte * 9.0) < 0.1) discard;
  vec2 uv = gl_FragCoord.xy / uToile;
  uv = (vec2(uv.x, 1.0 - uv.y) - 0.5) * uCouvre + 0.5;
  vec3 c = texture(uPeinture, uv).rgb;
  // un fil teint : la teinte de la peinture, plus saturée, un ton plus bas
  float gris = (c.r + c.g + c.b) / 3.0;
  c = clamp((gris + (c - gris) * 2.7) * (0.6 + vTeinte * 0.3), 0.0, 1.0);
  // un fil sur douze est le fil bordeaux du linge écrit
  if (vTeinte > 0.917) c = vec3(0.48, 0.18, 0.27);
  float a = vForce * uOpacite;
  couleur = vec4(c * a, a);
}`;

export class Filaments {
  private gl: WebGL2RenderingContext | null;
  private programme: WebGLProgram | null = null;
  private lieux: Record<string, WebGLUniformLocation | null> = {};
  private sommets = 0;
  private part = 1;
  private trame: [number, number] = [2400, 1800];
  private points = 24;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private image: { w: number; h: number } | null = null;
  private temps = 0;
  private raf = 0;
  private actif = true;
  private reduit = false;
  private pause = false;
  private derniereCam: Cam = { x: NaN, y: NaN, zoom: NaN };
  private dernierInstant = 0;
  private lent = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private variante: VarianteFils,
    private cam: () => Cam | undefined,
    _bulles?: () => BulleVue[],
    fond?: string,
  ) {
    this.gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true, depth: false, stencil: false });
    if (!this.gl) return;
    this.resize();
    if (!this.preparer()) {
      this.gl = null;
      return;
    }
    this.tisser();
    if (fond) this.lirePeinture(fond);
  }

  private preparer(): boolean {
    const gl = this.gl!;
    const compiler = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const a = compiler(gl.VERTEX_SHADER, SOMMET), b = compiler(gl.FRAGMENT_SHADER, FRAGMENT);
    if (!a || !b) return false;
    const p = gl.createProgram()!;
    gl.attachShader(p, a);
    gl.attachShader(p, b);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return false;
    this.programme = p;
    for (const n of ['uTrame', 'uCam', 'uZoom', 'uEcran', 'uTemps', 'uPeinture', 'uToile', 'uCouvre', 'uOpacite', 'uPoints'])
      this.lieux[n] = gl.getUniformLocation(p, n);
    // en attendant la peinture : un mauve neutre
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([214, 196, 208, 255]));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return true;
  }

  /** La direction du geste : un grand mouvement d'ensemble qui s'incurve, périodique sur la trame (elle se répète sans couture). */
  private direction(x: number, y: number, famille: number): number {
    const [tx, ty] = this.trame;
    const u = (x / tx) * Math.PI * 2, v = (y / ty) * Math.PI * 2;
    const a = 0.6 * Math.sin(u + v * 0 + 0.4) + 0.42 * Math.sin(-u + 2 * v + 1.7) + 0.2 * Math.sin(3 * u + 2 * v + 4.1) + 0.1 * Math.sin(5 * u - 4 * v + 2.2);
    return (famille ? -0.16 : -0.98) + a * (famille ? 0.7 : 1);
  }

  /** Tous les chemins, tirés une fois pour toutes et confiés à la carte graphique. */
  private tisser() {
    const gl = this.gl!;
    const petit = Math.min(this.w, this.h) < 700;
    this.points = petit ? 18 : 24;
    const chemin = this.points * PAS;
    this.trame = [Math.ceil(this.w / ZOOM_MIN + chemin), Math.ceil(this.h / ZOOM_MIN + chemin)];
    const fils = Math.round((petit ? 18000 : 40000) * (this.variante === 2 ? 1.8 : 1));
    const M = this.points;
    const parFil = M + 2; // un sommet invisible de chaque côté : les fils se suivent dans un seul tracé
    const total = fils * parFil;
    const octets = new ArrayBuffer(total * 16);
    const vue = new DataView(octets);
    const xs = new Float32Array(M), ys = new Float32Array(M);
    const [tx, ty] = this.trame;
    let o = 0;
    let jumeau = false;
    let gx = 0, gy = 0, gPhase = 0, gFamille = 0;
    for (let f = 0; f < fils; f++) {
      // un fil sur sept est doublé : le même chemin, un pixel et demi à côté
      const doubler: boolean = jumeau;
      if (!doubler) {
        gx = Math.random() * tx;
        gy = Math.random() * ty;
        gFamille = Math.random() < 0.24 ? 1 : 0;
        // les voisins partent presque ensemble : le départ suit la place sur la toile, à un souffle près
        gPhase = (gx * 0.62 + gy * 0.38) / 900 + Math.random() * 0.3;
      }
      jumeau = !doubler && Math.random() < 0.14;
      const cote = doubler ? 1.6 : 0;
      let x = gx, y = gy;
      for (let i = 0; i < M; i++) {
        const d = this.direction(x, y, gFamille);
        // chaque point un peu à côté de la ligne idéale, comme à la main
        const ecart = (Math.random() - 0.5) * 2.2 + cote;
        xs[i] = x - Math.sin(d) * ecart;
        ys[i] = y + Math.cos(d) * ecart;
        x += Math.cos(d) * PAS;
        y += Math.sin(d) * PAS;
      }
      const mx = xs[M >> 1]!, my = ys[M >> 1]!;
      const bx = ((mx % tx) + tx) % tx, by = ((my % ty) + ty) % ty;
      const phase = Math.floor((((gPhase % 1) + 1) % 1) * 255);
      const allure = Math.floor(Math.random() * 255);
      const teinte = Math.floor(Math.random() * 255);
      const force = Math.floor((doubler ? 0.55 : 0.35 + Math.random() * 0.65) * 255);
      for (let k = 0; k < parFil; k++) {
        const i = Math.min(M - 1, Math.max(0, k - 1));
        vue.setUint16(o, Math.round((bx / tx) * 65535), true);
        vue.setUint16(o + 2, Math.round((by / ty) * 65535), true);
        vue.setInt16(o + 4, Math.round((xs[i]! - mx) * 16), true);
        vue.setInt16(o + 6, Math.round((ys[i]! - my) * 16), true);
        vue.setUint8(o + 8, Math.round((i / (M - 1)) * 255));
        vue.setUint8(o + 9, phase);
        vue.setUint8(o + 10, allure);
        vue.setUint8(o + 11, teinte);
        vue.setUint8(o + 12, k === 0 || k === parFil - 1 ? 255 : 0);
        vue.setUint8(o + 13, force);
        o += 16;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, octets, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.UNSIGNED_SHORT, true, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.SHORT, false, 16, 4);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 16, 8);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 16, 12);
    this.sommets = total;
  }

  /** La peinture du fond : chaque fil prend, à chaque endroit, le ton de ce qu'il traverse. */
  private lirePeinture(src: string) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const gl = this.gl;
      if (!gl) return;
      // réduite : la teinte d'une région, pas le grain du papier
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = Math.max(1, Math.round((256 * img.naturalHeight) / img.naturalWidth));
      const x = c.getContext('2d');
      if (!x) return;
      x.drawImage(img, 0, 0, c.width, c.height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.image = { w: img.naturalWidth, h: img.naturalHeight };
      this.derniereCam.zoom = NaN;
    };
    img.src = src;
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth || window.innerWidth;
    this.h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.derniereCam.zoom = NaN;
  }

  /** Nombre de fils tissés (pour les mesures). */
  get n(): number {
    return Math.round(this.sommets / (this.points + 2));
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
    // la trame est déjà là à l'arrivée : on part d'un moment quelconque de son mouvement
    this.temps = 40 + Math.random() * 200;
    this.boucle();
  }
  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private dessiner(cam: Cam) {
    const gl = this.gl;
    if (!gl || !this.programme) return;
    const L = this.lieux;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.programme);
    gl.uniform2f(L.uTrame!, this.trame[0], this.trame[1]);
    gl.uniform2f(L.uCam!, cam.x, cam.y);
    gl.uniform1f(L.uZoom!, cam.zoom);
    gl.uniform2f(L.uEcran!, this.w, this.h);
    gl.uniform1f(L.uTemps!, this.temps);
    gl.uniform1i(L.uPeinture!, 0);
    gl.uniform2f(L.uToile!, this.canvas.width, this.canvas.height);
    // l'image couvre l'écran (object-fit: cover) : la part qu'on en voit
    const i = this.image;
    const e = i ? Math.max(this.w / i.w, this.h / i.h) : 1;
    gl.uniform2f(L.uCouvre!, i ? this.w / (i.w * e) : 1, i ? this.h / (i.h * e) : 1);
    // un fil d'un pixel d'écran : un demi-pixel sur un téléphone, où il peut être plein ; ailleurs on l'allège
    gl.uniform1f(L.uOpacite!, this.dpr >= 1.5 ? 0.95 : 0.62);
    gl.uniform1f(L.uPoints!, this.points * 0.9);
    gl.drawArrays(gl.LINE_STRIP, 0, Math.floor((this.sommets * this.part) / (this.points + 2)) * (this.points + 2));
  }

  private boucle = () => {
    if (this.raf || !this.actif || !this.gl) return;
    const pas = (instant: number) => {
      this.raf = 0;
      if (!this.actif) return;
      this.raf = requestAnimationFrame(pas);
      if (document.hidden) return;
      const cam = this.cam();
      if (!cam) return;
      const bouge = cam.x !== this.derniereCam.x || cam.y !== this.derniereCam.y || cam.zoom !== this.derniereCam.zoom;
      this.derniereCam = { x: cam.x, y: cam.y, zoom: cam.zoom };
      const fige = this.pause || this.reduit;
      const ecoule = this.dernierInstant ? instant - this.dernierInstant : 16.7;
      this.dernierInstant = instant;
      if (!fige) {
        this.temps += Math.min(0.05, ecoule / 1000);
        // un appareil qui peine : on retire des fils plutôt que de saccader
        this.lent = ecoule > 34 ? this.lent + 1 : Math.max(0, this.lent - 1);
        if (this.lent > 45 && this.part > 0.3) {
          this.part *= 0.75;
          this.lent = 0;
        }
      }
      if (!fige || bouge) this.dessiner(cam);
    };
    this.raf = requestAnimationFrame(pas);
  };
}
