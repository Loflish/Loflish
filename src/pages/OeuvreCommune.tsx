import { useEffect, useMemo, useRef, useState } from 'react';
import { Dock, PageTop } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { useMuseumMode } from '../lib/museum';
import { ecouterOeuvre, LONGUEUR_MAX, MONDE, traitsExemple, type Oeuvre, type Trait } from '../lib/oeuvre';
import { hashString, rng } from '../lib/random';

/**
 * L'œuvre commune — chaque personne coud un seul trait : un clic pour le
 * départ, un clic pour l'arrivée. Tous les traits, ensemble, forment une
 * broderie immense, une œuvre faite de tout le monde.
 *
 * Chaque trait est cousu au point avant, dans le fil bordeaux du logo brodé
 * de Nos mots mémoriaux : de petits points de fil, légèrement irréguliers,
 * avec leur reflet et leur ombre sur le tissu.
 */

const FIL = { r: 113, g: 42, b: 57 };
const POINT = 0.0062; // longueur d'un point, dans le monde
const ECART = 0.0026; // l'espace entre deux points

type Vue = { s: number; x: number; y: number }; // échelle (px par unité), décalage

function coudreTrait(ctx: CanvasRenderingContext2D, t: Trait, v: Vue, jusqua = 1, pale = false) {
  const ax = t.x1 * v.s + v.x;
  const ay = t.y1 * v.s + v.y;
  const bx = t.x2 * v.s + v.x;
  const by = t.y2 * v.s + v.y;
  const L = Math.hypot(bx - ax, by - ay);
  if (L < 1) return;
  const ux = (bx - ax) / L;
  const uy = (by - ay) / L;
  const pas = (POINT + ECART) * v.s;
  const long = POINT * v.s;
  const n = Math.max(1, Math.floor(L / pas));
  // un fil reste un fil : même de très près, il garde sa finesse
  const larg = Math.min(3.4, Math.max(1.1, 0.0024 * v.s));
  const r = rng(hashString(t.id));
  const fin = Math.ceil(n * jusqua);
  ctx.lineCap = 'round';
  for (let i = 0; i < fin; i++) {
    // un point de fil n'est jamais tout à fait droit ni tout à fait régulier
    const j = (r() - 0.5) * 0.35 * larg;
    const d0 = i * pas + (r() - 0.5) * 0.12 * pas;
    const d1 = Math.min(L, d0 + long * (0.88 + r() * 0.2));
    const x0 = ax + ux * d0 - uy * j;
    const y0 = ay + uy * d0 + ux * j;
    const x1 = ax + ux * d1 - uy * j;
    const y1 = ay + uy * d1 + ux * j;
    const a = pale ? 0.3 : 1;
    const k = 0.86 + r() * 0.28;
    // l'ombre du fil sur le tissu
    ctx.strokeStyle = `rgba(40,20,26,${0.16 * a})`;
    ctx.lineWidth = larg * 1.25;
    ctx.beginPath();
    ctx.moveTo(x0 + 0.5, y0 + 0.7);
    ctx.lineTo(x1 + 0.5, y1 + 0.7);
    ctx.stroke();
    // le fil
    ctx.strokeStyle = `rgba(${Math.round(FIL.r * k)},${Math.round(FIL.g * k)},${Math.round(FIL.b * k)},${a})`;
    ctx.lineWidth = larg;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    // son reflet : le fil est torsadé
    if (larg > 1.4) {
      ctx.strokeStyle = `rgba(190,120,135,${0.35 * a})`;
      ctx.lineWidth = larg * 0.32;
      ctx.beginPath();
      ctx.moveTo(x0 - uy * larg * 0.2 + ux * larg * 0.3, y0 + ux * larg * 0.2 * -1 + uy * larg * 0.3);
      ctx.lineTo(x1 - uy * larg * 0.2 - ux * larg * 0.3, y1 - ux * larg * 0.2 - uy * larg * 0.3);
      ctx.stroke();
    }
  }
}

/** Un petit nœud de départ, comme le début d'un fil. */
function noeud(ctx: CanvasRenderingContext2D, x: number, y: number, v: Vue) {
  const r = Math.max(2.2, 0.004 * v.s);
  ctx.fillStyle = `rgb(${FIL.r},${FIL.g},${FIL.b})`;
  ctx.beginPath();
  ctx.arc(x * v.s + v.x, y * v.s + v.y, r, 0, Math.PI * 2);
  ctx.fill();
}

function borne(x1: number, y1: number, x2: number, y2: number): [number, number] {
  let dx = x2 - x1;
  let dy = y2 - y1;
  const l = Math.hypot(dx, dy);
  if (l > LONGUEUR_MAX) {
    dx *= LONGUEUR_MAX / l;
    dy *= LONGUEUR_MAX / l;
  }
  return [Math.min(MONDE.l, Math.max(0, x1 + dx)), Math.min(MONDE.h, Math.max(0, y1 + dy))];
}

export function OeuvreCommune() {
  useMuseumMode('texte');
  const base = useRef<HTMLCanvasElement>(null);
  const dessus = useRef<HTMLCanvasElement>(null);
  const exemples = useMemo(() => traitsExemple(), []);
  const [oeuvre, setOeuvre] = useState<Oeuvre>({ mode: 'local', traits: [], mien: null, peutCoudre: true });
  const coudreRef = useRef<((t: Omit<Trait, 'id'>) => Promise<boolean>) | null>(null);
  const [depart, setDepart] = useState<[number, number] | null>(null);
  const [arrivee, setArrivee] = useState<[number, number] | null>(null);
  const [anim, setAnim] = useState<{ t: Trait; p: number } | null>(null);
  const vue = useRef<Vue>({ s: 1, x: 0, y: 0 });
  const survol = useRef<[number, number] | null>(null);
  const [, redessiner] = useState(0);

  useEffect(() => {
    const o = ecouterOeuvre(setOeuvre);
    coudreRef.current = o.coudre;
    return o.fin;
  }, []);

  // tous les traits : les exemples en pâle, puis ceux des personnes
  const traits = oeuvre.traits;

  const dessinerBase = () => {
    const c = base.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = c.width / c.clientWidth;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);
    const v = vue.current;
    // le cadre de l'œuvre, comme un tambour à broder
    ctx.strokeStyle = 'rgba(47,44,51,0.12)';
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1;
    ctx.strokeRect(v.x, v.y, MONDE.l * v.s, MONDE.h * v.s);
    ctx.setLineDash([]);
    for (const t of exemples) coudreTrait(ctx, t, v, 1, true);
    for (const t of traits) if (!t.moi || !anim) coudreTrait(ctx, t, v);
  };

  const dessinerDessus = () => {
    const c = dessus.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = c.width / c.clientWidth;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);
    const v = vue.current;
    if (anim) {
      coudreTrait(ctx, anim.t, v, anim.p);
      return;
    }
    if (!depart) return;
    const fin = arrivee ?? (survol.current ? borne(depart[0], depart[1], survol.current[0], survol.current[1]) : null);
    noeud(ctx, depart[0], depart[1], v);
    if (fin) {
      if (arrivee) coudreTrait(ctx, { id: 'apercu', x1: depart[0], y1: depart[1], x2: fin[0], y2: fin[1] }, v);
      else {
        // l'aperçu, avant le second clic : un fil tendu, léger
        ctx.strokeStyle = `rgba(${FIL.r},${FIL.g},${FIL.b},0.45)`;
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(depart[0] * v.s + v.x, depart[1] * v.s + v.y);
        ctx.lineTo(fin[0] * v.s + v.x, fin[1] * v.s + v.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  };

  // taille des toiles et cadrage de l'œuvre
  useEffect(() => {
    const cadrer = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const c of [base.current, dessus.current]) {
        if (!c) continue;
        c.width = Math.round(c.clientWidth * dpr);
        c.height = Math.round(c.clientHeight * dpr);
      }
      const w = base.current?.clientWidth ?? window.innerWidth;
      const h = base.current?.clientHeight ?? window.innerHeight;
      const s = Math.min(w / MONDE.l, (h - 40) / MONDE.h) * 0.9;
      vue.current = { s, x: (w - MONDE.l * s) / 2, y: (h - MONDE.h * s) / 2 + 12 };
      redessiner((n) => n + 1);
    };
    cadrer();
    window.addEventListener('resize', cadrer);
    return () => window.removeEventListener('resize', cadrer);
  }, []);

  useEffect(dessinerBase);
  useEffect(dessinerDessus);

  // l'aiguille coud le trait, point par point
  useEffect(() => {
    if (!anim || anim.p >= 1) return;
    const id = requestAnimationFrame(() => setAnim((a) => (a ? { ...a, p: Math.min(1, a.p + 0.018) } : a)));
    return () => cancelAnimationFrame(id);
  }, [anim]);
  useEffect(() => {
    if (anim && anim.p >= 1) {
      const t = window.setTimeout(() => setAnim(null), 400);
      return () => window.clearTimeout(t);
    }
  }, [anim]);

  // ——— interactions : cliquer (poser), glisser (se déplacer), molette ou pincer (s'approcher)
  const pointeurs = useRef(new Map<number, { x: number; y: number }>());
  const geste = useRef<{ x: number; y: number; bouge: boolean; d?: number } | null>(null);
  const versMonde = (cx: number, cy: number): [number, number] => {
    const r = dessus.current!.getBoundingClientRect();
    const v = vue.current;
    return [(cx - r.left - v.x) / v.s, (cy - r.top - v.y) / v.s];
  };
  const zoomer = (f: number, cx: number, cy: number) => {
    const r = dessus.current!.getBoundingClientRect();
    const v = vue.current;
    const w = r.width;
    const h = r.height;
    const fit = Math.min(w / MONDE.l, (h - 40) / MONDE.h) * 0.9;
    const s = Math.min(fit * 10, Math.max(fit * 0.8, v.s * f));
    const px = cx - r.left;
    const py = cy - r.top;
    vue.current = { s, x: px - ((px - v.x) * s) / v.s, y: py - ((py - v.y) * s) / v.s };
    redessiner((n) => n + 1);
  };
  const peutPoser = !oeuvre.mien && oeuvre.peutCoudre && !arrivee && !anim;

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointeurs.current.size === 2) {
      const [a, b] = [...pointeurs.current.values()];
      geste.current = { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2, bouge: true, d: Math.hypot(a!.x - b!.x, a!.y - b!.y) };
    } else geste.current = { x: e.clientX, y: e.clientY, bouge: false };
  };
  const onMove = (e: React.PointerEvent) => {
    survol.current = versMonde(e.clientX, e.clientY);
    const p = pointeurs.current.get(e.pointerId);
    const g = geste.current;
    if (p && g) {
      if (pointeurs.current.size === 2 && g.d) {
        pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [a, b] = [...pointeurs.current.values()];
        const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        zoomer(d / g.d, g.x, g.y);
        g.d = d;
        return;
      }
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      if (g.bouge || Math.hypot(e.clientX - g.x, e.clientY - g.y) > 6) {
        g.bouge = true;
        vue.current = { ...vue.current, x: vue.current.x + dx, y: vue.current.y + dy };
        redessiner((n) => n + 1);
      }
      pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    } else if (depart && !arrivee) dessinerDessus();
  };
  const onUp = (e: React.PointerEvent) => {
    const g = geste.current;
    pointeurs.current.delete(e.pointerId);
    if (pointeurs.current.size) return;
    geste.current = null;
    if (!g || g.bouge || !peutPoser) return;
    const [x, y] = versMonde(e.clientX, e.clientY);
    if (x < 0 || y < 0 || x > MONDE.l || y > MONDE.h) return;
    if (!depart) setDepart([x, y]);
    else setArrivee(borne(depart[0], depart[1], x, y));
  };

  const recommencer = () => {
    setDepart(null);
    setArrivee(null);
  };
  const valider = async () => {
    if (!depart || !arrivee || !coudreRef.current) return;
    const t = { x1: depart[0], y1: depart[1], x2: arrivee[0], y2: arrivee[1] };
    const ok = await coudreRef.current(t);
    setDepart(null);
    setArrivee(null);
    if (ok) setAnim({ t: { id: 'mien', ...t, moi: true }, p: 0 });
  };

  const n = traits.length;
  const consigne = oeuvre.mien
    ? 'Ton trait est cousu. Il fait partie de l’œuvre, pour toujours. Merci.'
    : !oeuvre.peutCoudre
      ? 'Ton accès à cette page permet de regarder l’œuvre, pas d’y coudre.'
      : arrivee
        ? 'Ce trait sera le tien, pour toujours : un seul par personne, et il ne s’efface pas.'
        : depart
          ? 'Clique à un autre endroit pour y mener ton fil.'
          : 'Clique pour poser le début de ton trait.';

  return (
    <div className="oeuvre">
      <div className="oeuvre-haut">
        <PageTop />
      </div>
      <canvas ref={base} className="oeuvre-toile" aria-hidden="true" />
      <canvas
        ref={dessus}
        className={`oeuvre-toile oeuvre-dessus${peutPoser ? ' peut-poser' : ''}`}
        role="img"
        aria-label={`L’œuvre commune : ${n} trait${n > 1 ? 's' : ''} cousu${n > 1 ? 's' : ''}.`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={(e) => zoomer(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY)}
      />
      <section className="oeuvre-panneau" aria-live="polite">
        <h1 className="oeuvre-titre">L’œuvre commune</h1>
        <p className="oeuvre-texte">Chaque personne coud un seul trait. Ensemble, nous brodons une œuvre immense, faite de tout le monde.</p>
        <p className="oeuvre-consigne">{consigne}</p>
        {arrivee && (
          <div className="oeuvre-actions">
            <button className="bouton" onClick={valider}>
              <Icon name="aiguille" size={18} /> Coudre mon trait
            </button>
            <button className="lien-discret" onClick={recommencer}>
              Recommencer
            </button>
          </div>
        )}
        {depart && !arrivee && (
          <button className="lien-discret petit" onClick={recommencer}>
            Annuler
          </button>
        )}
        <p className="oeuvre-compte">
          {n.toLocaleString('fr-FR')} trait{n > 1 ? 's' : ''} cousu{n > 1 ? 's' : ''}
          {oeuvre.mode === 'local' ? ' sur cet appareil' : ''} · en pâle, des traits d’exemple le temps que l’œuvre commence
        </p>
      </section>
      <p className="oeuvre-aide" aria-hidden="true">
        Glisser pour se déplacer · molette ou pincer pour s’approcher
      </p>
      <Dock />
    </div>
  );
}
