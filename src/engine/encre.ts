import { hexToRgb } from '../lib/palette';

/**
 * « Entrer dans sa mémoire » : une vraie diffusion d'encre filmée (vidéo
 * monochrome générée avec Higgsfield) s'ouvre depuis la bulle cliquée.
 * L'encre est recolorée en temps réel dans la couleur GRIS exacte de la
 * personne ; là où il n'y a pas d'encre, l'écran reste transparent.
 */

const VERT = `
attribute vec2 p;
varying vec2 uv;
void main(){ uv = p * 0.5 + 0.5; uv.y = 1.0 - uv.y; gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
varying vec2 uv;
uniform sampler2D avant;
uniform sampler2D apres;
uniform float melange;
uniform vec3 couleur;
uniform float fondu;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main(){
  // la vidéo est un masque : blanc = encre (tache filmée, trame du tissu retirée) ;
  // deux images successives fondues l'une dans l'autre : l'encre coule sans à-coups
  float m = mix(texture2D(avant, uv).r, texture2D(apres, uv).r, melange);
  float a = smoothstep(0.04, 0.7, m);
  vec2 d = abs(uv - 0.5) * 2.0;
  a *= 1.0 - smoothstep(0.86, 1.0, max(d.x, d.y));
  // grain de pigment fin, toujours à l'échelle de l'écran
  float g = hash(floor(gl_FragCoord.xy / 1.5));
  a *= 0.82 + 0.18 * g;
  a *= fondu * 0.92;
  // plus de pigment = teinte légèrement plus profonde, comme une vraie aquarelle
  vec3 teinte = couleur * (1.05 - 0.2 * m);
  gl_FragColor = vec4(teinte * a, a);
}
`;

/** Côté du canvas de l'encre, fixe : la tache est agrandie par transformation, sans réallocation. */
const TAILLE = 1024;

export class Encre {
  private gl: WebGLRenderingContext | null;
  /** deux textures : l'image précédente de la vidéo et la nouvelle, fondues à chaque affichage */
  private tex: [WebGLTexture | null, WebGLTexture | null] = [null, null];
  private courante = 0;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private video: HTMLVideoElement;
  private raf = 0;
  private jouant = false;
  ready = false;

  constructor(private canvas: HTMLCanvasElement, sources: string[]) {
    this.video = document.createElement('video');
    // WebM si le navigateur sait le lire, sinon MP4 (Safari)
    this.video.src = sources.find((s) => this.video.canPlayType(s.endsWith('.webm') ? 'video/webm' : 'video/mp4')) ?? sources[sources.length - 1];
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.preload = 'auto';
    this.video.crossOrigin = 'anonymous';
    this.video.addEventListener('canplaythrough', () => (this.ready = true), { once: true });
    this.video.load();

    this.gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true });
    const gl = this.gl;
    if (!gl) return;
    const sh = (type: number, s: string) => {
      const x = gl.createShader(type)!;
      gl.shaderSource(x, s);
      gl.compileShader(x);
      return x;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (let i = 0; i < 2; i++) {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(3));
      this.tex[i] = t;
    }
    for (const n of ['couleur', 'fondu', 'avant', 'apres', 'melange']) this.u[n] = gl.getUniformLocation(prog, n);
  }

  /**
   * Joue l'encre centrée sur (x, y) : elle part de la taille de la bulle et
   * s'étend jusqu'à couvrir l'écran. Résout quand l'encre a recouvert la vue.
   *
   * Pour que l'encre coule sans à-coups, même pendant que le profil se prépare :
   * - la croissance est confiée au compositeur du navigateur (une animation
   *   CSS de transformation), elle ne dépend pas du travail de la page ;
   * - la vidéo n'a que 24 images par seconde : à chaque affichage, les deux
   *   dernières images sont fondues l'une dans l'autre, selon le temps écoulé ;
   * - le canvas garde une taille fixe (jamais réalloué).
   */
  play(x: number, y: number, r: number, hex: string, couverture = 1500): Promise<void> {
    const gl = this.gl;
    if (!gl || !this.ready) return Promise.resolve();
    const [cr, cg, cb] = hexToRgb(hex).map((v) => v / 255);
    const diag = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) * 3;
    const c = this.canvas;
    const cote = TAILLE;
    if (c.width !== cote) {
      c.width = c.height = cote;
      gl.viewport(0, 0, cote, cote);
    }
    c.style.width = c.style.height = `${cote}px`;
    c.style.transformOrigin = '0 0';
    c.style.opacity = '1';
    c.hidden = false;
    gl.uniform3f(this.u.couleur, cr, cg, cb);
    gl.uniform1i(this.u.avant, 0);
    gl.uniform1i(this.u.apres, 1);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // la croissance, de la bulle à tout l'écran, sur le compositeur
    const place = (size: number) => `translate(${x - size / 2}px, ${y - size / 2}px) scale(${size / cote})`;
    const depart = r * 6;
    c.style.transform = place(diag);
    c.getAnimations().forEach((a) => a.cancel());
    c.animate([{ transform: place(depart) }, { transform: place(diag) }], {
      duration: 2400,
      easing: 'cubic-bezier(0.25, 0.9, 0.35, 1)',
    });

    const v = this.video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: (t: number, m: { mediaTime: number }) => void) => number };
    v.currentTime = 0;
    void v.play().catch(() => undefined);
    const t0 = performance.now();
    this.jouant = true;
    let imageLe = t0;
    let intervalle = 1000 / 24;
    let images = 0;

    const envoyer = () => {
      if (v.readyState < 2) return;
      // l'image la plus récente devient « avant », la nouvelle prend l'autre texture
      this.courante = 1 - this.courante;
      gl.activeTexture(gl.TEXTURE0 + this.courante);
      gl.bindTexture(gl.TEXTURE_2D, this.tex[this.courante]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, v);
      // les unités de texture suivent : 0 = avant, 1 = après
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex[1 - this.courante]);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.tex[this.courante]);
      const maintenant = performance.now();
      if (images > 0) intervalle = intervalle * 0.7 + Math.min(80, Math.max(16, maintenant - imageLe)) * 0.3;
      imageLe = maintenant;
      images++;
    };
    const dessiner = (now: number) => {
      // la première image n'a pas de précédente : on la montre telle quelle
      const k = images < 2 || !v.requestVideoFrameCallback ? 1 : Math.min(1, (now - imageLe) / intervalle);
      gl.uniform1f(this.u.melange, k);
      gl.uniform1f(this.u.fondu, Math.min(1, ((now - t0) / 1000) * 3));
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    // une image neuve de la vidéo → un seul envoi à la carte graphique
    const surImage = () => {
      if (!this.jouant) return;
      envoyer();
      v.requestVideoFrameCallback?.(surImage);
    };
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(surImage);

    return new Promise((resolve) => {
      window.setTimeout(resolve, couverture);
      const frame = (now: number) => {
        if (!v.requestVideoFrameCallback) envoyer();
        if (images > 0) dessiner(now);
        if (now - t0 < 4500 && this.jouant) this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    });
  }

  /** L'encre s'efface et laisse apparaître la mémoire. */
  fadeOut(): void {
    const c = this.canvas;
    c.style.opacity = '0';
    window.setTimeout(() => {
      this.jouant = false;
      cancelAnimationFrame(this.raf);
      this.video.pause();
      c.hidden = true;
    }, 1400);
  }
}
