import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BubbleImage, Dock, Logo } from '../components/Chrome';
import { TexteBrode } from '../components/TexteBrode';
import { Icon } from '../components/Icon';
import { allTraces, apercu, TYPE_LABEL } from '../data/store';
import { shuffle } from '../lib/random';
import { useMuseumMode } from '../lib/museum';

/**
 * Se perdre — accepter de ne pas savoir qui l'on va rencontrer.
 * Hasard équitable : ordre mélangé sans répétition dans la session, aucune
 * personnalisation, aucun signal de popularité, aucun autoplay.
 */
export function SePerdre() {
  useMuseumMode('perdre');
  const order = useMemo(() => shuffle(Math.random, allTraces()), []);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const t = order[i % order.length];

  const go = useCallback((d: 1 | -1) => {
    setDir(d);
    setI((x) => Math.max(0, x + d));
    setDrag(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft' && i > 0) go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, i]);

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    start.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (start.current !== null) setDrag(e.clientX - start.current);
  };
  const onUp = () => {
    if (start.current === null) return;
    start.current = null;
    if (drag < -70) go(1);
    else if (drag > 70 && i > 0) go(-1);
    else setDrag(0);
  };

  return (
    <div className="perdre">
      <div className="explorer-logo">
        <Logo />
      </div>
      <h1 className="sr-only">Se perdre — rencontrer une présence au hasard</h1>

      <div className="perdre-scene">
        <article
          key={t.id}
          className={`perdre-carte entre-${dir > 0 ? 'droite' : 'gauche'}`}
          style={{ transform: drag ? `translateX(${drag * 0.6}px) rotate(${drag * 0.01}deg)` : undefined, opacity: drag ? 1 - Math.min(0.5, Math.abs(drag) / 500) : undefined }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          aria-live="polite"
        >
          <BubbleImage id={t.id} couleur={t.couleur} size={132} className="breathing" />
          <h2 className="perdre-nom">{t.nom}</h2>
          <p className="apercu-type">
            {TYPE_LABEL[t.type]}
            {t.pays ? ` · ${t.pays}` : ''}
          </p>
          <p className="perdre-texte">
            <TexteBrode texte={apercu(t)} />
          </p>
          <Link to={`/trace/${t.id}`} className="lien-entrer">
            Ouvrir la trace <Icon name="fleche" size={16} />
          </Link>
        </article>
      </div>

      <div className="perdre-actions">
        <button className="lien-discret" onClick={() => go(-1)} disabled={i === 0}>
          <Icon name="retour" size={16} /> Précédent
        </button>
        <button
          className="lien-discret"
          onClick={async () => {
            const url = `${window.location.origin}${window.location.pathname}#/trace/${t.id}`;
            try {
              if (navigator.share) await navigator.share({ title: t.nom, url });
              else await navigator.clipboard.writeText(url);
            } catch {
              /* annulé */
            }
          }}
        >
          <Icon name="partager" size={16} /> Partager
        </button>
        <button className="lien-discret" onClick={() => go(1)}>
          Suivant <Icon name="fleche" size={16} />
        </button>
      </div>
      <Dock />
    </div>
  );
}
