import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { allTraces } from '../data/store';
import type { FondEau } from '../engine/eau';
import { ENTREE, LEGER } from '../lib/hd';
import { useMuseum } from '../lib/museum';

/**
 * L'entrée du musée.
 *
 * Le hook (aux deux premières visites, moins de 20 s) : sur le papier vierge, des gouttes tombent et
 * déposent exactement la peinture du fond, pendant que deux phrases se cousent ; puis l'eau se met à
 * couler, les bulles arrivent (« chaque bulle est une personne »), l'une d'elles se montre (sans nom)
 * à côté ; enfin l'interface arrive. Les visites suivantes : les gouttes seules.
 *
 * Tout se passe dans le moteur du fond (eau.ts) : la peinture finale est celle de la constellation au
 * pixel près. Passable à tout moment d'un clic ou d'une touche (les gouttes finissent en accéléré),
 * jamais sur téléphone ni si le visiteur a demandé moins de mouvement.
 */

const CLE_VUE = 'nmm:entree-vue';
const CLE_VISITES = 'nmm:visites';
const CLE_VISITE_COMPTEE = 'nmm:visite-comptee';
/** durée de la naissance de la peinture, en secondes (les gouttes, puis le dernier lavis, puis l'eau) */
const DUREE = 8;
/** les bulles et l'interface arrivent en fondu (garder égal à museum.css) */
const FONDU = 2600;
/** si la peinture n'arrive pas (WebGL indisponible), on n'attend pas plus longtemps */
const SECOURS = 5000;

/**
 * Les phrases du hook. BROUILLONS PROVISOIRES : Tom réécrit tous les textes du site lui-même. Jamais
 * « pour toujours » (le cahier, §1.4). Les deux premières suivent le temps des gouttes (elles restent
 * en accord avec la peinture même si l'écran ralentit) ; les suivantes, le temps écoulé depuis que la
 * peinture est posée.
 */
const PHRASES: { apres: 'gouttes' | 'peinture'; t: number; duree: number; texte: string }[] = [
  { apres: 'gouttes', t: 0.5, duree: 3.6, texte: 'Chaque vie laisse des mots.' },
  { apres: 'gouttes', t: 4.4, duree: 3.4, texte: 'Ici, on les recueille et on les coud.' },
  { apres: 'peinture', t: 0.6, duree: 3.4, texte: 'Chaque bulle est une personne.' },
  { apres: 'peinture', t: 4.6, duree: 4.0, texte: 'Approche-toi : ses mots t’attendent.' },
];
/** après la peinture (8 s) : les bulles arrivent, une bulle se montre puis rejoint les autres, l'interface arrive (17 s en tout) */
const BULLE_OUVERTE = 4.8;
const BULLE_FERMEE = 8.6;
const FIN_HOOK = 9.0;

type Sorte = 'hook' | 'gouttes';

function lire(stockage: Storage, cle: string): string | null {
  try {
    return stockage.getItem(cle);
  } catch {
    return null;
  }
}
function ecrire(stockage: Storage, cle: string, valeur: string): void {
  try {
    stockage.setItem(cle, valeur);
  } catch {
    /* stockage indisponible : la règle des visites vaut pour cette page seulement */
  }
}

/** Quelle entrée jouer ? Décidé une seule fois, au chargement ; chaque visite n'est comptée qu'une fois. */
function quelleEntree(reducedMotion: boolean, enPause: boolean, accueil: boolean): Sorte | null {
  if (!ENTREE || LEGER || reducedMotion || enPause) return null;
  if (ENTREE === 'hook' || ENTREE === 'gouttes') return ENTREE;
  // qui arrive par un lien partagé vient voir quelqu'un : il n'attend pas l'entrée
  if (!accueil || lire(sessionStorage, CLE_VUE) === '1') return null;
  let visite = Number(lire(localStorage, CLE_VISITES) ?? 0);
  if (lire(sessionStorage, CLE_VISITE_COMPTEE) !== '1') {
    visite += 1;
    ecrire(localStorage, CLE_VISITES, String(visite));
    ecrire(sessionStorage, CLE_VISITE_COMPTEE, '1');
  }
  return visite <= 2 ? 'hook' : 'gouttes';
}

export function Entree({ eau, pret }: { eau: React.MutableRefObject<FondEau | null>; pret: boolean }) {
  const { reducedMotion, enPause, engine } = useMuseum();
  const { pathname } = useLocation();
  const [sorte, setSorte] = useState<Sorte | null>(() => {
    const s = quelleEntree(reducedMotion, enPause, pathname === '/');
    // dès le premier rendu, avant que rien ne s'affiche : sinon les bulles apparaîtraient un instant
    if (s) document.documentElement.classList.add('entree-en-cours', 'entree-sans-bulles', 'entree-douce');
    return s;
  });
  const [fin, setFin] = useState(false);
  const [bulles, setBulles] = useState(false);
  const [phrase, setPhrase] = useState<{ i: number; visible: boolean } | null>(null);
  const lancee = useRef(false);
  const passee = useRef(false);
  const peinte = useRef(false);
  const minuteurs = useRef<number[]>([]);
  const ouverte = useRef<string | null>(null);
  const passer = useRef<HTMLButtonElement>(null);

  const apres = (s: number, f: () => void) => minuteurs.current.push(window.setTimeout(f, s * 1000));

  const finir = useCallback(() => {
    if (fin) return;
    for (const m of minuteurs.current) {
      window.clearTimeout(m);
      window.clearInterval(m);
    }
    minuteurs.current = [];
    if (ouverte.current) engine.current?.montrer(null);
    setPhrase(null);
    setFin(true);
    ecrire(sessionStorage, CLE_VUE, '1');
    window.setTimeout(() => setSorte(null), FONDU);
  }, [engine, fin]);

  /** la peinture est posée : pour les gouttes seules, c'est fini ; pour le hook, les bulles arrivent */
  const peintureFinie = useCallback(() => {
    peinte.current = true;
    if (sorte !== 'hook' || passee.current) return finir();
    setBulles(true);
    PHRASES.forEach((p, i) => {
      if (p.apres !== 'peinture') return;
      apres(p.t, () => !passee.current && setPhrase({ i, visible: true }));
      apres(p.t + p.duree, () => setPhrase((o) => (o?.i === i ? { i, visible: false } : o)));
    });
    apres(BULLE_OUVERTE, () => {
      // une bulle proche du centre se montre d'elle-même : elle s'arrête et grandit un peu, sans nom
      // (pas sa fiche : Tom, 22 octobre, une fenêtre à fermer en plein hook « c'est bizarre »)
      const c = engine.current;
      if (!c) return;
      const w = window.innerWidth, h = window.innerHeight;
      let mieux: { id: string; d: number } | null = null;
      for (const t of allTraces()) {
        const pos = c.screenPos(t.id);
        if (!pos || pos.x < w * 0.2 || pos.x > w * 0.7 || pos.y < h * 0.25 || pos.y > h * 0.75) continue;
        const d = Math.hypot(pos.x - w * 0.42, pos.y - h * 0.5);
        if (!mieux || d < mieux.d) mieux = { id: t.id, d };
      }
      if (mieux) {
        ouverte.current = mieux.id;
        c.montrer(mieux.id);
      }
    });
    apres(BULLE_FERMEE, () => {
      if (ouverte.current) engine.current?.montrer(null);
      ouverte.current = null;
    });
    apres(FIN_HOOK, finir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorte, finir, engine]);

  /** le visiteur passe : les gouttes finissent en accéléré, puis on entre directement */
  const presser = useCallback(() => {
    passee.current = true;
    if (peinte.current) finir();
    else eau.current?.presserApparition();
  }, [eau, finir]);

  // l'interface attend ; les touches permettent de passer
  useEffect(() => {
    if (!sorte) return;
    passer.current?.focus({ preventScroll: true });
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') presser();
    };
    window.addEventListener('keydown', touche);
    const secours = window.setTimeout(() => !lancee.current && finir(), SECOURS);
    return () => {
      window.clearTimeout(secours);
      window.removeEventListener('keydown', touche);
    };
  }, [sorte, presser, finir]);

  // dès que la peinture est posée dans le moteur, les gouttes tombent (et, pour le hook, les phrases se cousent)
  useEffect(() => {
    if (!sorte || !pret || lancee.current) return;
    const e = eau.current;
    if (!e) return;
    lancee.current = true;
    e.apparaitre(DUREE, peintureFinie);
    if (sorte !== 'hook') return;
    // les phrases des gouttes suivent le temps de la peinture, lu dix fois par seconde
    const suivi = window.setInterval(() => {
      const t = e.tempsApparition;
      if (t === null || passee.current) return window.clearInterval(suivi);
      const i = PHRASES.findIndex((p) => p.apres === 'gouttes' && t >= p.t && t < p.t + p.duree);
      setPhrase((o) => (i >= 0 ? (o?.i === i && o.visible ? o : { i, visible: true }) : o && PHRASES[o.i]!.apres === 'gouttes' ? { i: o.i, visible: false } : o));
    }, 100);
    minuteurs.current.push(suivi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorte, pret, eau, peintureFinie]);

  // ce qui attend se lit sur la page elle-même (museum.css) : l'interface, les bulles, et le fondu lent
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('entree-en-cours', !!sorte && !fin);
    html.classList.toggle('entree-sans-bulles', !!sorte && !fin && !bulles);
    html.classList.toggle('entree-douce', !!sorte);
  }, [sorte, fin, bulles]);

  useEffect(
    () => () => {
      for (const m of minuteurs.current) {
        window.clearTimeout(m);
        window.clearInterval(m);
      }
      document.documentElement.classList.remove('entree-en-cours', 'entree-sans-bulles', 'entree-douce');
    },
    [],
  );

  if (!sorte || fin) return null;
  const p = phrase ? PHRASES[phrase.i] : null;
  return createPortal(
    <div className="entree-ecran" onClick={presser}>
      {p && (
        <p key={phrase!.i} className={`entree-phrase${phrase!.visible ? ' est-visible' : ''}`} aria-live="polite">
          {p.texte}
        </p>
      )}
      <button
        ref={passer}
        className="entree-passer lien-discret"
        onClick={(e) => {
          e.stopPropagation();
          presser();
        }}
      >
        Entrer dans le musée
      </button>
    </div>,
    document.body,
  );
}
