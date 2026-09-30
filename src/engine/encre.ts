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
uniform sampler2D tex;
uniform vec3 couleur;
uniform float fondu;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main(){
  // la vidéo est un masque : blanc = encre (tache filmée, trame du tissu retirée)
  float m = texture2D(tex, uv).r;
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

export class Encre {
  private gl: WebGLRenderingContext | null;
  private tex: WebGLTexture | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private video: HTMLVideoElement;
  private raf = 0;
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
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    for (const n of ['couleur', 'fondu', 'tex']) this.u[n] = gl.getUniformLocation(prog, n);
  }

  /**
   * Joue l'encre centrée sur (x, y) : elle part de la taille de la bulle et
   * s'étend jusqu'à couvrir l'écran. Résout quand l'encre a recouvert la vue.
   */
  play(x: number, y: number, r: number, hex: string, couverture = 1500): Promise<void> {
    const gl = this.gl;
    if (!gl || !this.ready) return Promise.resolve();
    const [cr, cg, cb] = hexToRgb(hex).map((v) => v / 255);
    const diag = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) * 2.6;
    const c = this.canvas;
    c.style.left = '0px';
    c.style.top = '0px';
    c.style.opacity = '1';
    c.hidden = false;
    this.video.currentTime = 0;
    void this.video.play().catch(() => undefined);
    const t0 = performance.now();
    return new Promise((resolve) => {
      let done = false;
      const frame = (now: number) => {
        const t = (now - t0) / 1000;
        // la vignette grandit doucement : de la bulle à tout l'écran
        const k = Math.min(1, t / 2.2);
        const ease = 1 - Math.pow(1 - k, 3);
        const size = Math.max(r * 6, r * 6 + (diag - r * 6) * ease);
        const px = Math.round(Math.min(size, 1400));
        if (c.width !== px) {
          c.width = c.height = px;
          gl.viewport(0, 0, px, px);
        }
        c.style.width = c.style.height = `${size}px`;
        c.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px)`;
        if (this.video.readyState >= 2) {
          gl.bindTexture(gl.TEXTURE_2D, this.tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.video);
          gl.uniform3f(this.u.couleur, cr, cg, cb);
          gl.uniform1f(this.u.fondu, Math.min(1, t * 3));
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        if (!done && now - t0 > couverture) {
          done = true;
          resolve();
        }
        if (t < 4.5) this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    });
  }

  /** L'encre s'efface et laisse apparaître la mémoire. */
  fadeOut(): void {
    const c = this.canvas;
    c.style.opacity = '0';
    window.setTimeout(() => {
      cancelAnimationFrame(this.raf);
      this.video.pause();
      c.hidden = true;
    }, 1400);
  }
}
