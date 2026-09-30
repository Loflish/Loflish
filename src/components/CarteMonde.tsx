import { geoEqualEarth, geoPath } from 'd3-geo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import world110 from 'world-atlas/countries-110m.json';
import { allTraces } from '../data/store';
import type { Trace } from '../data/types';
import { bubbleDataUrl } from '../engine/bubbleSprite';
import { HD, HD_FILES } from '../lib/hd';
import { colorById, hexToRgb } from '../lib/palette';
import { Icon } from './Icon';

/**
 * Carte du monde peinte — à la manière des Nabis : grands aplats de couleur,
 * contours tracés à la main, un motif décoratif discret sur les eaux.
 * Aucune compétition : on montre qui est là, jamais un classement.
 *
 * On s'y promène tranquillement : glisser pour se déplacer, molette, pincement
 * ou boutons pour s'approcher, de la vue du monde entier jusqu'à l'échelle d'un
 * pays (×6 au plus). De près, un tracé plus fin des côtes prend le relais.
 */

// noms français du prototype → noms anglais de world-atlas
const EN: Record<string, string> = {
  France: 'France', Belgique: 'Belgium', Suisse: 'Switzerland', Canada: 'Canada', 'Québec — Canada': 'Canada',
  Maroc: 'Morocco', Algérie: 'Algeria', Tunisie: 'Tunisia', Sénégal: 'Senegal', 'Côte d’Ivoire': "Côte d'Ivoire",
  Cameroun: 'Cameroon', Italie: 'Italy', Espagne: 'Spain', Portugal: 'Portugal', Allemagne: 'Germany', Pologne: 'Poland',
  'Royaume-Uni': 'United Kingdom', Irlande: 'Ireland', Japon: 'Japan', 'Corée du Sud': 'South Korea', 'Viêt Nam': 'Vietnam',
  Inde: 'India', Brésil: 'Brazil', Mexique: 'Mexico', Argentine: 'Argentina', Chili: 'Chile', 'États-Unis': 'United States of America',
  Liban: 'Lebanon', Turquie: 'Turkey', Grèce: 'Greece', Suède: 'Sweden', Norvège: 'Norway', Madagascar: 'Madagascar', Haïti: 'Haiti',
};

const W = 1000;
const H = 520;
const K_MAX = 6;
/** Au-delà de ce zoom, le tracé fin (1/50 000 000) remplace le tracé simplifié. */
const K_DETAIL = 2.2;

type Vue = { k: number; x: number; y: number };
type Topo = Topology<{ countries: GeometryCollection<{ name: string }> }>;

function soften(hex: string, k = 0.55): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number, base: number) => Math.round(c * (1 - k) + base * k);
  return `rgb(${mix(r, 236)}, ${mix(g, 233)}, ${mix(b, 226)})`;
}

/** La carte ne quitte jamais le cadre : pas de vide autour du monde. */
function borner(v: Vue): Vue {
  const k = Math.min(K_MAX, Math.max(1, v.k));
  return { k, x: Math.min(0, Math.max(W - W * k, v.x)), y: Math.min(0, Math.max(H - H * k, v.y)) };
}

const projection = geoEqualEarth().fitExtent(
  [
    [8, 8],
    [W - 8, H - 8],
  ],
  { type: 'Sphere' },
);
const path = geoPath(projection);

/**
 * Cadre d'un pays pour s'en approcher : sa plus grande terre seulement (la France
 * sans la Guyane, les États-Unis sans l'Alaska…), sinon on cadrerait un océan.
 */
function cadrePrincipal(f: GeoJSON.Feature): [[number, number], [number, number]] {
  const g = f.geometry;
  if (g?.type !== 'MultiPolygon') return path.bounds(f);
  let best: GeoJSON.Polygon | null = null;
  let aire = -1;
  for (const coords of g.coordinates) {
    const p: GeoJSON.Polygon = { type: 'Polygon', coordinates: coords };
    const a = path.area(p);
    if (a > aire) {
      aire = a;
      best = p;
    }
  }
  return best ? path.bounds(best) : path.bounds(f);
}

export function CarteMonde() {
  const [actif, setActif] = useState<string | null>(null);
  const [vue, setVue] = useState<Vue>({ k: 1, x: 0, y: 0 });
  const [topo, setTopo] = useState<Topo>(world110 as unknown as Topo);
  const svgRef = useRef<SVGSVGElement>(null);
  const anim = useRef(0);
  const vueRef = useRef(vue);
  vueRef.current = vue;

  // de près, le tracé fin des côtes, chargé une seule fois et seulement si l'on s'approche
  const detail = vue.k >= K_DETAIL;
  useEffect(() => {
    if (!detail || topo !== (world110 as unknown)) return;
    let vivant = true;
    void import('world-atlas/countries-50m.json').then((m) => vivant && setTopo((m.default ?? m) as unknown as Topo));
    return () => {
      vivant = false;
    };
  }, [detail, topo]);

  const pays = useMemo(() => {
    const byEn = new Map<string, { fr: string; traces: Trace[] }>();
    for (const t of allTraces()) {
      if (!t.pays) continue;
      const en = EN[t.pays];
      if (!en) continue;
      const cur = byEn.get(en) ?? { fr: t.pays.replace('Québec — ', ''), traces: [] };
      cur.traces.push(t);
      byEn.set(en, cur);
    }
    return byEn;
  }, []);

  const bubbles = useMemo(() => {
    const m = new Map<string, string>();
    for (const [, v] of pays) for (const t of v.traces.slice(0, 3)) m.set(t.id, bubbleDataUrl(t.id, colorById(t.couleur).hex, 96, t.matiere));
    return m;
  }, [pays]);

  const { list, sphere } = useMemo(() => {
    const fc = feature(topo, topo.objects.countries);
    return {
      list: fc.features.map((f) => ({
        name: (f.properties as { name: string }).name,
        d: path(f) ?? '',
        c: path.centroid(f),
        b: cadrePrincipal(f),
      })),
      sphere: path({ type: 'Sphere' }) ?? '',
    };
  }, [topo]);

  /** Glissement doux vers une vue (bouton, choix d'un pays). */
  const allerA = useCallback((cible: Vue, duree = 700) => {
    cancelAnimationFrame(anim.current);
    const de = vueRef.current;
    const vers = borner(cible);
    const t0 = performance.now();
    const pas = (now: number) => {
      const t = Math.min(1, (now - t0) / duree);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setVue({ k: de.k + (vers.k - de.k) * e, x: de.x + (vers.x - de.x) * e, y: de.y + (vers.y - de.y) * e });
      if (t < 1) anim.current = requestAnimationFrame(pas);
    };
    anim.current = requestAnimationFrame(pas);
  }, []);

  /** Zoom autour d'un point de la carte (coordonnées du viewBox). */
  const zoomer = useCallback((facteur: number, px = W / 2, py = H / 2, doux = false) => {
    const v = vueRef.current;
    const k = Math.min(K_MAX, Math.max(1, v.k * facteur));
    const cible = { k, x: px - ((px - v.x) * k) / v.k, y: py - ((py - v.y) * k) / v.k };
    if (doux) allerA(cible, 450);
    else {
      cancelAnimationFrame(anim.current);
      setVue(borner(cible));
    }
  }, [allerA]);

  // souris → coordonnées du viewBox
  const versCarte = (cx: number, cy: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((cx - r.left) / r.width) * W, y: ((cy - r.top) / r.height) * H };
  };

  // molette (non passive, pour ne pas faire défiler la page pendant qu'on zoome)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      const v = vueRef.current;
      // à l'échelle du monde, faire défiler vers le bas laisse la page défiler
      if (v.k <= 1 && e.deltaY > 0) return;
      e.preventDefault();
      const p = versCarte(e.clientX, e.clientY);
      zoomer(Math.exp(-e.deltaY * 0.0022), p.x, p.y);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoomer]);

  // glisser (un doigt ou la souris), pincer (deux doigts)
  const pointeurs = useRef(new Map<number, { x: number; y: number }>());
  const geste = useRef<{ bouge: boolean; dist?: number }>({ bouge: false });
  const onPointerDown = (e: React.PointerEvent) => {
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    geste.current = { bouge: false };
    cancelAnimationFrame(anim.current);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const avant = pointeurs.current.get(e.pointerId);
    if (!avant) return;
    const r = svgRef.current!.getBoundingClientRect();
    const s = W / r.width;
    if (pointeurs.current.size === 2) {
      const [a, b] = [...pointeurs.current.values()];
      const autre = a === avant ? b : a;
      const dist = Math.hypot(e.clientX - autre.x, e.clientY - autre.y);
      if (geste.current.dist) {
        const m = versCarte((e.clientX + autre.x) / 2, (e.clientY + autre.y) / 2);
        zoomer(dist / geste.current.dist, m.x, m.y);
      }
      geste.current = { bouge: true, dist };
    } else {
      const dx = (e.clientX - avant.x) * s;
      const dy = (e.clientY - avant.y) * s;
      if (Math.abs(dx) + Math.abs(dy) > 0.5) {
        if (!geste.current.bouge && Math.hypot(dx, dy) < 3) return;
        geste.current.bouge = true;
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        setVue((v) => borner({ ...v, x: v.x + dx, y: v.y + dy }));
      }
    }
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointeurs.current.delete(e.pointerId);
    if (pointeurs.current.size < 2) geste.current.dist = undefined;
  };

  /** Choisir un pays : la carte s'approche doucement de lui. */
  const choisir = (name: string, b: [[number, number], [number, number]]) => {
    if (geste.current.bouge) return; // c'était un glissement, pas un choix
    setActif(name);
    const [[x0, y0], [x1, y1]] = b;
    const k = Math.min(4, Math.max(1.6, 0.6 * Math.min(W / Math.max(1, x1 - x0), H / Math.max(1, y1 - y0))));
    allerA({ k, x: W / 2 - ((x0 + x1) / 2) * k, y: H / 2 - ((y0 + y1) / 2) * k });
  };

  const sel = actif ? pays.get(actif) : null;
  const taille = 18 / Math.sqrt(vue.k); // les bulles grandissent à peine quand on s'approche

  return (
    <div className="carte-monde">
      <div className="carte-cadre">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={`carte-svg${vue.k > 1 ? ' is-zoom' : ''}`}
          role="img"
          aria-label="Carte du monde des présences"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <defs>
            <filter id="trait-main" x="-2%" y="-2%" width="104%" height="104%">
              <feTurbulence type="fractalNoise" baseFrequency={0.04 * vue.k} numOctaves="2" seed="4" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={2.2 / vue.k} xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="aplat-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="9" result="g" />
              <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.5 1.05" result="ga" />
              <feComposite in="SourceGraphic" in2="ga" operator="in" />
            </filter>
            {HD && (
              <pattern id="eau-peinte" patternUnits="userSpaceOnUse" width={W} height={H}>
                <image href={HD_FILES.eau} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
              </pattern>
            )}
            {/* motif des eaux : petites vagues décoratives, très discrètes */}
            <pattern id="eaux" width="26" height="14" patternUnits="userSpaceOnUse" patternTransform={`scale(${1 / vue.k})`}>
              <path d="M1 9 q 5 -5 11 0 t 11 0" fill="none" stroke="rgba(87,83,92,0.13)" strokeWidth="0.8" strokeLinecap="round" />
            </pattern>
          </defs>
          <g transform={`translate(${vue.x} ${vue.y}) scale(${vue.k})`}>
            <path d={sphere} fill="rgb(214, 227, 224)" filter="url(#aplat-grain)" />
            {HD && <path d={sphere} fill="url(#eau-peinte)" opacity={0.85} />}
            <path d={sphere} fill="url(#eaux)" />
            <g filter="url(#trait-main)">
              {list.map((p) => {
                const here = pays.get(p.name);
                const fill = here ? soften(colorById(here.traces[0].couleur).hex) : 'rgb(238, 234, 226)';
                return (
                  <path
                    key={p.name + p.d.length}
                    d={p.d}
                    fill={fill}
                    stroke="rgba(47, 44, 51, 0.55)"
                    strokeWidth={0.6}
                    vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round"
                    className={here ? `pays-actif${actif === p.name ? ' is-on' : ''}` : undefined}
                    tabIndex={here ? 0 : undefined}
                    role={here ? 'button' : undefined}
                    aria-label={here ? `${here.fr} : ${here.traces.length} présence${here.traces.length > 1 ? 's' : ''}` : undefined}
                    onClick={here ? () => choisir(p.name, p.b) : undefined}
                    onKeyDown={here ? (e) => (e.key === 'Enter' || e.key === ' ') && choisir(p.name, p.b) : undefined}
                  />
                );
              })}
            </g>
            {list.map((p) => {
              const here = pays.get(p.name);
              if (!here || !Number.isFinite(p.c[0])) return null;
              return here.traces.slice(0, 3).map((t, i) => (
                <image
                  key={t.id}
                  href={bubbles.get(t.id)}
                  x={p.c[0] - taille / 2 + ((i - 1) * taille * 7) / 18}
                  y={p.c[1] - taille / 2 + ((i % 2) * taille * 3) / 18}
                  width={taille}
                  height={taille}
                  style={{ mixBlendMode: 'multiply', pointerEvents: 'none' }}
                />
              ));
            })}
          </g>
        </svg>
        <div className="carte-zoom" role="group" aria-label="S’approcher ou s’éloigner">
          <button className="icon-btn" onClick={() => zoomer(1.6, W / 2, H / 2, true)} disabled={vue.k >= K_MAX} aria-label="S’approcher">
            <Icon name="plus" size={18} />
          </button>
          <button className="icon-btn" onClick={() => zoomer(1 / 1.6, W / 2, H / 2, true)} disabled={vue.k <= 1} aria-label="S’éloigner">
            <span className="carte-moins" aria-hidden="true" />
          </button>
          {vue.k > 1.02 && (
            <button className="lien-discret petit" onClick={() => allerA({ k: 1, x: 0, y: 0 })}>
              Le monde entier
            </button>
          )}
        </div>
      </div>

      <div className="carte-panneau" aria-live="polite">
        {sel ? (
          <>
            <p className="carte-pays">{sel.fr}</p>
            <ul className="carte-noms">
              {sel.traces.map((t) => (
                <li key={t.id}>
                  <Link to={`/trace/${t.id}`}>{t.nom}</Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted">Touche un pays coloré pour rencontrer celles et ceux qui y ont laissé leur trace. Glisse pour te déplacer, approche-toi pour voir de plus près.</p>
        )}
      </div>
    </div>
  );
}
