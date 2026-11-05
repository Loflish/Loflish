import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Media } from '../data/types';
import { ACCEPT, lecteurIntegre, lienValide, natureDe, tailleLisible, TAILLES_MAX, useMediaUrl } from '../lib/fichiers';
import { hashString, rng } from '../lib/random';
import { Icon } from './Icon';

/**
 * Les vrais souvenirs restent authentiques : aucun filtre aquarelle, aucun
 * sépia. Photos, vidéos, enregistrements, documents et liens sont montrés
 * tels quels, légendés comme un cartel de musée, et chacun s'ouvre dans une
 * visionneuse où il se lit vraiment.
 */

const LABEL = { image: 'Photo', video: 'Vidéo', audio: 'Son', document: 'Document', lien: 'Lien' } as const;

/** Ouvrir un média dans la visionneuse (fourni par la page qui l'affiche). */
export const OuvrirMedia = createContext<((m: Media) => void) | null>(null);

function hote(url?: string): string {
  const u = url ? lienValide(url) : null;
  return u ? u.hostname.replace(/^www\./, '') : '';
}

export function MediaThumb({ m, size = 'm' }: { m: Media; size?: 's' | 'm' | 'l' }) {
  const ouvrir = useContext(OuvrirMedia);
  const url = useMediaUrl(m);
  // un fichier introuvable ne laisse jamais d'image cassée : la vignette garde sa teinte
  const [casse, setCasse] = useState(false);
  const vu = url && !casse ? url : null;
  const surface = (
    <div className="media-surface" style={{ ['--teinte' as string]: m.teinte ?? '#DDD8CE' }}>
      {m.kind === 'image' && vu && <img className="media-img" src={vu} alt="" loading="lazy" decoding="async" onError={() => setCasse(true)} />}
      {m.kind === 'image' && !vu && <span className="media-placeholder">photographie</span>}
      {m.kind === 'video' && vu && (
        <video className="media-img" src={`${vu}#t=0.5`} muted playsInline preload="metadata" aria-hidden="true" onError={() => setCasse(true)} />
      )}
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
  );
  const legende =
    size !== 's' ? (
      <figcaption>
        {m.titre} <span className="media-kind">({LABEL[m.kind].toLowerCase()})</span>
        {m.kind === 'lien' && hote(m.url) && <span className="media-hote">{hote(m.url)}</span>}
        {m.legende && size === 'l' && <span className="media-legende">{m.legende}</span>}
      </figcaption>
    ) : (
      <figcaption className="sr-only">{`${LABEL[m.kind]} : ${m.titre}`}</figcaption>
    );
  return (
    <figure className={`media media-${m.kind} media-${size}`}>
      {ouvrir ? (
        <button
          type="button"
          className="media-ouvrir"
          onClick={() => ouvrir(m)}
          aria-label={`Ouvrir : ${LABEL[m.kind]}, ${m.titre}${m.duree ? `, ${m.duree}` : ''}`}
        >
          {surface}
        </button>
      ) : (
        surface
      )}
      {legende}
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

/** La visionneuse : chaque média s'y lit vraiment, avec les commandes du navigateur. */
export function MediaVue({ m, onClose }: { m: Media; onClose: () => void }) {
  const url = useMediaUrl(m);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    // Échap ferme la visionneuse seule, pas la salle ouverte derrière elle
    const onKey = (e: KeyboardEvent) => {
      // la tabulation reste dans la visionneuse
      if (e.key === 'Tab' && ref.current) {
        const focusables = [...ref.current.querySelectorAll<HTMLElement>('a[href], button, audio, video, iframe')];
        if (!focusables.length) return;
        const premier = focusables[0]!;
        const dernier = focusables[focusables.length - 1]!;
        if (e.shiftKey && (document.activeElement === premier || document.activeElement === ref.current)) {
          e.preventDefault();
          dernier.focus();
        } else if (!e.shiftKey && document.activeElement === dernier) {
          e.preventDefault();
          premier.focus();
        }
        return;
      }
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  const lecteur = m.kind === 'lien' && m.url ? lecteurIntegre(m.url) : null;
  // la vidéo d'un service tiers (YouTube, Vimeo) ne se charge qu'après un clic informé : elle peut poser des traceurs
  const [lire, setLire] = useState(false);
  const demo = !url && m.kind !== 'lien';

  return createPortal(
    <div className="media-vue-scrim" onClick={onClose}>
      <div
        className="media-vue"
        role="dialog"
        aria-modal="true"
        aria-label={`${LABEL[m.kind]} : ${m.titre}`}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="media-vue-entete">
          <p className="media-vue-titre">
            {m.titre} <span className="media-kind">({LABEL[m.kind].toLowerCase()})</span>
          </p>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <Icon name="fermer" size={20} />
          </button>
        </div>
        <div className="media-vue-corps">
          {demo && <p className="muted">Aucun fichier n’a été déposé ici.</p>}
          {m.kind === 'image' && url && <img src={url} alt={m.legende || m.titre} decoding="async" />}
          {m.kind === 'video' && url && <video src={url} controls playsInline autoPlay />}
          {m.kind === 'audio' && url && (
            <div className="media-vue-audio">
              <Waveform seed={m.id} />
              <audio src={url} controls autoPlay />
            </div>
          )}
          {m.kind === 'document' && url && (
            // un document ne s'affiche pas : il se télécharge, simplement
            <div className="media-vue-doc">
              <p className="media-vue-url">
                <Icon name="document" size={20} /> {m.nom ?? m.titre}
                {m.taille ? `, ${tailleLisible(m.taille)}` : ''}
              </p>
              <a className="lien-entrer" href={url} download={m.nom ?? m.titre}>
                Télécharger le document <Icon name="fleche" size={16} />
              </a>
            </div>
          )}
          {m.kind === 'lien' && m.url && (
            <div className="media-vue-lien">
              {lecteur &&
                (lire ? (
                  <iframe src={lecteur} title={m.titre} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
                ) : (
                  <div className="media-vue-tiers">
                    <p className="muted petit">
                      Cette vidéo est hébergée par {hote(m.url)}. En la lisant ici, ce service peut déposer des traceurs sur ton appareil.
                    </p>
                    <button type="button" className="bouton" onClick={() => setLire(true)}>
                      Lire la vidéo ici
                    </button>
                  </div>
                ))}
              <p className="media-vue-url">{m.url}</p>
              <a className="lien-entrer" href={lienValide(m.url)?.href} target="_blank" rel="noopener noreferrer">
                Ouvrir le lien ({hote(m.url)}) <Icon name="fleche" size={16} />
              </a>
              <p className="muted petit">Le lien s’ouvre dans un nouvel onglet, hors du musée.</p>
            </div>
          )}
          {m.legende && <p className="media-vue-legende">{m.legende}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export type MediaChoisi = { file: File } | { url: string } | null;

/** Choisir un média : un fichier (photo, vidéo, enregistrement, document) ou un lien. */
export function ChoixMedia({ value, onChange, id }: { value: MediaChoisi; onChange: (v: MediaChoisi) => void; id: string }) {
  const [mode, setMode] = useState<'fichier' | 'lien'>(value && 'url' in value ? 'lien' : 'fichier');
  const [lien, setLien] = useState(value && 'url' in value ? value.url : '');
  const [erreur, setErreur] = useState('');
  // le fichier choisi mais pas encore déclaré (droits) : il n'est transmis au parent qu'après la case cochée
  const [attente, setAttente] = useState<File | null>(null);
  const fichierChoisi = value && 'file' in value ? value.file : attente;
  const apercu = useMemo(() => (fichierChoisi && fichierChoisi.type.startsWith('image/') ? URL.createObjectURL(fichierChoisi) : null), [fichierChoisi]);
  useEffect(() => () => void (apercu && URL.revokeObjectURL(apercu)), [apercu]);

  return (
    <div className="choix-media">
      <div className="segmented segmented-petit" role="radiogroup" aria-label="Fichier ou lien">
        <button type="button" role="radio" aria-checked={mode === 'fichier'} onClick={() => (setMode('fichier'), onChange(null), setErreur(''))}>
          Un fichier
        </button>
        <button type="button" role="radio" aria-checked={mode === 'lien'} onClick={() => (setMode('lien'), onChange(null), setErreur(''))}>
          Un lien
        </button>
      </div>
      {mode === 'fichier' ? (
        attente || (value && 'file' in value) ? (
          <div className="choix-media-fichier">
            {apercu ? <img src={apercu} alt="" /> : <Icon name={natureDe(fichierChoisi!) === 'document' ? 'document' : 'play'} size={20} />}
            <span>
              {fichierChoisi!.name}, {tailleLisible(fichierChoisi!.size)}
            </span>
            <button
              type="button"
              className="lien-discret petit"
              onClick={() => {
                setAttente(null);
                onChange(null);
              }}
            >
              Retirer
            </button>
            {/* droit à l'image et droit d'auteur : le fichier ne compte qu'une fois les droits déclarés */}
            <label className="check choix-media-droits">
              <input
                type="checkbox"
                checked={!!(value && 'file' in value)}
                onChange={(e) => {
                  const f = fichierChoisi!;
                  if (e.target.checked) {
                    setAttente(null);
                    onChange({ file: f });
                  } else {
                    setAttente(f);
                    onChange(null);
                  }
                }}
              />
              <span>J’ai les droits sur ce fichier et l’accord des personnes qu’on y voit ou qu’on y entend.</span>
            </label>
          </div>
        ) : (
          <>
            <label className="editeur-fichier lien-discret" htmlFor={id}>
              <Icon name="image" size={16} /> Choisir une photo, une vidéo, un enregistrement ou un document
            </label>
            <input
              id={id}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                const k = natureDe(f);
                if (f.size > TAILLES_MAX[k]) {
                  setErreur(`Ce fichier est trop lourd (${Math.round(TAILLES_MAX[k] / 1024 / 1024)} Mo au plus pour ce type).`);
                  return;
                }
                setErreur('');
                // le fichier attend la déclaration de droits avant de compter
                setAttente(f);
                onChange(null);
              }}
            />
          </>
        )
      ) : (
        <input
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={lien}
          aria-label="Adresse du lien"
          onChange={(e) => {
            setLien(e.target.value);
            const u = lienValide(e.target.value);
            setErreur(e.target.value && !u ? 'Cette adresse ne mène pas à une page web.' : '');
            onChange(u ? { url: u.href } : null);
          }}
        />
      )}
      {erreur && (
        <p className="editeur-erreur" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}
