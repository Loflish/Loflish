import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BubbleImage } from '../components/Chrome';
import { EXEMPTEE, ORDRE_TOUR1, TOUR1, TOUR2 } from '../data/coupeBulles';
import { loadMatieres, numeroDansPalette } from '../lib/hd';
import { GRIS_PALETTE } from '../lib/palette';
import { NOMS_B, NOMS_C } from '../lib/palettesNoms';
import { Page } from './Pages';

/**
 * La coupe des bulles (local seulement, jamais publiée) : deux bulles qui se ressemblent, Tom garde l'une, l'autre
 * part, jusqu'à ce qu'il en reste 100 (src/data/coupeBulles.ts). S'il n'aime aucune des deux, les deux partent : il en
 * restera un peu moins. Chaque choix est gardé dans ce navigateur et dans design/coupe-bulles.json, que Claude relit ensuite.
 */

type Choix = Record<string, number>; // duel → matière gardée, ou AUCUNE
const CLE = 'nmm:coupe-bulles';
const AUCUNE = -1;

interface Duel {
  id: string;
  tour: 1 | 2;
  k: number;
}
const DUELS: Duel[] = [
  ...ORDRE_TOUR1.map((k): Duel => ({ id: `t1-${k}`, tour: 1, k })),
  ...TOUR2.map((_, k): Duel => ({ id: `t2-${k}`, tour: 2, k })),
];
const NB_TOUR1 = TOUR1.length;

function paireDe(d: Duel, choix: Choix): [number, number] | null {
  if (d.tour === 1) return TOUR1[d.k]!;
  const [i, j] = TOUR2[d.k]!;
  const x = choix[`t1-${i}`];
  const y = choix[`t1-${j}`];
  return x === undefined || y === undefined ? null : [x, y];
}

/** un choix ne compte que s'il désigne l'une des deux bulles du duel tel qu'il se présente */
const choisi = (d: Duel, choix: Choix) => {
  const p = paireDe(d, choix);
  // au 2e tour, sans adversaire, la bulle restante passe sans duel
  if (p?.includes(AUCUNE)) return p[0] === AUCUNE ? p[1] : p[0];
  const v = choix[d.id];
  return p && v !== undefined && (v === AUCUNE || p.includes(v)) ? v : undefined;
};

function finale(choix: Choix): number[] | null {
  if (DUELS.some((d) => choisi(d, choix) === undefined)) return null;
  const auTour2 = new Set(TOUR2.flat());
  return [
    EXEMPTEE,
    ...TOUR1.map((_, k) => k)
      .filter((k) => !auTour2.has(k))
      .map((k) => choix[`t1-${k}`]!),
    ...DUELS.filter((d) => d.tour === 2).map((d) => choisi(d, choix)!),
  ].filter((m) => m !== AUCUNE);
}

function nom(n: number): string {
  const { palette, numero } = numeroDansPalette(n);
  if (palette === 'B') return NOMS_B[numero - 1] ?? '';
  if (palette === 'C') return NOMS_C[numero - 1] ?? '';
  return n === 0 ? 'aquarelle cousue' : '';
}
function etiquette(n: number): string {
  const { palette, numero } = numeroDansPalette(n);
  return `${palette === 'A' ? 'N°' : palette} ${String(numero).padStart(2, '0')}`;
}

function lire(): Choix {
  try {
    return JSON.parse(localStorage.getItem(CLE) || '{}') as Choix;
  } catch {
    return {};
  }
}

export default function CoupeBulles() {
  const [choix, setChoix] = useState<Choix>(lire);
  // le fichier du projet d'abord (vite.config.ts) : un navigateur qui a perdu sa mémoire ne repart pas de zéro
  const [relu, setRelu] = useState(false);
  useEffect(() => {
    fetch('/__coupe-bulles')
      .then((r) => (r.ok ? (r.json() as Promise<{ choix?: Choix }>) : {}))
      .then((f: { choix?: Choix }) => {
        if (f.choix && Object.keys(f.choix).length) setChoix((o) => (Object.keys(o).length ? o : f.choix!));
      })
      .catch(() => undefined)
      .finally(() => setRelu(true));
  }, []);

  const rang = DUELS.findIndex((d) => choisi(d, choix) === undefined);
  const fini = rang < 0;
  const cent = useMemo(() => finale(choix), [choix]);

  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(choix));
    } catch {
      /* stockage indisponible : les choix valent pour cette visite */
    }
    if (relu) {
      const corps = JSON.stringify({ choix, finale: cent, maj: new Date().toISOString() });
      void fetch('/__coupe-bulles', { method: 'POST', body: corps }).catch(() => undefined);
    }
  }, [choix, cent, relu]);

  const duel = fini ? null : DUELS[rang]!;
  const paire = duel ? paireDe(duel, choix) : null;
  // les deux bulles d'un duel portent la même couleur : on juge la matière, pas la teinte
  const teinte = GRIS_PALETTE[((fini ? 0 : rang) * 7) % GRIS_PALETTE.length]!.id;
  // assez grandes pour juger, assez petites pour que le duel tienne dans l'écran avec les noms
  const taille = typeof window === 'undefined' ? 280 : Math.max(140, Math.min(320, Math.floor((window.innerWidth - 96) / 2), window.innerHeight - 440));

  const garder = useCallback(
    (m: number) => {
      if (!duel) return;
      setChoix((o) => ({ ...o, [duel.id]: m }));
    },
    [duel],
  );
  const annuler = useCallback(() => {
    const dernier = [...DUELS].reverse().find((d) => choix[d.id] !== undefined && choisi(d, choix) !== undefined);
    if (!dernier) return;
    setChoix((o) => {
      const n = { ...o };
      delete n[dernier.id];
      return n;
    });
  }, [choix]);

  // le duel suivant se prépare pendant que Tom regarde celui-ci
  useEffect(() => {
    const suivant = DUELS[rang + 1];
    if (suivant?.tour === 1) void loadMatieres(TOUR1[suivant.k]!);
  }, [rang]);

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft' && paire) garder(paire[0]);
      else if (e.key === 'ArrowRight' && paire) garder(paire[1]);
      else if (e.key === 'ArrowDown' && paire) garder(AUCUNE);
      else if (e.key === 'Backspace') annuler();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [paire, garder, annuler]);

  const parPalette = cent && (['A', 'B', 'C'] as const).map((p) => `${cent.filter((n) => numeroDansPalette(n).palette === p).length} ${p}`).join(' · ');
  const refus = Object.values(choix).filter((v) => v === AUCUNE).length;

  return (
    <Page className="coupe" titre="La coupe des bulles">
      <h1 className="page-titre">La coupe des bulles</h1>
      <p className="lead">Deux bulles qui se ressemblent : garde celle que tu préfères, l’autre s’en va. À la fin, il en restera 100 au plus.</p>

      {duel && paire && (
        <>
          <p className="coupe-etape">
            <span>{duel.tour === 1 ? `1er tour · les jumelles · ${rang + 1} / ${NB_TOUR1}` : `2e tour · les plus proches · ${rang - NB_TOUR1 + 1} / ${TOUR2.length}`}</span>
            <progress max={DUELS.length} value={rang} aria-label={`${rang} duels sur ${DUELS.length}`} />
          </p>
          <div className="coupe-duel" key={duel.id}>
            {paire.map((m) => (
              <button key={m} className="coupe-bulle" onClick={() => garder(m)} aria-label={`Garder ${etiquette(m)} ${nom(m)}`}>
                <BubbleImage id={`coupe-${m}`} couleur={teinte} matiere={m} size={taille} />
                <span className="coupe-nom">{nom(m) || etiquette(m)}</span>
                {nom(m) && <span className="coupe-num">{etiquette(m)}</span>}
              </button>
            ))}
          </div>
          <p className="coupe-aucune">
            <button className="bouton" onClick={() => garder(AUCUNE)}>
              Je n’aime aucune des deux
            </button>
            {refus > 0 && <span>{refus === 1 ? '1 refus noté' : `${refus} refus notés`}</span>}
          </p>
        </>
      )}

      {fini && cent && (
        <>
          <h2 className="intertitre">Tes {cent.length} bulles</h2>
          <p className="coupe-etape">
            {parPalette}. C’est enregistré : dis-moi « c’est fait ».
          </p>
          <ol className="atelier-grille coupe-finale">
            {cent.map((m) => (
              <li key={m} className="atelier-carte">
                <BubbleImage id={`coupe-${m}`} couleur={GRIS_PALETTE[(m * 7) % GRIS_PALETTE.length]!.id} matiere={m} size={96} />
                <p className="atelier-numero">{etiquette(m)}</p>
                <p className="atelier-rappel">{nom(m)}</p>
              </li>
            ))}
          </ol>
        </>
      )}

      <p className="coupe-actions">
        <button className="lien-discret" onClick={annuler} disabled={rang === 0}>
          Annuler le dernier choix
        </button>
        <span>au clavier : ← ou → pour garder, ↓ pour aucune des deux, retour arrière pour annuler</span>
        <Link className="lien-discret" to="/atelier/bulles">
          L’atelier des bulles
        </Link>
      </p>
    </Page>
  );
}
