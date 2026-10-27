import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BubbleImage } from '../components/Chrome';
import { loadPalettes, matiereDisponible, NB_MATIERES, numeroDansPalette, PALETTES } from '../lib/hd';
import { GRIS_PALETTE } from '../lib/palette';
import { NOMS_B, NOMS_C } from '../lib/palettesNoms';
import { Page } from './Pages';

type Palette = 'A' | 'B' | 'C';
const PALETTE_LIBELLE: Record<Palette, string> = {
  A: 'A · les taches d’aquarelle',
  B: 'B · les éléments de la vie',
  C: 'C · la direction artistique',
};

/**
 * L'atelier des bulles (local seulement, jamais publié) : les 101 matières telles que la
 * constellation les dessine, pour que Tom dise sa vision de chacune — j'aime, à revoir ou
 * retirer — et un mot s'il veut. Ses choix restent sur cet appareil (Claude les relit ensuite).
 */

type Avis = 'aime' | 'revoir' | 'retirer';
interface Choix {
  avis?: Avis;
  note?: string;
}
const CLE = 'nmm:atelier-bulles';

/** Les avis du 5 octobre, dans l'ordre des matières 0 à 100 : g = garder, a = affiner, m = plaît moins. */
const AVIS_5_OCTOBRE = 'gmgggggaamgggggmgammaggggagmmmggaggagggggaggggmamamagggggggagagaaagmggmaggggmaagamgagmgggaaaaaamaggaa';
/** refaites puis validées les 5 et 8 octobre */
const REFAITES = new Set([15, 50, 70, 81, 85, 95]);
/** ses préférées, le 19 octobre */
const PREFEREES = new Set([0, 81, 95]);
const LIBELLE_OCTOBRE: Record<string, string> = { g: 'garder', a: 'affiner', m: 'plaît moins' };

const BOUTONS: [Avis, string][] = [
  ['aime', 'J’aime'],
  ['revoir', 'À revoir'],
  ['retirer', 'Retirer'],
];

function lire(): Record<number, Choix> {
  try {
    return JSON.parse(localStorage.getItem(CLE) || '{}') as Record<number, Choix>;
  } catch {
    return {};
  }
}

export default function AtelierBulles() {
  const [choix, setChoix] = useState<Record<number, Choix>>(lire);
  const [couleur, setCouleur] = useState<string>('melange');
  const [filtre, setFiltre] = useState<'toutes' | 'sans' | Avis>('toutes');
  // en développement, les avis sont aussi gardés dans un fichier du projet (vite.config.ts) : on le relit d'abord
  const [relu, setRelu] = useState(false);
  useEffect(() => {
    fetch('/__atelier-bulles')
      .then((r) => (r.ok ? (r.json() as Promise<Record<number, Choix>>) : {}))
      .then((f) => {
        if (f && Object.keys(f).length) setChoix((o) => ({ ...f, ...o }));
      })
      .catch(() => undefined)
      .finally(() => setRelu(true));
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(choix));
    } catch {
      /* stockage indisponible : les choix valent pour cette visite */
    }
    // jamais avant d'avoir relu le fichier : un navigateur vide ne doit pas l'écraser
    if (relu) void fetch('/__atelier-bulles', { method: 'POST', body: JSON.stringify(choix) }).catch(() => undefined);
  }, [choix, relu]);

  // les palettes B et C : seules les matières déjà faites s'affichent
  const [palette, setPalette] = useState<Palette>('A');
  const [pretes, setPretes] = useState<Record<'B' | 'C', number[]>>({ B: [], C: [] });
  useEffect(() => {
    let vivant = true;
    void loadPalettes().then(() => {
      if (!vivant) return;
      const faites = (p: 'B' | 'C') => Array.from({ length: PALETTES[p].fin - PALETTES[p].debut + 1 }, (_, i) => PALETTES[p].debut + i).filter(matiereDisponible);
      setPretes({ B: faites('B'), C: faites('C') });
    });
    return () => {
      vivant = false;
    };
  }, []);

  const numeros = useMemo(
    () => (palette === 'A' ? Array.from({ length: NB_MATIERES + 1 }, (_, i) => i) : pretes[palette]),
    [palette, pretes],
  );
  const compte = (a?: Avis) => numeros.filter((n) => choix[n]?.avis === a).length;
  const visibles = numeros.filter((n) => (filtre === 'toutes' ? true : filtre === 'sans' ? !choix[n]?.avis : choix[n]?.avis === filtre));
  const maj = (n: number, c: Partial<Choix>) => setChoix((o) => ({ ...o, [n]: { ...o[n], ...c } }));

  return (
    <Page className="atelier" titre="L’atelier des bulles">
      <h1 className="page-titre">Les matières des bulles</h1>
      <p className="lead">
        Pour chacune : <em>J’aime</em>, <em>À revoir</em> ou <em>Retirer</em>, et un mot si tu veux. Tout reste sur cet appareil ; dis-moi « c’est fait »
        quand tu as fini, je lirai tes choix.
      </p>
      <p>
        <Link className="lien-discret" to="/atelier/coupe">
          La coupe des bulles : choisir tes 100 en duels
        </Link>
      </p>

      <div className="atelier-palettes" role="group" aria-label="Palette">
        {(['A', 'B', 'C'] as const).map((p) => (
          <button key={p} className={`lien-discret${palette === p ? ' est-actif' : ''}`} aria-pressed={palette === p} onClick={() => setPalette(p)}>
            {PALETTE_LIBELLE[p]}
            {p !== 'A' && ` (${pretes[p].length} / ${PALETTES[p].fin - PALETTES[p].debut + 1})`}
          </button>
        ))}
      </div>

      <div className="atelier-barre">
        <label>
          Couleur des bulles{' '}
          <select value={couleur} onChange={(e) => setCouleur(e.target.value)}>
            <option value="melange">Toutes les couleurs, mélangées</option>
            {GRIS_PALETTE.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <div className="atelier-filtres" role="group" aria-label="Montrer">
          {(
            [
              ['toutes', `Toutes (${numeros.length})`],
              ['sans', `Sans avis (${numeros.length - compte('aime') - compte('revoir') - compte('retirer')})`],
              ['aime', `J’aime (${compte('aime')})`],
              ['revoir', `À revoir (${compte('revoir')})`],
              ['retirer', `Retirer (${compte('retirer')})`],
            ] as const
          ).map(([v, t]) => (
            <button key={v} className={`lien-discret${filtre === v ? ' est-actif' : ''}`} aria-pressed={filtre === v} onClick={() => setFiltre(v)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <ol className="atelier-grille">
        {visibles.map((n) => {
          const c = choix[n] ?? {};
          const teinte = couleur === 'melange' ? GRIS_PALETTE[(n * 7) % GRIS_PALETTE.length]!.id : couleur;
          const oct = n <= NB_MATIERES ? (AVIS_5_OCTOBRE[n] ?? '') : '';
          const { palette: pal, numero } = numeroDansPalette(n);
          const nom = pal === 'B' ? NOMS_B[numero - 1] : pal === 'C' ? NOMS_C[numero - 1] : '';
          return (
            <li key={n} className={`atelier-carte${c.avis ? ` avis-${c.avis}` : ''}`}>
              <BubbleImage id={`atelier-${n}`} couleur={teinte} matiere={n} size={120} />
              <p className="atelier-numero">
                {pal === 'A' ? 'N°' : pal} {String(numero).padStart(2, '0')}
                {n === 0 && ' · aquarelle cousue'}
                {PREFEREES.has(n) && <span className="atelier-pastille">préférée</span>}
              </p>
              <p className="atelier-rappel">
                {nom || (REFAITES.has(n) ? 'refaite et validée en octobre' : oct && `5 oct. : ${LIBELLE_OCTOBRE[oct]}`)}
              </p>
              <div className="atelier-avis" role="group" aria-label={`Avis sur la matière ${n}`}>
                {BOUTONS.map(([a, t]) => (
                  <button key={a} className={c.avis === a ? 'est-actif' : ''} aria-pressed={c.avis === a} onClick={() => maj(n, { avis: c.avis === a ? undefined : a })}>
                    {t}
                  </button>
                ))}
              </div>
              <input className="atelier-note" placeholder="un mot…" value={c.note ?? ''} onChange={(e) => maj(n, { note: e.target.value })} aria-label={`Note sur la matière ${n}`} />
            </li>
          );
        })}
      </ol>
    </Page>
  );
}
