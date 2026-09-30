/**
 * Fond vivant — papier de lin + nappes de pigment qui respirent.
 *
 * Monet : lumière, air, diffusion, contours qui se perdent.
 * Le fond reste très clair (écru / lin / ivoire légèrement grisé) ;
 * les nappes sont absorbées par la fibre, jamais des dégradés lisses.
 * Le mouvement est si lent qu'on le sent plus qu'on ne le voit.
 *
 * Rendu en basse résolution et à cadence réduite : le fond est flou par
 * nature. La fibre du lin et le grain, eux, sont une texture fixe en pleine
 * résolution (paperTexture), superposée en CSS.
 */

const VERT = `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uCalm; // zone calme autour du logo : x, y, rayon (px)
uniform float uScale;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++){ v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}

// Une nappe de pigment : masque issu d'un bruit déformé, bord légèrement chargé.
vec3 wash(vec3 col, vec2 uv, vec2 off, float sc, float t, vec3 pig, float amount, float th){
  vec2 q = uv * sc + off;
  vec2 w = vec2(fbm(q + vec2(0.0, t)), fbm(q + vec2(5.2, -t * 0.8) + 1.3));
  float f = fbm(q + 1.7 * w + vec2(t * 0.35, -t * 0.2));
  float m = smoothstep(th, th + 0.2, f);
  float rim = smoothstep(th, th + 0.035, f) - smoothstep(th + 0.035, th + 0.14, f);
  float gran = 0.75 + 0.5 * noise(gl_FragCoord.xy * uScale * 0.9);
  float a = clamp((m * 0.85 + rim * 0.55) * amount * gran, 0.0, 1.0);
  return col * mix(vec3(1.0), pig, a);
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes.y;
  float t = uTime;

  // papier de lin
  vec3 col = vec3(0.925, 0.914, 0.886);
  float mottle = noise(uv * 4.0) + noise(uv * 9.0) * 0.5 - 0.75;
  col += mottle * 0.016;

  // zone calme : le logo brodé doit se détacher immédiatement
  vec2 calmP = vec2(uCalm.x, uRes.y - uCalm.y);
  float calm = smoothstep(uCalm.z * 0.6, uCalm.z * 1.6, distance(frag, calmP));
  float k = uIntensity * mix(0.25, 1.0, calm);

  // atmosphère : lavande, eau, pêche, rose, lumière jaune
  col = wash(col, uv, vec2(0.0, 0.0), 0.9, t * 0.011, vec3(0.84, 0.86, 0.96), 0.48 * k, 0.53);
  col = wash(col, uv, vec2(7.3, 2.1), 0.75, t * 0.009, vec3(0.84, 0.93, 0.88), 0.42 * k, 0.55);
  col = wash(col, uv, vec2(3.1, 9.4), 1.1, t * 0.013, vec3(0.99, 0.88, 0.82), 0.42 * k, 0.56);
  col = wash(col, uv, vec2(11.7, 5.5), 0.85, t * 0.010, vec3(0.97, 0.86, 0.90), 0.38 * k, 0.57);
  col = wash(col, uv, vec2(2.4, 13.3), 1.3, t * 0.012, vec3(0.99, 0.95, 0.80), 0.40 * k, 0.55);

  // lumière de Monet : une clarté chaude qui se déplace lentement
  vec2 lp = vec2(0.5 + 0.35 * sin(t * 0.004), 0.55 + 0.25 * cos(t * 0.0031)) * vec2(uRes.x / uRes.y, 1.0);
  float light = exp(-pow(distance(uv, lp) * 1.4, 2.0));
  col = mix(col, vec3(0.985, 0.972, 0.945), light * 0.22 * uIntensity);


  gl_FragColor = vec4(col, 1.0);
}
`;

export class Atmosphere {
  private gl: WebGLRenderingContext | null;
  private prog: WebGLProgram | null = null;
  private raf = 0;
  private last = 0;
  private start = performance.now();
  private intensity = 1;
  private targetIntensity = 1;
  private calm: [number, number, number] = [110, 90, 140];
  private still = false;
  private paused = false;
  private scale = 0.34;
  private u: Record<string, WebGLUniformLocation | null> = {};

  constructor(private canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!this.gl) return;
    const gl = this.gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    this.prog = prog;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['uRes', 'uTime', 'uIntensity', 'uCalm', 'uScale']) this.u[n] = gl.getUniformLocation(prog, n);
    // démarre à un instant différent à chaque visite : le tableau n'est jamais deux fois le même
    this.start -= Math.random() * 600000;
  }

  get supported(): boolean {
    return !!this.gl && !!this.prog;
  }

  resize(): void {
    const w = Math.max(1, Math.round(window.innerWidth * this.scale));
    const h = Math.max(1, Math.round(window.innerHeight * this.scale));
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl?.viewport(0, 0, w, h);
    this.draw(performance.now());
  }

  setIntensity(v: number): void {
    this.targetIntensity = v;
  }

  setCalmZone(x: number, y: number, r: number): void {
    this.calm = [x * this.scale, y * this.scale, r * this.scale];
  }

  /** Hors de la constellation, le shader ne tourne plus du tout. */
  pause(p: boolean): void {
    this.paused = p;
  }

  setStill(still: boolean): void {
    this.still = still;
    if (still) {
      this.intensity = this.targetIntensity;
      this.draw(performance.now());
    }
  }

  private draw(now: number): void {
    const gl = this.gl;
    if (!gl || !this.prog) return;
    gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.uTime, (now - this.start) / 1000);
    gl.uniform1f(this.u.uIntensity, this.intensity);
    gl.uniform3f(this.u.uCalm, this.calm[0], this.calm[1], this.calm[2]);
    gl.uniform1f(this.u.uScale, this.scale);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  run(): void {
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const settling = Math.abs(this.intensity - this.targetIntensity) > 0.002;
      // ~20 images/s suffisent pour un mouvement aussi lent
      if (this.paused || document.hidden) return;
      if (now - this.last < 50) return;
      if (this.still && !settling) return;
      this.intensity += (this.targetIntensity - this.intensity) * 0.08;
      this.last = now;
      this.draw(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
  }
}

/**
 * Fibre du lin + grain très fin, générés une fois en pleine résolution.
 * Ressentis plus que remarqués.
 */
export function paperTexture(size = 256): string {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(size, size);
  const rowN = Array.from({ length: size }, () => Math.random());
  const colN = Array.from({ length: size }, () => Math.random());
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // trame : fils horizontaux et verticaux irréguliers + grain
      const weave = (rowN[y] - 0.5) * 0.55 + (colN[x] - 0.5) * 0.45;
      const grain = Math.random() - 0.5;
      const v = weave * 0.6 + grain * 0.4;
      const a = Math.abs(v) * 30;
      const shade = v > 0 ? 255 : 40;
      img.data[i] = shade;
      img.data[i + 1] = shade;
      img.data[i + 2] = shade - (v > 0 ? 8 : 0);
      img.data[i + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}
