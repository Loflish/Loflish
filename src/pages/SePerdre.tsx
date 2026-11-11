import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BubbleImage, Dock } from '../components/Chrome';
import { TexteBrode } from '../components/TexteBrode';
import { BoutonPartager, lienTrace } from '../components/Partager';
import { Icon } from '../components/Icon';
import { Panneau } from '../components/Panneau';
import { Signaler } from '../components/Signaler';
import { allTraces, apercu, TYPE_LABEL } from '../data/store';
import { colorById } from '../lib/palette';
import { rng, shuffle } from '../lib/random';
import { useMuseumMode } from '../lib/museum';
import { useTitre } from '../lib/titre';

const CLE = 'nmm:se-perdre';
const CLE_VU = 'nmm:se-perdre-vu';
const lire = (k: string) => {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
};
const ecrire = (k: string, v: string) => {
  try {
    sessionStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};

/**
 * Se perdre : accepter de ne pas savoir qui l'on va rencontrer.
 * Hasard équitable : ordre mélangé sans répétition dans la session, aucune
 * personnalisation, aucun signal de popularité, aucun autoplay.
 * Le fil de la promenade tient le temps de l'onglet : ouvrir une trace puis revenir reprend à la même carte.
 */
export function SePerdre() {
  useMuseumMode('perdre');
  useTitre('Se perdre');
  const [graine] = useState(() => Number(lire(`${CLE}:graine`)) || Math.floor(Math.random() * 2 ** 31));
  const order = useMemo(() => shuffle(rng(graine), allTraces()), [graine]);
  const [i, setI] = useState(() => Math.min(Number(lire(`${CLE}:i`)) || 0, Math.max(0, order.length - 1)));
  useEffect(() => {
    ecrire(`${CLE}:graine`, String(graine));
    ecrire(`${CLE}:i`, String(i));
  }, [graine, i]);
  // la première fois : un mot sur les gestes, qui s'efface
  const [aide, setAide] = useState(() => {
    try {
      return !localStorage.getItem(CLE_VU);
    } catch {
      return true;
    }
  });
  useEffect(() => {
    if (!aide) return;
    try {
      localStorage.setItem(CLE_VU, '1');
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setAide(false), 7000);
    return () => window.clearTimeout(t);
  }, [aide]);
  const [dir, setDir] = useState<1 | -1>(1);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const [signaler, setSignaler] = useState(false);
  const t = order[i % order.length];

  const go = useCallback((d: 1 | -1) => {
    setDir(d);
    setI((x) => Math.max(0, x + d));
    setDrag(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, .salle')) return;
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
    <div className="perdre" role="main">
      <h1 className="sr-only">Se perdre : rencontrer une trace au hasard</h1>

      <div className="perdre-scene">
        <article
          key={t.id}
          className={`perdre-carte entre-${dir > 0 ? 'droite' : 'gauche'}${t.type === 'memoire' ? ' perdre-memoire' : ''}`}
          style={{
            // le lavis du panneau prend la couleur GRIS de la personne
            ['--bulle' as string]: colorById(t.couleur).hex,
            transform: drag ? `translateX(${drag * 0.6}px) rotate(${drag * 0.01}deg)` : undefined,
            opacity: drag ? 1 - Math.min(0.5, Math.abs(drag) / 500) : undefined,
          }}
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
            {t.pays ? `, ${t.pays}` : ''}
          </p>
          {/* sur un écran bas, ces mots défilent dans le panneau : le clavier doit pouvoir y entrer */}
          <p className="perdre-texte" tabIndex={0}>
            <TexteBrode texte={apercu(t)} />
          </p>
          <Link to={`/trace/${t.id}`} className="lien-entrer">
            Ouvrir la trace <Icon name="fleche" size={16} />
          </Link>
          {/* discret, dans le coin de chaque carte, comme sur le profil */}
          <button className="lien-discret petit perdre-signaler" onClick={() => setSignaler(true)}>
            <Icon name="drapeau" size={14} /> Signaler
          </button>
        <span className="fils-pendants" aria-hidden="true" />
        </article>
      </div>

      <p className={`perdre-aide${aide ? '' : ' is-hidden'}`} aria-hidden={!aide}>
        <span className="hint-large">Les flèches du clavier, ou glisse la carte : à droite pour la suivante, à gauche pour revenir.</span>
        <span className="hint-small">Glisse la carte vers la gauche pour rencontrer la suivante.</span>
      </p>
      <div className="perdre-actions">
        <button className="lien-discret" onClick={() => go(-1)} disabled={i === 0}>
          <Icon name="retour" size={16} /> Précédent
        </button>
        <BoutonPartager titre={t.nom} url={lienTrace(t.id)} />
        <button className="lien-discret" onClick={() => go(1)}>
          Suivant <Icon name="fleche" size={16} />
        </button>
      </div>
      {signaler && (
        <Panneau titre="Signaler cette trace" onClose={() => setSignaler(false)}>
          <Signaler trace={t} onDone={() => setSignaler(false)} />
        </Panneau>
      )}
      <Dock />
    </div>
  );
}
