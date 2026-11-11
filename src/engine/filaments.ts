/**
 * Essai « filaments » (Tom, 11 novembre 2026) : la matière de la constellation faite de milliers de fils de broderie
 * qui suivent un chemin, « comme l'eau et l'encre ». Derrière `?fils=1` (ou `?fils=2`, plus dense) : sans ce
 * drapeau, rien de ce fichier n'est créé et la constellation reste exactement celle d'avant.
 *
 * Quatrième version (Tom : « plus fins que des coups de crayon », « qui suive le mouvement exact de la
 * constellation de base », « il faut voir le fond coloré », « les bulles et leur matière doivent rester visibles ») :
 * les fils sont cousus DANS la peinture. Chaque point d'un fil est attaché à un point de la peinture et se déplace
 * du déplacement même que l'eau donne au pigment à cet endroit (le calcul du courant de eau.ts, refait ici à
 * l'identique, avec sa phase) : quand une tache glisse, ses fils glissent avec elle. La peinture étant le fond de
 * toute la constellation, les fils la couvrent partout, où que l'on se promène.
 * Chaque fil prend la couleur du pigment qu'il porte. Sous une bulle, les fils s'effacent : sa matière reste nue.
 * Tracés par la carte graphique : des dizaines de milliers de fils d'un pixel d'écran, allégés pour laisser voir
 * la couleur. (Versions précédentes dans l'historique : cbb9e77, 5889a8b, a2c7d98.)
 *
 * Aucun moteur n'est modifié : on lit le mouvement de l'eau (FondEau.mouvement) et la place des bulles.
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

/** Ce qui place et fait couler la peinture à un instant (voir FondEau.mouvement). */
export interface Mouvement {
  cadre: [number, number];
  derive: [number, number];
  phase: number;
  ampleur: number;
  flotte: number;
  fluide: number;
  force: number;
}
export interface BulleVue {
  x: number;
  y: number;
  r: number;
}

/** Longueur d'un pas le long d'un fil, en pixels d'écran. */
const PAS = 22;
/** Le masque des bulles est quatre fois plus petit que la toile : un disque doux suffit. */
const REDUCTION = 4;

/** Le courant de l'eau, recopié de eau.ts : mêmes bruits, mêmes constantes, même phase. */
const COURANT = `
float hachage(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float bruit(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hachage(i), hachage(i + vec2(1., 0.)), u.x), mix(hachage(i + vec2(0., 1.)), hachage(i + vec2(1., 1.)), u.x), u.y);
}
vec2 cercle(float k, float r){ return r * vec2(cos(uPhase * k), sin(uPhase * k)); }
float fbm(vec2 p, float d){
  float s = 0., a = .5;
  for (int i = 0; i < 4; i++) { if (uFluide > 0. && i == 3) break; s += a * bruit(p + cercle(float(i + 1), d)); p *= 2.03; a *= .5; }
  return s;
}
vec2 deplacement(vec2 p){
  vec2 q = vec2(fbm(p * 2.2, .9), fbm(p * 2.2 + vec2(5.2, 1.3), .9));
  vec2 r = vec2(fbm(p * 1.6 + 2.2 * q + vec2(1.7, 9.2), 1.3), fbm(p * 1.6 + 2.2 * q + vec2(8.3, 2.8), 1.3));
  vec3 bas = textureLod(uPeinture, clamp(p, 0., 1.), 0.).rgb;
  float chroma = max(max(bas.r, bas.g), bas.b) - min(min(bas.r, bas.g), bas.b);
  float encre = mix(.3 + .7 * smoothstep(.02, .10, chroma), .55 + .45 * smoothstep(0., .25, chroma), uFluide);
  vec2 g = vec2(bruit(p * 1.15 + cercle(1., 1.1)), bruit(p * 1.15 + vec2(7.3, 2.1) + cercle(1., 1.1))) - .5;
  vec2 g2 = vec2(bruit(p * .7 + vec2(3.3, 8.1) + cercle(2., .8)), bruit(p * .7 + vec2(9.4, .6) + cercle(2., .8))) - .5;
  vec2 pc = p * 1.8 + vec2(5.7, 3.1) + cercle(1., .7);
  float hc = mix(.04, .10, uFluide);
  vec2 tourbillon = vec2(bruit(pc + vec2(0., hc)) - bruit(pc - vec2(0., hc)), bruit(pc - vec2(hc, 0.)) - bruit(pc + vec2(hc, 0.))) / (2. * hc) * mix(.18, .12, uFluide);
  vec2 ps = p * 1.35 + vec2(2.2, 7.4) + cercle(2., .6);
  vec2 souffle = vec2(bruit(ps + vec2(hc, 0.)) - bruit(ps - vec2(hc, 0.)), bruit(ps + vec2(0., hc)) - bruit(ps - vec2(0., hc))) / (2. * hc) * mix(.12, .08, uFluide);
  return ((r - .5) + (g + g2 * .7 + tourbillon + souffle) * uFlotte) * uAmpleur * encre * uForce;
}`;

const SOMMET = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aAncre;  // le point de la peinture où ce point du fil est cousu
layout(location = 1) in vec4 aFil;    // place le long du fil, départ, inutilisé, teinte
layout(location = 2) in vec4 aPlus;   // couture invisible entre deux fils, force du fil
uniform sampler2D uPeinture;
uniform vec2 uCadre;
uniform vec2 uDerive;
uniform float uPhase;
uniform float uAmpleur;
uniform float uFlotte;
uniform float uFluide;
uniform float uForce;
uniform int uPasses;
out float vForce;
out float vPlace;
out float vTeinte;
out vec2 vAncre;
${COURANT}
void main() {
  // l'eau montre en p le pigment pris en p + déplacement(p) : le pigment d'ancre a se voit donc en p tel que
  // p + déplacement(p) = a. Une ou deux passes suffisent, le déplacement est petit et lisse.
  vec2 p = aAncre - deplacement(aAncre);
  if (uPasses > 1) p = aAncre - deplacement(p);
  vec2 s = (p - .5 - uDerive) / uCadre + .5;
  gl_Position = vec4(s.x * 2. - 1., 1. - s.y * 2., 0., 1.);
  // le brin visible parcourt le fil en un tour de la boucle de l'eau : net à la tête, effilé à la queue
  float longueur = .55;
  float tour = fract(aFil.y + uPhase / 6.2831853);
  float derriere = tour * (1. + longueur) - aFil.x;
  float brin = smoothstep(0., .03, derriere) * (1. - smoothstep(longueur * .4, longueur, derriere));
  vForce = brin * (1. - aPlus.x) * (.4 + aPlus.y * .6);
  vPlace = aFil.x;
  vTeinte = aFil.w;
  vAncre = aAncre;
}`;

const FRAGMENT = `#version 300 es
precision mediump float;
uniform sampler2D uPeinture;
uniform sampler2D uBulles;
uniform vec2 uToile;
uniform float uOpacite;
uniform float uPoints;
in float vForce;
in float vPlace;
in float vTeinte;
in vec2 vAncre;
out vec4 couleur;
void main() {
  if (vForce < .02) discard;
  // le point lancé : le fil plonge un instant dans la toile, puis ressort
  if (fract(vPlace * uPoints + vTeinte * 9.) < .1) discard;
  // sous une bulle, pas de fil : sa matière reste nue
  float libre = 1. - texture(uBulles, gl_FragCoord.xy / uToile).r;
  // le fil porte la couleur du pigment où il est cousu : même teinte, plus saturée, un ton plus bas
  vec3 c = texture(uPeinture, clamp(vAncre, 0., 1.)).rgb;
  float gris = (c.r + c.g + c.b) / 3.;
  c = clamp((gris + (c - gris) * 2.5) * (.68 + vTeinte * .26), 0., 1.);
  // un fil sur douze est le fil bordeaux du linge écrit
  if (vTeinte > .917) c = vec3(.48, .18, .27);
  float a = vForce * uOpacite * libre;
  couleur = vec4(c * a, a);
}`;

const SOMMET_BULLE = `#version 300 es
layout(location = 0) in vec3 aBulle;  // centre (0..1 dans la toile, depuis le haut) et diamètre en pixels du masque
void main() {
  gl_Position = vec4(aBulle.x * 2. - 1., 1. - aBulle.y * 2., 0., 1.);
  gl_PointSize = aBulle.z;
}`;
const FRAGMENT_BULLE = `#version 300 es
precision mediump float;
out vec4 couleur;
void main() {
  float d = length(gl_PointCoord - .5) * 2.;
  couleur = vec4(1. - smoothstep(.8, 1., d));
}`;

export class Filaments {
  private gl: WebGL2RenderingContext | null;
  private fils: WebGLProgram | null = null;
  private bulle: WebGLProgram | null = null;
  private lieux: Record<string, WebGLUniformLocation | null> = {};
  private tableauFils: WebGLVertexArrayObject | null = null;
  private tableauBulles: WebGLVertexArrayObject | null = null;
  private tamponBulles: WebGLBuffer | null = null;
  private cadreBulles: WebGLFramebuffer | null = null;
  private textureBulles: WebGLTexture | null = null;
  private texturePeinture: WebGLTexture | null = null;
  private donneesBulles = new Float32Array(3 * 512);
  private sommets = 0;
  private points = 24;
  private part = 1;
  private tisse: { w: number; h: number } | null = null;
  private dpr = 1;
  private raf = 0;
  private actif = true;
  private reduit = false;
  private pause = false;
  private dernier = '';
  private dernierInstant = 0;
  private lent = 0;
  private image = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private variante: VarianteFils,
    private mouvement: () => Mouvement | null,
    private bulles: () => BulleVue[],
    fond: string,
    private toileEau?: () => HTMLCanvasElement | null,
  ) {
    this.gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true, depth: false, stencil: false });
    if (!this.gl) return;
    if (!this.preparer()) {
      this.gl = null;
      return;
    }
    this.resize();
    this.lirePeinture(fond);
  }

  private programme(sommet: string, fragment: string): WebGLProgram | null {
    const gl = this.gl!;
    const compiler = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const a = compiler(gl.VERTEX_SHADER, sommet), b = compiler(gl.FRAGMENT_SHADER, fragment);
    if (!a || !b) return null;
    const p = gl.createProgram()!;
    gl.attachShader(p, a);
    gl.attachShader(p, b);
    gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  }

  private preparer(): boolean {
    const gl = this.gl!;
    this.fils = this.programme(SOMMET, FRAGMENT);
    this.bulle = this.programme(SOMMET_BULLE, FRAGMENT_BULLE);
    if (!this.fils || !this.bulle) return false;
    for (const n of ['uPeinture', 'uBulles', 'uCadre', 'uDerive', 'uPhase', 'uAmpleur', 'uFlotte', 'uFluide', 'uForce', 'uPasses', 'uToile', 'uOpacite', 'uPoints'])
      this.lieux[n] = gl.getUniformLocation(this.fils, n);
    // la peinture, en attendant qu'elle arrive : un mauve neutre
    this.texturePeinture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texturePeinture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([214, 196, 208, 255]));
    // le masque des bulles
    this.textureBulles = gl.createTexture();
    this.cadreBulles = gl.createFramebuffer();
    this.tableauBulles = gl.createVertexArray();
    gl.bindVertexArray(this.tableauBulles);
    this.tamponBulles = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tamponBulles);
    gl.bufferData(gl.ARRAY_BUFFER, this.donneesBulles.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    gl.bindVertexArray(null);
    gl.enable(gl.BLEND);
    return true;
  }

  /** La direction du geste : un grand mouvement d'ensemble qui s'incurve lentement ; une seconde famille le croise. */
  private direction(x: number, y: number, famille: number): number {
    const a = 0.6 * Math.sin(x * 0.0026 + 0.4) + 0.42 * Math.sin(-x * 0.0021 + y * 0.0043 + 1.7) + 0.2 * Math.sin(x * 0.0071 + y * 0.0052 + 4.1) + 0.1 * Math.sin(x * 0.012 - y * 0.0097 + 2.2);
    return (famille ? -0.16 : -0.98) + a * (famille ? 0.7 : 1);
  }

  /** Tous les fils, cousus une fois pour toutes dans la peinture (coordonnées de l'image), et confiés à la carte graphique. */
  private tisser(m: Mouvement) {
    const gl = this.gl!;
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    // l'image entière, à l'échelle où l'écran la montre (l'écran en voit la part « cadre »)
    const iw = cw / m.cadre[0], ih = ch / m.cadre[1];
    const petit = Math.min(window.innerWidth, window.innerHeight) < 700;
    this.points = petit ? 20 : 26;
    const fils = Math.round((petit ? 12000 : 26000) * (this.variante === 2 ? 1.8 : 1));
    const M = this.points;
    const parFil = M + 2; // un sommet invisible de chaque côté : tous les fils dans un seul tracé
    const total = fils * parFil;
    const octets = new ArrayBuffer(total * 16);
    const vue = new DataView(octets);
    let o = 0;
    let doubler = false;
    let gx = 0, gy = 0, gPhase = 0, gFamille = 0;
    for (let f = 0; f < fils; f++) {
      // un fil sur sept est doublé : le même chemin, un pixel et demi à côté
      const jumeau: boolean = doubler;
      if (!jumeau) {
        gx = (-0.06 + Math.random() * 1.12) * iw;
        gy = (-0.06 + Math.random() * 1.12) * ih;
        gFamille = Math.random() < 0.24 ? 1 : 0;
        // les voisins partent presque ensemble : le départ suit la place sur la toile, à un souffle près
        gPhase = (gx * 0.62 + gy * 0.38) / 900 + Math.random() * 0.3;
      }
      doubler = !jumeau && Math.random() < 0.14;
      const cote = jumeau ? 1.6 : 0;
      const phase = Math.floor((((gPhase % 1) + 1) % 1) * 255);
      const teinte = Math.floor(Math.random() * 255);
      const force = Math.floor((jumeau ? 0.5 : 0.3 + Math.random() * 0.7) * 255);
      // le fil part en arrière de son point de départ : le milieu du chemin est là où on l'a tiré
      let x = gx, y = gy;
      for (let i = 0; i < M / 2; i++) {
        const d = this.direction(x, y, gFamille);
        x -= Math.cos(d) * PAS;
        y -= Math.sin(d) * PAS;
      }
      for (let k = 0; k < parFil; k++) {
        const i = Math.min(M - 1, Math.max(0, k - 1));
        const invisible = k === 0 || k === parFil - 1;
        const d = this.direction(x, y, gFamille);
        // chaque point un peu à côté de la ligne idéale, comme à la main
        const ecart = (Math.random() - 0.5) * 2 + cote;
        vue.setFloat32(o, (x - Math.sin(d) * ecart) / iw, true);
        vue.setFloat32(o + 4, (y + Math.cos(d) * ecart) / ih, true);
        vue.setUint8(o + 8, Math.round((i / (M - 1)) * 255));
        vue.setUint8(o + 9, phase);
        vue.setUint8(o + 11, teinte);
        vue.setUint8(o + 12, invisible ? 255 : 0);
        vue.setUint8(o + 13, force);
        o += 16;
        if (k > 0 && k < M) {
          x += Math.cos(d) * PAS;
          y += Math.sin(d) * PAS;
        }
      }
    }
    this.tableauFils ??= gl.createVertexArray();
    gl.bindVertexArray(this.tableauFils);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, octets, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.UNSIGNED_BYTE, true, 16, 8);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 16, 12);
    gl.bindVertexArray(null);
    this.sommets = total;
    this.tisse = { w: cw, h: ch };
  }

  /** La peinture du fond, réduite : la teinte de chaque région, et la force du courant sur le pigment. */
  private lirePeinture(src: string) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const gl = this.gl;
      if (!gl) return;
      const c = document.createElement('canvas');
      c.width = 384;
      c.height = Math.max(1, Math.round((384 * img.naturalHeight) / img.naturalWidth));
      const x = c.getContext('2d');
      if (!x) return;
      x.drawImage(img, 0, 0, c.width, c.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texturePeinture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.dernier = '';
    };
    img.src = src;
  }

  resize() {
    const gl = this.gl;
    if (!gl) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * this.dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * this.dpr));
    this.canvas.width = w;
    this.canvas.height = h;
    gl.bindTexture(gl.TEXTURE_2D, this.textureBulles);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Math.ceil(w / REDUCTION), Math.ceil(h / REDUCTION), 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.cadreBulles);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textureBulles, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // une autre taille d'écran : les fils sont retissés à la bonne échelle
    this.tisse = null;
    this.dernier = '';
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
    this.boucle();
  }
  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /** Les bulles, en disques doux, dans une petite image : là où elle est blanche, les fils s'effacent. */
  private masquer(bulles: BulleVue[]) {
    const gl = this.gl!;
    const r = this.canvas.getBoundingClientRect();
    const mw = Math.ceil(this.canvas.width / REDUCTION);
    const d = this.donneesBulles;
    const n = Math.min(bulles.length, d.length / 3);
    for (let i = 0; i < n; i++) {
      const b = bulles[i]!;
      d[i * 3] = (b.x - r.left) / r.width;
      d[i * 3 + 1] = (b.y - r.top) / r.height;
      d[i * 3 + 2] = ((b.r * 2 * 1.16) / r.width) * mw;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.cadreBulles);
    gl.viewport(0, 0, mw, Math.ceil(this.canvas.height / REDUCTION));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (n) {
      gl.useProgram(this.bulle);
      gl.bindVertexArray(this.tableauBulles);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tamponBulles);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, d, 0, n * 3);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, n);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private dessiner(m: Mouvement, bulles: BulleVue[]) {
    const gl = this.gl;
    if (!gl || !this.fils) return;
    if (!this.tisse) this.tisser(m);
    this.masquer(bulles);
    const L = this.lieux;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.fils);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texturePeinture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textureBulles);
    gl.uniform1i(L.uPeinture!, 0);
    gl.uniform1i(L.uBulles!, 1);
    gl.uniform2f(L.uCadre!, m.cadre[0], m.cadre[1]);
    gl.uniform2f(L.uDerive!, m.derive[0], m.derive[1]);
    gl.uniform1f(L.uPhase!, m.phase);
    gl.uniform1f(L.uAmpleur!, m.ampleur);
    gl.uniform1f(L.uFlotte!, m.flotte);
    gl.uniform1f(L.uFluide!, m.fluide);
    gl.uniform1f(L.uForce!, m.force);
    gl.uniform1i(L.uPasses!, this.points > 20 ? 2 : 1);
    gl.uniform2f(L.uToile!, this.canvas.width, this.canvas.height);
    // un fil d'un pixel d'écran, allégé : plus fin qu'un coup de crayon, la couleur du fond passe au travers
    gl.uniform1f(L.uOpacite!, this.dpr >= 1.5 ? 0.62 : 0.4);
    gl.uniform1f(L.uPoints!, this.points * 0.9);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(this.tableauFils);
    const parFil = this.points + 2;
    gl.drawArrays(gl.LINE_STRIP, 0, Math.floor((this.sommets * this.part) / parFil) * parFil);
    gl.bindVertexArray(null);
  }

  /** La toile des fils respire du même souffle que la toile de l'eau (même animation, même instant). */
  private accorder() {
    const eau = this.toileEau?.();
    const a = eau?.getAnimations?.()[0], b = this.canvas.getAnimations?.()[0];
    if (a && b && typeof a.currentTime === 'number' && typeof b.currentTime === 'number' && Math.abs(a.currentTime - b.currentTime) > 4) b.currentTime = a.currentTime;
  }

  private boucle = () => {
    if (this.raf || !this.actif || !this.gl) return;
    const pas = (instant: number) => {
      this.raf = 0;
      if (!this.actif) return;
      this.raf = requestAnimationFrame(pas);
      if (document.hidden) return;
      const m = this.mouvement();
      if (!m) return;
      if (this.image++ % 90 === 0) this.accorder();
      const bulles = this.bulles();
      // rien n'a bougé (pause, mouvement réduit) : inutile de redessiner
      const b0 = bulles[0];
      const etat = `${m.phase.toFixed(5)}|${m.derive[0].toFixed(5)}|${m.derive[1].toFixed(5)}|${m.cadre[0].toFixed(5)}|${m.force.toFixed(3)}|${bulles.length}|${b0 ? b0.x.toFixed(1) + ',' + b0.y.toFixed(1) : ''}`;
      const ecoule = this.dernierInstant ? instant - this.dernierInstant : 16.7;
      this.dernierInstant = instant;
      if (etat === this.dernier) return;
      this.dernier = etat;
      if (!this.pause && !this.reduit) {
        // un appareil qui peine : on retire des fils plutôt que de saccader
        this.lent = ecoule > 34 ? this.lent + 1 : Math.max(0, this.lent - 1);
        if (this.lent > 45 && this.part > 0.3) {
          this.part *= 0.75;
          this.lent = 0;
        }
      }
      this.dessiner(m, bulles);
    };
    this.raf = requestAnimationFrame(pas);
  };
}
