import { useEffect, useState, type CSSProperties } from 'react';
import { BubbleImage } from '../components/Chrome';
import { GRIS_PALETTE } from '../lib/palette';
import { Page } from './Pages';
import { chargerPlanches, CLAUDE, GOTHIQUE, MELANGE } from './planches';

/** Comparer les planches (local seulement, jamais publié) : mêmes places, mêmes couleurs, même couture, seule la matière change. */

const TAILLES = [
  { nom: 'Dans la constellation', px: 42 },
  { nom: 'Zoom', px: 92 },
  { nom: 'Page d’une trace', px: 190 },
];

interface Case {
  matiere: number;
  nom: string;
}

interface Planche {
  nom: string;
  cases: Case[];
}

export default function AtelierComparer() {
  const [planches, setPlanches] = useState<Planche[]>([]);
  const [vue, setVue] = useState(3);
  // une planche ne se peint qu'à sa première visite : 400 bulles d'un coup font attendre celle qu'on regarde
  const [vues, setVues] = useState(new Set([3]));
  const [px, setPx] = useState(92);

  useEffect(() => {
    void (async () => {
      const { melange, claude, gothique } = await chargerPlanches();
      setPlanches([
        { nom: 'Tes originaux', cases: melange.map((d) => ({ matiere: d.tache, nom: `Tache ${d.tache}` })) },
        { nom: 'Mes détails dans tes taches', cases: melange.map((d) => ({ matiere: MELANGE + d.n, nom: d.fr })) },
        { nom: 'L’autre conversation', cases: claude.map((d) => ({ matiere: CLAUDE + d.n, nom: d.nom })) },
        { nom: 'Les filaments gothiques', cases: gothique.map((d) => ({ matiere: GOTHIQUE + d.n, nom: d.nom })) },
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
      {planches.map(
        (p, i) =>
          vues.has(i) && (
            <ul key={p.nom} className={`comparer-grille${px === 190 ? ' comparer-noms' : ''}`} hidden={i !== vue} style={{ '--taille': `${px}px` } as CSSProperties}>
              {p.cases.map((c, k) => (
                <li key={k} title={c.nom}>
                  <BubbleImage id={`comparer-${k}`} couleur={GRIS_PALETTE[(k + 1) % GRIS_PALETTE.length]!.id} matiere={c.matiere} size={190} />
                  <span className="comparer-nom">{c.nom}</span>
                </li>
              ))}
            </ul>
          ),
      )}
    </Page>
  );
}
