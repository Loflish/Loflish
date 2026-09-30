import { useMemo } from 'react';
import type { Media } from '../data/types';
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
