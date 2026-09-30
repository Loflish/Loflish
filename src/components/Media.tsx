import { useMemo } from 'react';
import type { Media } from '../data/types';
import { APLATS, HD, MOTIFS, type FormeAplat, type Motif } from '../lib/hd';
import { hashString, rng } from '../lib/random';
import { Icon } from './Icon';

/**
 * Les vrais souvenirs restent authentiques : aucun filtre aquarelle, aucun
 * sépia. Dans ce prototype, il n'y a pas de vraies photos : chaque média est
 * un emplacement sobre, légendé comme un cartel de musée.
 */
export function MediaThumb({ m, size = 'm' }: { m: Media; size?: 's' | 'm' | 'l' }) {
  const label = { image: 'Photographie', video: 'Vidéo', audio: 'Enregistrement', document: 'Document', lien: 'Lien' }[m.kind];
  return (
    <figure className={`media media-${m.kind} media-${size}`}>
      <div className="media-surface" style={{ ['--teinte' as string]: m.teinte ?? '#DDD8CE' }}>
        {m.kind === 'image' && m.src && <img className="media-img" src={m.src} alt={m.legende || m.titre} loading="lazy" />}
        {m.kind === 'image' && !m.src && <span className="media-placeholder">emplacement photo</span>}
        {m.kind === 'video' && (
          <span className="media-play" aria-hidden="true">
            <Icon name="play" size={size === 's' ? 16 : 22} />
          </span>
        )}
        {m.kind === 'audio' && <Waveform seed={m.id} />}
        {m.kind === 'document' && <Icon name="document" size={size === 's' ? 22 : 30} />}
        {m.kind === 'lien' && <Icon name="lien" size={size === 's' ? 20 : 26} />}
        {m.duree && <span className="media-duree">{m.duree}</span>}
      </div>
      {size !== 's' && (
        <figcaption>
          <span className="media-kind">{label}</span> {m.titre}
          {m.legende && size === 'l' && <span className="media-legende">{m.legende}</span>}
        </figcaption>
      )}
      {size === 's' && <figcaption className="sr-only">{`${label} : ${m.titre}`}</figcaption>}
    </figure>
  );
}

function Waveform({ seed }: { seed: string }) {
  const bars = useMemo(() => {
    const r = rng(hashString(seed));
    return Array.from({ length: 28 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 0.7 + r() * 2)) * 0.6 + r() * 0.15);
  }, [seed]);
  return (
    <span className="waveform" aria-hidden="true">
      {bars.map((h, i) => (
        <span key={i} style={{ height: `${Math.min(1, h) * 100}%` }} />
      ))}
    </span>
  );
}

/**
 * Aplat — surface picturale d'inspiration nabie : une couleur plate,
 * un bord qui n'est pas tiré à la règle, un peu de pigment dans la fibre.
 * En HD, la forme vient d'une vraie gouache (masque) remplie de la couleur,
 * avec au besoin un motif textile discret dans un ton voisin.
 */
export function Aplat({
  color,
  seed,
  className = '',
  forme,
  motif,
}: {
  color: string;
  seed: string;
  className?: string;
  forme?: FormeAplat;
  motif?: Motif;
}) {
  if (HD) return <AplatPeint color={color} seed={seed} className={className} forme={forme} motif={motif} />;
  return <AplatSvg color={color} seed={seed} className={className} />;
}

function AplatPeint({ color, seed, className, forme, motif }: { color: string; seed: string; className: string; forme?: FormeAplat; motif?: Motif }) {
  const h = hashString(seed);
  const f = forme ?? (['rectangle', 'bande', 'ovale'] as const)[h % 3];
  // la même gouache ne se pose jamais tout à fait pareil : retournement selon la graine
  const flip = forme === 'arche' ? '' : `scale(${h & 1 ? -1 : 1}, ${h & 2 ? -1 : 1})`;
  const mask = `url("${APLATS[f]}")`;
  return (
    <div
      className={`aplat aplat-peint ${className}`}
      aria-hidden="true"
      style={{ backgroundColor: color, WebkitMaskImage: mask, maskImage: mask, transform: flip || undefined }}
    >
      {motif && (
        <span
          className="aplat-motif"
          style={{ WebkitMaskImage: `url("${MOTIFS[motif]}")`, maskImage: `url("${MOTIFS[motif]}")` }}
        />
      )}
    </div>
  );
}

function AplatSvg({ color, seed, className }: { color: string; seed: string; className: string }) {
  const { d, fid } = useMemo(() => {
    const r = rng(hashString(seed));
    const pts: [number, number][] = [];
    const n = 18;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      let x: number, y: number;
      if (t < 0.25) [x, y] = [t * 4 * 100, 0];
      else if (t < 0.5) [x, y] = [100, (t - 0.25) * 4 * 100];
      else if (t < 0.75) [x, y] = [100 - (t - 0.5) * 4 * 100, 100];
      else [x, y] = [0, 100 - (t - 0.75) * 4 * 100];
      pts.push([x + (r() - 0.5) * 2.4, y + (r() - 0.5) * 3.2]);
    }
    let path = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i <= n; i++) {
      const p = pts[i % n];
      const q = pts[(i - 1) % n];
      path += ` Q${q[0]},${q[1]} ${(q[0] + p[0]) / 2},${(q[1] + p[1]) / 2}`;
    }
    return { d: path + 'Z', fid: `aplat-${hashString(seed).toString(36)}` };
  }, [seed]);
  return (
    <svg className={`aplat ${className}`} viewBox="-4 -4 108 108" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id={fid} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed={hashString(seed) % 97} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={7} result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.6 1.1" result="ga" />
          <feComposite in="d" in2="ga" operator="in" />
        </filter>
      </defs>
      <path d={d} fill={color} filter={`url(#${fid})`} />
    </svg>
  );
}
