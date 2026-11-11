import { useEffect, useState, type CSSProperties } from 'react';
import { BubbleImage } from '../components/Chrome';
import { GRIS_PALETTE } from '../lib/palette';
import { Page } from './Pages';
import { chargerPlanches, CLAUDE, GOTHIQUE, LUMIERE, MELANGE } from './planches';

/** Comparer les planches (local seulement, jamais publié) : mêmes places, mêmes couleurs, même couture, seule la matière change. */

const TAILLES = [
  { nom: 'Dans la constellation', px: 42 },
  { nom: 'Zoom', px: 92 },
  { nom: 'Page d’une trace', px: 190 },
];

interface Case {
  matiere: number;
  nom: string;
  /** sa place dans sa planche, qui fixe sa couleur et sa couture */
  rang: number;
}

interface Planche {
  nom: string;
  cases: Case[];
  /** par groupes de quatre bulles de même couleur, une par planche */
  trios?: boolean;
}

export default function AtelierComparer() {
  const [planches, setPlanches] = useState<Planche[]>([]);
  const [vue, setVue] = useState(5);
  // une planche ne se peint qu'à sa première visite : 500 bulles d'un coup font attendre celle qu'on regarde
  const [vues, setVues] = useState(new Set([5]));
  const [px, setPx] = useState(92);

  useEffect(() => {
    void (async () => {
      const { melange, claude, gothique, lumiere } = await chargerPlanches();
      const details = melange.map((d, rang) => ({ matiere: MELANGE + d.n, nom: d.fr, rang }));
      const autres = claude.map((d, rang) => ({ matiere: CLAUDE + d.n, nom: d.nom, rang }));
      const filaments = gothique.map((d, rang) => ({ matiere: GOTHIQUE + d.n, nom: d.nom, rang }));
      const lumieres = lumiere.map((d, rang) => ({ matiere: LUMIERE + d.n, nom: d.nom, rang }));
      setPlanches([
        { nom: 'Tes originaux', cases: melange.map((d, rang) => ({ matiere: d.tache, nom: `Tache ${d.tache}`, rang })) },
        { nom: 'Mes détails dans tes taches', cases: details },
        { nom: 'L’autre conversation', cases: autres },
        { nom: 'Les filaments gothiques', cases: filaments },
        { nom: 'Les filaments de lumière (le site maintenant)', cases: lumieres },
        { nom: 'Côte à côte', cases: filaments.flatMap((f, k) => [details[k]!, autres[k]!, f, lumieres[k]!]), trios: true },
      ]);
    })();
  }, []);

  return (
    <Page className="comparer" titre="Comparer les planches">
      <h1 className="page-titre">Comparer les planches</h1>
      <p className="lead">Passe d’une planche à l’autre : chaque bulle garde sa place et sa couleur, seule la matière change.</p>
      <div className="comparer-barre">
        {planches.map((p, i) => (
          <button
            key={p.nom}
            className="bouton"
            aria-pressed={i === vue}
            onClick={() => {
              setVue(i);
              setVues((v) => new Set(v).add(i));
            }}
          >
            {p.nom}
          </button>
        ))}
        <span className="comparer-tailles">
          {TAILLES.map((t) => (
            <button key={t.px} className="bouton" aria-pressed={t.px === px} onClick={() => setPx(t.px)}>
              {t.nom}
            </button>
          ))}
        </span>
      </div>
      {planches[vue]?.trios && (
        <p className="tri-planches">
          Dans chaque groupe de quatre, une seule couleur : mes détails, l’autre conversation, les filaments gothiques, les filaments de lumière.
        </p>
      )}
      {planches.map(
        (p, i) =>
          vues.has(i) && (
            <ul
              key={p.nom}
              className={`comparer-grille${px === 190 ? ' comparer-noms' : ''}${p.trios ? ' comparer-trios' : ''}`}
              hidden={i !== vue}
              style={{ '--taille': `${px}px`, '--colonnes': px === 190 ? 3 : px === 92 ? 9 : 18 } as CSSProperties}
            >
              {p.cases.map((c, k) => (
                <li key={k} title={c.nom}>
                  <BubbleImage id={`comparer-${c.rang}`} couleur={GRIS_PALETTE[(c.rang + 1) % GRIS_PALETTE.length]!.id} matiere={c.matiere} size={190} />
                  <span className="comparer-nom">{c.nom}</span>
                </li>
              ))}
            </ul>
          ),
      )}
    </Page>
  );
}
