import { geoEqualEarth, geoPath } from 'd3-geo';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';
import { allTraces } from '../data/store';
import type { Trace } from '../data/types';
import { bubbleDataUrl } from '../engine/bubbleSprite';
import { HD, HD_FILES } from '../lib/hd';
import { colorById, hexToRgb } from '../lib/palette';

/**
 * Carte du monde peinte — à la manière des Nabis : grands aplats de couleur,
 * contours tracés à la main, un motif décoratif discret sur les eaux.
 * Aucune compétition : on montre qui est là, jamais un classement.
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

function soften(hex: string, k = 0.55): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number, base: number) => Math.round(c * (1 - k) + base * k);
  return `rgb(${mix(r, 236)}, ${mix(g, 233)}, ${mix(b, 226)})`;
}

export function CarteMonde() {
  const [actif, setActif] = useState<string | null>(null);

  const { pays, paths, bubbles } = useMemo(() => {
    const byEn = new Map<string, { fr: string; traces: Trace[] }>();
    for (const t of allTraces()) {
      if (!t.pays) continue;
      const en = EN[t.pays];
      if (!en) continue;
      const cur = byEn.get(en) ?? { fr: t.pays.replace('Québec — ', ''), traces: [] };
      cur.traces.push(t);
      byEn.set(en, cur);
    }
    const topo = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
    const fc = feature(topo, topo.objects.countries);
    const projection = geoEqualEarth().fitExtent(
      [
        [8, 8],
        [W - 8, H - 8],
      ],
      { type: 'Sphere' },
    );
    const path = geoPath(projection);
    const paths = fc.features.map((f) => ({
      name: (f.properties as { name: string }).name,
      d: path(f) ?? '',
      c: path.centroid(f),
    }));
    const sphere = path({ type: 'Sphere' }) ?? '';
    const bubbles = new Map<string, string>();
    for (const [, v] of byEn) for (const t of v.traces.slice(0, 3)) bubbles.set(t.id, bubbleDataUrl(t.id, colorById(t.couleur).hex, 64));
    return { pays: byEn, paths: { list: paths, sphere }, bubbles };
  }, []);

  const sel = actif ? pays.get(actif) : null;

  return (
    <div className="carte-monde">
      <svg viewBox={`0 0 ${W} ${H}`} className="carte-svg" role="img" aria-label="Carte du monde des présences">
        <defs>
          <filter id="trait-main" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
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
          <pattern id="eaux" width="26" height="14" patternUnits="userSpaceOnUse">
            <path d="M1 9 q 5 -5 11 0 t 11 0" fill="none" stroke="rgba(87,83,92,0.13)" strokeWidth="0.8" strokeLinecap="round" />
          </pattern>
        </defs>
        <path d={paths.sphere} fill="rgb(214, 227, 224)" filter="url(#aplat-grain)" />
        {HD && <path d={paths.sphere} fill="url(#eau-peinte)" opacity={0.85} />}
        <path d={paths.sphere} fill="url(#eaux)" />
        <g filter="url(#trait-main)">
          {paths.list.map((p) => {
            const here = pays.get(p.name);
            const fill = here ? soften(colorById(here.traces[0].couleur).hex) : 'rgb(238, 234, 226)';
            return (
              <path
                key={p.name + p.d.length}
                d={p.d}
                fill={fill}
                stroke="rgba(47, 44, 51, 0.55)"
                strokeWidth={0.6}
                strokeLinejoin="round"
                className={here ? `pays-actif${actif === p.name ? ' is-on' : ''}` : undefined}
                tabIndex={here ? 0 : undefined}
                role={here ? 'button' : undefined}
                aria-label={here ? `${here.fr} : ${here.traces.length} présence${here.traces.length > 1 ? 's' : ''}` : undefined}
                onClick={here ? () => setActif(p.name) : undefined}
                onKeyDown={here ? (e) => (e.key === 'Enter' || e.key === ' ') && setActif(p.name) : undefined}
              />
            );
          })}
        </g>
        {paths.list.map((p) => {
          const here = pays.get(p.name);
          if (!here || !Number.isFinite(p.c[0])) return null;
          return here.traces.slice(0, 3).map((t, i) => (
            <image
              key={t.id}
              href={bubbles.get(t.id)}
              x={p.c[0] - 9 + (i - 1) * 7}
              y={p.c[1] - 9 + (i % 2) * 3}
              width={18}
              height={18}
              style={{ mixBlendMode: 'multiply', pointerEvents: 'none' }}
            />
          ));
        })}
      </svg>

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
          <p className="muted">Touche un pays coloré pour rencontrer celles et ceux qui y ont laissé leur trace.</p>
        )}
      </div>
    </div>
  );
}
