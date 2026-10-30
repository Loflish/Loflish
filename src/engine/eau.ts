/**
 * Le fond qui coule comme une eau calme (choix de Tom, 21 octobre 2026) : la peinture du fond est
 * posée dans une toile WebGL, et ses masses colorées glissent lentement le long d'un courant
 * lui-même déformé (comme de l'encre qui se promène dans l'eau). Le grain fin du papier est
 * réappliqué à sa place d'origine : seul le pigment bouge, le papier reste.
 *
 * La boucle se referme exactement : chaque couche du courant tourne sur un cercle dans l'espace
 * du bruit, un nombre entier de fois par période. Aucun raccord visible, aussi longtemps qu'on
 * regarde. Les couleurs vives (les taches) bougent plus que le papier presque blanc.
 *
 * Ce qui la rend « cinématique » (conseil du 21 octobre) : une lumière chaude et très lente qui
 * passe sur la peinture (Monet, la chaleur de Klimt), un vignettage à peine visible qui ramène
 * l'œil vers les bulles, et de la profondeur — la peinture suit la caméra de la constellation de
 * loin, avec un temps de retard, puis revient doucement au centre.
 *
 * Plus vivante et plus autonome (Tom, 21 octobre au soir) : un courant très large fait flotter les
 * grandes taches d'elles-mêmes, comme des bulles ; et quand on entre dans la constellation, le
 * pigment s'étire un peu plus puis se pose (l'éclosion).
 *
 * Réglages par l'adresse, le temps de juger : ?eau=1 (&ampleur=0.034 &periode=30 &lumiere=1 &flotte=1.3).
 */

const VERT = `attribute vec2 position; varying vec2 vUv;
void main(){ vUv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }`;

const FRAG = `precision highp float;
varying vec2 vUv;
uniform sampler2D peinture;
uniform vec2 texel;
uniform vec2 cadre;
uniform vec2 derive;
uniform float phase;
uniform float ampleur;
uniform float lumiere;
uniform float flotte;
uniform float eclosion;
uniform float melange;
uniform float vivacite;
uniform float colore;
// l'entrée : des gouttes tombent sur le papier vierge et y déposent exactement la peinture du fond
uniform vec4 gouttes[20];
uniform float tApparition;
uniform float apparition;
uniform float vie;
uniform vec2 aspectImage;
uniform vec3 papier;
float hachage(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float bruit(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hachage(i), hachage(i + vec2(1., 0.)), u.x), mix(hachage(i + vec2(0., 1.)), hachage(i + vec2(1., 1.)), u.x), u.y);
}
vec2 cercle(float k, float r){ return r * vec2(cos(phase * k), sin(phase * k)); }
float fbm(vec2 p, float d){
  float s = 0., a = .5;
  for (int i = 0; i < 4; i++) { s += a * bruit(p + cercle(float(i + 1), d)); p *= 2.03; a *= .5; }
  return s;
}
vec3 couleur(vec2 p){ return texture2D(peinture, clamp(p, texel, 1. - texel)).rgb; }
vec3 doux(vec2 p){
  vec2 d = texel * 2.5;
  return (couleur(p) * 4. + couleur(p + d) + couleur(p - d) + couleur(p + vec2(d.x, -d.y)) + couleur(p + vec2(-d.x, d.y))) / 8.;
}
void main(){
  vec2 p = (vec2(vUv.x, 1. - vUv.y) - .5) * cadre + .5 + derive;
  vec2 q = vec2(fbm(p * 2.2, .9), fbm(p * 2.2 + vec2(5.2, 1.3), .9));
  vec2 r = vec2(fbm(p * 1.6 + 2.2 * q + vec2(1.7, 9.2), 1.3), fbm(p * 1.6 + 2.2 * q + vec2(8.3, 2.8), 1.3));
  vec3 bas = doux(p);
  float chroma = max(max(bas.r, bas.g), bas.b) - min(min(bas.r, bas.g), bas.b);
  float encre = .3 + .7 * smoothstep(.02, .10, chroma);
  // les grandes taches flottent d'elles-mêmes, lentement, comme les bulles : un courant très large
  vec2 g = vec2(bruit(p * 1.15 + cercle(1., 1.1)), bruit(p * 1.15 + vec2(7.3, 2.1) + cercle(1., 1.1))) - .5;
  // un second courant, plus large et deux fois plus rapide : chaque tache suit son propre chemin
  vec2 g2 = vec2(bruit(p * .7 + vec2(3.3, 8.1) + cercle(2., .8)), bruit(p * .7 + vec2(9.4, .6) + cercle(2., .8))) - .5;
  // des tourbillons lents (le rotationnel d'un bruit) : le pigment tourne sur lui-même, dans tous les sens, sans
  // jamais se tasser ni se vider (Tom, 26 octobre : « plus autonome, plus mélangeant, plus vibrant, organique »)
  vec2 pc = p * 1.8 + vec2(5.7, 3.1) + cercle(1., .7);
  float hc = .04;
  vec2 tourbillon = vec2(bruit(pc + vec2(0., hc)) - bruit(pc - vec2(0., hc)), bruit(pc - vec2(hc, 0.)) - bruit(pc + vec2(hc, 0.))) / (2. * hc) * .18;
  // et une respiration (la pente d'un autre bruit) : par endroits les taches gonflent, ailleurs elles se resserrent,
  // chacune à son rythme
  vec2 ps = p * 1.35 + vec2(2.2, 7.4) + cercle(2., .6);
  vec2 souffle = vec2(bruit(ps + vec2(hc, 0.)) - bruit(ps - vec2(hc, 0.)), bruit(ps + vec2(0., hc)) - bruit(ps - vec2(0., hc))) / (2. * hc) * .12;
  vec2 dep = ((r - .5) + (g + g2 * .7 + tourbillon + souffle) * flotte) * ampleur * encre * eclosion * vie;
  vec3 grain = couleur(p) - bas;
  vec3 res = doux(p + dep) + grain;
  // les taches se mêlent : par endroits, le pigment encore humide se fond avec ses voisines, puis se reprend
  float humide = smoothstep(.34, .7, fbm(p * 1.3 + vec2(2.7, 4.1), .8)) * melange * vie;
  vec2 e = texel * 14.;
  vec3 large = (doux(p + dep + vec2(e.x, 0.)) + doux(p + dep - vec2(e.x, 0.)) + doux(p + dep + vec2(0., e.y)) + doux(p + dep - vec2(0., e.y))) * .25;
  res = mix(res, large + grain, humide * .55);
  // le blanc respire : les couleurs voisines s'y glissent par moments, sans jamais l'effacer tout à fait
  // (les grandes plages blanches gardent leur cœur clair, les petites se teintent)
  // (le « blanc » de la peinture est un papier crème : clair, à peine teinté — mesuré le 22 octobre)
  float cRes = max(max(res.r, res.g), res.b) - min(min(res.r, res.g), res.b);
  float blanc = smoothstep(.8, .9, dot(res, vec3(.3, .59, .11))) * (1. - smoothstep(.1, .17, cRes));
  vec2 f1 = texel * 60., f2 = texel * 140.;
  vec3 loin = (couleur(p + dep + vec2(f1.x, 0.)) + couleur(p + dep - vec2(f1.x, 0.)) + couleur(p + dep + vec2(0., f1.y)) + couleur(p + dep - vec2(0., f1.y))
    + couleur(p + dep + f2 * .7) + couleur(p + dep - f2 * .7) + couleur(p + dep + vec2(f2.x, -f2.y) * .7) + couleur(p + dep + vec2(-f2.x, f2.y) * .7)) * .125;
  float respire = .45 + .55 * fbm(p * 1.8 + vec2(6.1, 2.4), 1.);
  res = mix(res, loin + grain, blanc * colore * respire * vie);
  // un peu plus de vie dans le pigment (le papier, presque sans couleur, n'en change pas)
  res = mix(vec3(dot(res, vec3(.299, .587, .114))), res, vivacite);
  // la lumière : un voile chaud, large et lent, qui passe sur la peinture sans rien cacher
  float voile = smoothstep(.42, .78, fbm(p * .9 + vec2(3.1, 7.7), .5)) * lumiere;
  res += voile * vec3(.085, .06, .02) * (1.15 - res);
  // l'entrée : chaque goutte touche le papier, s'étend avec un bord irrégulier et un liseré de pigment,
  // coule un peu vers le bas, se laisse porter par l'eau, et dévoile exactement la peinture ;
  // les taches continuent de s'étendre jusqu'à se rejoindre et couvrir tout le papier
  float m = 1.;
  if (apparition < 1.) {
    float bord = .72 + .56 * fbm(p * 7., 0.);
    vec2 pm = p - dep * 2.5;
    float coeur = 0.;
    m = 0.;
    for (int i = 0; i < 20; i++) {
      vec4 gt = gouttes[i];
      float lt = tApparition - gt.z;
      if (gt.w <= 0. || lt <= 0.) continue;
      float rayon = gt.w * (1. - exp(-lt / 1.4)) + max(0., lt - 2.5) * .05;
      vec2 rel = (pm - gt.xy) * aspectImage;
      // la coulure : vers le bas, la tache s'allonge à mesure qu'elle s'étend
      if (rel.y > 0.) rel.y *= mix(1., .7, smoothstep(.5, 3., lt));
      float d = length(rel) / bord;
      m = max(m, 1. - smoothstep(rayon * .62 - .012, rayon, d));
      coeur = max(coeur, exp(-d * d / (.0004 + .002 * rayon)) * smoothstep(0., .2, lt) * (1. - smoothstep(.3, 1.6, lt)));
    }
    m = max(m, smoothstep(.82, 1., apparition));
    float lisere = m * (1. - m) * 4.;
    vec3 peint = res * (1. - .14 * lisere);
    peint = mix(peint, peint * peint, .45 * coeur);
    res = mix(papier + grain, peint, m);
  }
  // le vignettage, à peine visible et chaud : l'œil revient vers le centre, là où vivent les bulles
  // (seulement sur ce qui est peint : sur le papier vierge de l'entrée, il ferait des coins gris)
  vec2 v = (vUv - .5) * vec2(1., .82);
  res *= 1. - smoothstep(.28, .78, length(v)) * vec3(.035, .05, .075) * m;
  gl_FragColor = vec4(clamp(res, 0., 1.), 1.);
}`;

export interface ReglagesEau {
  /** amplitude du déplacement, en fraction de l'image */
  ampleur: number;
  /** durée d'une boucle complète, en secondes */
  periode: number;
  /** force du voile de lumière chaude (0 = aucun) */
  lumiere: number;
  /** force du large courant qui fait flotter les taches comme des bulles (0 = elles ondulent sur place) */
  flotte: number;
  /** combien les taches se fondent les unes dans les autres, par moments (0 = jamais) */
  melange: number;
  /** vivacité des couleurs du pigment (1 = la peinture telle quelle) */
  vivacite: number;
  /** combien les couleurs voisines se glissent dans les blancs (0 = jamais ; à 1, il reste toujours du blanc) */
  colore: number;
  /**
   * avec une peinture vivante (vidéo) : la part du courant du code qui la porte en plus (1 = tout le courant de la
   * version de base). Mesuré le 26 octobre (écart moyen d'une seconde à l'autre) : base 13,6 ; premier essai
   * Seedance, « trop maximaliste », 26,3 ; vidéo 4K + tout le courant 22,8 ; vidéo 4K + la moitié 17,2, un peu
   * plus vivante que la base sans retomber dans le trop.
   */
  fluxVideo: number;
}

/** Le fond qui coule, avec ses réglages facultatifs dans l'adresse ; `?eau=0` le retire. */
export function reglagesEau(): ReglagesEau | null {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search);
  if (q.get('eau') === '0') return null;
  const nombre = (k: string, d: number, min: number, max: number) => {
    const v = Number(q.get(k) ?? NaN);
    return Number.isFinite(v) && v >= min && v <= max ? v : d;
  };
  return {
    // 26 octobre : un peu plus lent (période 44 s au lieu de 30) mais plus ample, donc plus autonome ; mesuré sur le
    // fond feutré : 22,8 par seconde au lieu de 24,8, et les couleurs s'éloignent de leur place 1,3 fois plus
    ampleur: nombre('ampleur', 0.05, 0.002, 0.07),
    periode: nombre('periode', 48, 12, 240),
    lumiere: nombre('lumiere', 1, 0, 2),
    flotte: nombre('flotte', 2, 0, 3.5),
    melange: nombre('melange', 1.05, 0, 1.5),
    colore: nombre('colore', 0.75, 0, 1),
    // la peinture est déjà plus vive (repeinte « imbibée dans la toile ») : une pointe suffit
    vivacite: nombre('vivacite', 1.1, 0.6, 1.6),
    fluxVideo: nombre('fluxvideo', 0.5, 0, 1.5),
  };
}

/** la position de la caméra de la constellation (monde sans bord) */
type Camera = { x: number; y: number; zoom: number };

/** part de l'image gardée en réserve sur les bords, pour que la peinture puisse glisser */
const MARGE = 0.06;
/** la peinture suit la caméra à 8 % de sa course : elle est loin derrière les bulles */
const PROFONDEUR = 0.08;
/** temps (en secondes) qu'elle met à revenir doucement au centre quand on ne bouge plus */
const RETOUR = 3;
/** l'éclosion, quand on entre dans la constellation : le pigment s'étire puis se pose, en millisecondes */
const ECLOSION = 3200;
/** l'entrée : nombre de gouttes au plus (garder égal au tableau du shader) */
const NB_GOUTTES = 20;
/** sous ce rythme (images par seconde), deux mesures de suite, l'eau s'arrête : mieux vaut la peinture fixe qu'un musée qui rame */
const RYTHME_MIN = 20;
/** durée d'une mesure du rythme, en millisecondes */
const MESURE = 3000;

/** Une goutte de l'entrée : où elle touche le papier (coordonnées de l'image), quand (s), jusqu'où elle s'étend. */
type Goutte = { x: number; y: number; t: number; r: number };

/**
 * Lit la peinture en petit pour savoir où tomberont les gouttes (au cœur des grandes taches, les plus
 * colorées d'abord) et de quelle couleur est le papier vierge (la médiane des pixels les plus clairs).
 */
function lirePeinture(img: CanvasImageSource, largeur: number, hauteur: number): { gouttes: Goutte[]; papier: [number, number, number] } {
  const W = 96, H = Math.max(1, Math.round((96 * hauteur) / largeur));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.filter = 'blur(2px)';
  x.drawImage(img, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H).data;
  const cases: { i: number; chroma: number; lum: number }[] = [];
  for (let i = 0; i < W * H; i++) {
    const r = d[i * 4]!, g = d[i * 4 + 1]!, b = d[i * 4 + 2]!;
    cases.push({ i, chroma: (Math.max(r, g, b) - Math.min(r, g, b)) / 255, lum: (r * 0.3 + g * 0.59 + b * 0.11) / 255 });
  }
  const clairs = [...cases].sort((a, b) => b.lum - a.lum).slice(0, Math.round(cases.length * 0.1));
  const med = (k: number) => clairs.map((o) => d[o.i * 4 + k]! / 255).sort((a, b) => a - b)[clairs.length >> 1] ?? 0.94;
  const papier: [number, number, number] = [med(0), med(1), med(2)];
  const aspect = largeur / hauteur;
  const choisies: { x: number; y: number; chroma: number }[] = [];
  const loin = (px: number, py: number) => Math.min(...choisies.map((c2) => Math.hypot((c2.x - px) * aspect, c2.y - py)), 9);
  // d'abord au cœur des grandes taches, les plus colorées en premier…
  for (const o of [...cases].sort((a, b) => b.chroma - a.chroma)) {
    if (choisies.length >= 12 || o.chroma < 0.05) break;
    const px = ((o.i % W) + 0.5) / W, py = (Math.floor(o.i / W) + 0.5) / H;
    if (loin(px, py) > 0.2) choisies.push({ x: px, y: py, chroma: o.chroma });
  }
  // …puis là où il reste le plus de papier vide, pour que les taches finissent par tout couvrir
  while (choisies.length < NB_GOUTTES) {
    let mieux = { x: 0.5, y: 0.5, d: 0 };
    for (let i = 0; i < W * H; i += 3) {
      const px = ((i % W) + 0.5) / W, py = (Math.floor(i / W) + 0.5) / H;
      const d = loin(px, py);
      if (d > mieux.d) mieux = { x: px, y: py, d };
    }
    if (mieux.d < 0.12) break;
    choisies.push({ x: mieux.x, y: mieux.y, chroma: 0 });
  }
  const gouttes = choisies.map((g, i) => {
    const voisine = Math.min(...choisies.filter((h) => h !== g).map((h) => Math.hypot((h.x - g.x) * aspect, h.y - g.y)), 0.6);
    // les plus colorées d'abord, puis les autres, une à une, avec un peu d'irrégularité
    return { x: g.x, y: g.y, t: 0.2 + i * 0.22 + ((i * 0.618) % 1) * 0.15, r: Math.min(0.5, Math.max(0.2, voisine * 1.05)) };
  });
  return { gouttes, papier };
}

export class FondEau {
  private gl: WebGLRenderingContext | null;
  private programme: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};
  /** la taille de la peinture (image fixe, ou vidéo quand la peinture vivante vient de Seedance) */
  private image: { naturalWidth: number; naturalHeight: number } | null = null;
  private video: HTMLVideoElement | null = null;
  private raf = 0;
  private dernier = 0;
  private t = 0;
  private enPause = false;
  private reduit = false;
  /** le cadre de base (l'image couvre la toile, moins la réserve), avant le zoom de la caméra */
  private cadre = { x: 1, y: 1 };
  private derive = { x: 0, y: 0 };
  private echelle = 1;
  private derniereCam: Camera | null = null;
  private zoomDeReference = 0;
  /** l'éclosion en cours (instant de départ), ou -1 ; et le léger recul de la peinture qui l'accompagne */
  private eclosionDebut = -1;
  private zoomEclosion = 1;
  /** l'entrée : son temps écoulé (s), sa durée, sa vitesse (accélérée si on la passe), et ce qu'on fait à la fin */
  private apparition: { t: number; duree: number; vitesse: number; fin?: () => void } | null = null;
  /** la mesure du rythme : son début, ses images, et combien de mesures de suite ont été trop lentes */
  private rythme = { debut: 0, images: 0, lentes: 0 };
  /** prête quand l'image est posée : la peinture fixe reste visible dessous jusque-là */
  pret = false;

  constructor(
    private canvas: HTMLCanvasElement,
    source: string,
    private reglages: ReglagesEau,
    private surPret?: () => void,
    private camera?: () => Camera | undefined,
    /** une vidéo (Seedance) qui devient la peinture vivante ; l'image fixe reste le secours */
    sourceVideo?: string,
  ) {
    this.gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!this.gl) return;
    const gl = this.gl;
    const prog = (this.programme = gl.createProgram()!);
    for (const [type, code] of [
      [gl.VERTEX_SHADER, VERT],
      [gl.FRAGMENT_SHADER, FRAG],
    ] as const) {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, code);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        this.gl = null;
        return;
      }
      gl.attachShader(prog, s);
    }
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const tampon = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['texel', 'cadre', 'derive', 'phase', 'ampleur', 'lumiere', 'flotte', 'eclosion', 'melange', 'vivacite', 'colore', 'gouttes', 'tApparition', 'apparition', 'vie', 'aspectImage', 'papier'])
      this.u[n] = gl.getUniformLocation(prog, n);
    canvas.addEventListener('webglcontextlost', () => {
      this.pret = false;
      this.canvas.hidden = true;
    });

    const poser = (img: TexImageSource & CanvasImageSource, largeur: number, hauteur: number) => {
      if (!this.gl) return;
      const g = this.gl;
      this.texture = g.createTexture();
      g.bindTexture(g.TEXTURE_2D, this.texture);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGB, g.RGB, g.UNSIGNED_BYTE, img);
      g.uniform2f(this.u.texel!, 1 / largeur, 1 / hauteur);
      // la vidéo mêle le pigment d'elle-même ; le courant du code la porte en plus (Tom, 22 octobre : « reproduire
      // pareil » le mouvement de la version de base, « mais en mieux »)
      g.uniform1f(this.u.ampleur!, this.reglages.ampleur * (this.video ? this.reglages.fluxVideo : 1));
      g.uniform1f(this.u.lumiere!, this.reglages.lumiere);
      g.uniform1f(this.u.flotte!, this.reglages.flotte);
      g.uniform1f(this.u.eclosion!, 1);
      g.uniform1f(this.u.melange!, this.reglages.melange);
      g.uniform1f(this.u.vivacite!, this.reglages.vivacite);
      g.uniform1f(this.u.colore!, this.reglages.colore);
      g.uniform1f(this.u.apparition!, 1);
      g.uniform1f(this.u.vie!, 1);
      g.uniform2f(this.u.aspectImage!, largeur / hauteur, 1);
      const { gouttes, papier } = lirePeinture(img, largeur, hauteur);
      const v = new Float32Array(NB_GOUTTES * 4);
      gouttes.forEach((o, i) => v.set([o.x, o.y, o.t, o.r], i * 4));
      g.uniform4fv(this.u.gouttes!, v);
      // le papier vierge de l'entrée prend la couleur de la page : autour du logo, où la peinture s'efface
      // (museum.css), on voit la page ; sinon cette zone paraîtrait grise tant que la peinture n'est pas posée
      const page = getComputedStyle(document.body).backgroundColor.match(/\d+(\.\d+)?/g)?.map(Number);
      g.uniform3f(this.u.papier!, ...(page && page.length >= 3 ? ([page[0]! / 255, page[1]! / 255, page[2]! / 255] as const) : papier));
      this.image = { naturalWidth: largeur, naturalHeight: hauteur };
      this.resize();
      this.dessiner();
      this.pret = true;
      this.surPret?.();
      // l'entrée a pu être demandée avant que l'image soit là : elle remplace alors l'éclosion
      if (!this.apparition) {
        this.eclore();
        this.jouerVideo();
      }
    };
    const fixe = () => {
      const img = new Image();
      img.onload = () => poser(img, img.naturalWidth, img.naturalHeight);
      img.src = source;
    };
    if (!sourceVideo) {
      fixe();
      return;
    }
    const v = document.createElement('video');
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    this.video = v;
    v.addEventListener('loadeddata', () => poser(v, v.videoWidth, v.videoHeight), { once: true });
    // si la vidéo ne vient pas, la peinture fixe prend sa place
    v.addEventListener('error', () => {
      this.video = null;
      fixe();
    }, { once: true });
    v.src = sourceVideo;
  }

  /** La peinture vivante (vidéo) coule, sauf pendant l'entrée et la pause ; plus lentement si l'on veut moins de mouvement. */
  private jouerVideo(): void {
    const v = this.video;
    if (!v) return;
    v.playbackRate = this.reduit ? 0.5 : 1;
    if (this.apparition || this.enPause) v.pause();
    else void v.play().catch(() => undefined);
  }

  /** La toile prend la taille de son cadre, sur 1,5 pixel par point au plus ; l'image la couvre. */
  resize(): void {
    const gl = this.gl;
    if (!gl || !this.image) return;
    const echelle = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * echelle));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * echelle));
    this.canvas.width = w;
    this.canvas.height = h;
    gl.viewport(0, 0, w, h);
    const aToile = w / h;
    const aImage = this.image.naturalWidth / this.image.naturalHeight;
    this.cadre = {
      x: (aToile > aImage ? 1 : aToile / aImage) * (1 - MARGE),
      y: (aToile > aImage ? aImage / aToile : 1) * (1 - MARGE),
    };
    this.envoyerCadre();
    this.dessiner();
  }

  /** Quand on entre dans la constellation : le pigment s'étire un peu plus, puis se pose (jamais si le visiteur veut moins de mouvement). */
  eclore(): void {
    if (this.reduit || this.enPause) return;
    this.eclosionDebut = performance.now();
  }

  /** L'entrée : des gouttes tombent sur le papier vierge et y déposent la peinture du fond, puis l'eau se met à couler. */
  apparaitre(duree: number, fin: () => void): void {
    this.eclosionDebut = -1;
    this.zoomEclosion = 1;
    this.apparition = { t: 0, duree, vitesse: 1, fin };
    // les gouttes déposent la première image de la peinture vivante ; elle ne bougera qu'ensuite
    if (this.video) {
      this.video.pause();
      this.video.currentTime = 0;
    }
    this.envoyerApparition();
    this.envoyerCadre();
  }

  /** Où en est l'entrée, en secondes (null s'il n'y en a pas) : les phrases du hook s'y accrochent. */
  get tempsApparition(): number | null {
    return this.apparition ? this.apparition.t : null;
  }

  /** Le visiteur passe l'entrée : elle se termine en accéléré, sans saut. */
  presserApparition(): void {
    if (this.apparition) this.apparition.vitesse = 5;
  }

  setPause(v: boolean): void {
    this.enPause = v;
    if (this.pret) this.jouerVideo();
  }

  setReduit(v: boolean): void {
    this.reduit = v;
    if (this.pret) this.jouerVideo();
  }

  start(): void {
    const boucle = (now: number) => {
      this.raf = requestAnimationFrame(boucle);
      if (document.hidden || !this.pret) return;
      // l'entrée se joue à pleine cadence : les gouttes doivent couler, pas sautiller
      if (this.apparition) {
        // le temps réel (borné après une absence de l'onglet) : les gouttes restent au rythme des phrases
        const dt = Math.min(0.25, (now - (this.dernier || now)) / 1000);
        this.dernier = now;
        const a = this.apparition;
        a.t += dt * a.vitesse;
        this.t += dt;
        this.suivreCamera(dt);
        const fini = a.t >= a.duree;
        if (fini) this.apparition = null;
        this.envoyerApparition();
        this.dessiner();
        if (fini) {
          this.jouerVideo();
          a.fin?.();
        }
        return;
      }
      // une trentaine d'images par seconde suffisent à une eau calme
      const ecart = now - this.dernier;
      if (ecart < 33) return;
      const dt = Math.min(0.1, (now - (this.dernier || now)) / 1000);
      this.dernier = now;
      // la profondeur suit la caméra même en pause : c'est le visiteur qui bouge, pas l'eau
      const bouge = this.suivreCamera(dt);
      if (this.enPause) {
        this.rythme.debut = 0;
        if (bouge) this.dessiner();
        return;
      }
      // « réduire les animations » : l'eau ralentit beaucoup, sans s'arrêter
      this.t += dt * (this.reduit ? 0.3 : 1);
      this.dessiner();
      this.surveiller(now, ecart);
    };
    this.raf = requestAnimationFrame(boucle);
  }

  /** La toile resservira au retour dans la constellation : la mémoire de la carte graphique lui est rendue. */
  stop(): void {
    cancelAnimationFrame(this.raf);
    this.gl?.deleteTexture(this.texture);
    this.gl?.deleteProgram(this.programme);
    this.gl = null;
  }

  /** Un appareil trop lent rend la main : la toile s'efface, la peinture fixe et nette est dessous. */
  private surveiller(now: number, ecart: number): void {
    const r = this.rythme;
    // une pause, une fenêtre en arrière-plan ou un onglet qui revient ne disent rien de l'appareil
    if (!r.debut || ecart > 1000 || !document.hasFocus()) {
      r.debut = now;
      r.images = 0;
      return;
    }
    r.images++;
    if (now - r.debut < MESURE) return;
    r.lentes = (r.images * 1000) / (now - r.debut) < RYTHME_MIN ? r.lentes + 1 : 0;
    r.debut = now;
    r.images = 0;
    if (r.lentes >= 2) {
      this.canvas.hidden = true;
      this.stop();
    }
  }

  /** La peinture glisse un peu avec la caméra, en retard, puis revient au centre. Rend vrai si elle a bougé. */
  private suivreCamera(dt: number): boolean {
    const cam = this.camera?.();
    const avant = { x: this.derive.x, y: this.derive.y, e: this.echelle };
    if (cam && !this.reduit) {
      const a = this.derniereCam;
      if (a) {
        let dx = (cam.x - a.x) * cam.zoom;
        let dy = (cam.y - a.y) * cam.zoom;
        // la constellation n'a pas de bord : un saut de l'autre côté du monde ne compte pas
        if (Math.abs(dx) > 400 || Math.abs(dy) > 400) dx = dy = 0;
        this.derive.x += (dx * PROFONDEUR * this.cadre.x) / Math.max(1, this.canvas.clientWidth);
        this.derive.y += (dy * PROFONDEUR * this.cadre.y) / Math.max(1, this.canvas.clientHeight);
      }
      this.derniereCam = { x: cam.x, y: cam.y, zoom: cam.zoom };
      this.zoomDeReference ||= cam.zoom;
      // s'approcher des bulles rapproche à peine la peinture
      this.echelle = Math.min(1.04, Math.max(0.97, 1 + (cam.zoom / this.zoomDeReference - 1) * 0.05));
    }
    const retour = Math.exp(-dt / RETOUR);
    // jamais au-delà de la réserve : le bord de l'image ne doit pas entrer dans l'écran
    const bx = Math.max(0, (1 - this.cadre.x / this.echelle) / 2);
    const by = Math.max(0, (1 - this.cadre.y / this.echelle) / 2);
    this.derive.x = Math.min(bx, Math.max(-bx, this.derive.x * retour));
    this.derive.y = Math.min(by, Math.max(-by, this.derive.y * retour));
    const bouge = Math.abs(this.derive.x - avant.x) + Math.abs(this.derive.y - avant.y) > 1e-5 || this.echelle !== avant.e;
    if (bouge) this.envoyerCadre();
    return bouge;
  }

  /** Où en est l'entrée : le temps des gouttes, la part dévoilée, et la vie de l'eau qui revient à la fin. */
  private envoyerApparition(): void {
    const gl = this.gl;
    if (!gl) return;
    const a = this.apparition;
    const k = a ? Math.min(1, a.t / a.duree) : 1;
    const s = Math.min(1, Math.max(0, (k - 0.8) / 0.2));
    gl.uniform1f(this.u.tApparition!, a ? a.t : 0);
    gl.uniform1f(this.u.apparition!, k);
    // l'eau coule déjà pendant que les gouttes se posent (les taches se laissent porter), puis prend toute sa force
    gl.uniform1f(this.u.vie!, a ? 0.5 + 0.5 * s * s * (3 - 2 * s) : 1);
  }

  private envoyerCadre(): void {
    const gl = this.gl;
    if (!gl) return;
    const e = this.echelle * this.zoomEclosion;
    gl.uniform2f(this.u.cadre!, this.cadre.x / e, this.cadre.y / e);
    gl.uniform2f(this.u.derive!, this.derive.x, this.derive.y);
  }

  private dessiner(): void {
    const gl = this.gl;
    if (!gl || !this.image) return;
    // la peinture vivante : l'image courante de la vidéo devient la peinture
    const v = this.video;
    if (v && v.readyState >= 2) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, v);
    gl.uniform1f(this.u.phase!, ((this.t / this.reglages.periode) % 1) * Math.PI * 2);
    if (this.eclosionDebut >= 0) {
      const k = Math.min(1, (performance.now() - this.eclosionDebut) / ECLOSION);
      const reste = (1 - k) ** 3;
      gl.uniform1f(this.u.eclosion!, 1 + 1.8 * reste);
      this.zoomEclosion = 1 + 0.035 * reste;
      this.envoyerCadre();
      if (k >= 1) this.eclosionDebut = -1;
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
