import { useEffect, useState, type CSSProperties } from 'react';
import { BubbleImage } from '../components/Chrome';
import { chargerMatiere } from '../lib/hd';
import { GRIS_PALETTE } from '../lib/palette';
import { Page } from './Pages';

/**
 * Comparer les planches (local seulement, jamais publié) : mêmes places, mêmes couleurs, même couture, seule la matière change.
 * public/hd/taches-melange vient de design/hd/taches_melange.py ; public/hd/taches-claude, ce sont les 100 bulles de
 * research_notes/Goût constellation/bulles-claude, réduites à 512 px.
 */

/** numéros des matières fabriquées ici, loin du catalogue */
const MELANGE = 3000;
const CLAUDE = 4000;
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
  const [vue, setVue] = useState(0);
  const [px, setPx] = useState(92);

  useEffect(() => {
    void (async () => {
      const [melange, claude] = (await Promise.all([
        fetch('/hd/taches-melange/index.json').then((r) => r.json()),
        fetch('/hd/taches-claude/index.json').then((r) => r.json()),
      ])) as [{ n: number; tache: number; fr: string }[], { n: number; nom: string; f: string }[]];
      await Promise.all([
        ...melange.map((d) => chargerMatiere(MELANGE + d.n, `/hd/taches-melange/melange-${String(d.n).padStart(3, '0')}.webp`)),
        ...claude.map((d) => chargerMatiere(CLAUDE + d.n, `/hd/taches-claude/${d.f}`)),
      ]);
      setPlanches([
        { nom: 'Tes originaux', cases: melange.map((d) => ({ matiere: d.tache, nom: `Tache ${d.tache}` })) },
        { nom: 'Mes détails dans tes taches', cases: melange.map((d) => ({ matiere: MELANGE + d.n, nom: d.fr })) },
        { nom: 'L’autre conversation', cases: claude.map((d) => ({ matiere: CLAUDE + d.n, nom: d.nom })) },
      ]);
    })();
  }, []);

  return (
    <Page className="comparer" titre="Comparer les planches">
      <h1 className="page-titre">Comparer les planches</h1>
      <p className="lead">Passe d’une planche à l’autre : chaque bulle garde sa place et sa couleur, seule la matière change.</p>
      <div className="comparer-barre">
        {planches.map((p, i) => (
          <button key={p.nom} className="bouton" aria-pressed={i === vue} onClick={() => setVue(i)}>
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
      {planches.map((p, i) => (
        <ul key={p.nom} className={`comparer-grille${px === 190 ? ' comparer-noms' : ''}`} hidden={i !== vue} style={{ '--taille': `${px}px` } as CSSProperties}>
          {p.cases.map((c, k) => (
            <li key={k} title={c.nom}>
              <BubbleImage id={`comparer-${k}`} couleur={GRIS_PALETTE[(k + 1) % GRIS_PALETTE.length]!.id} matiere={c.matiere} size={190} />
              <span className="comparer-nom">{c.nom}</span>
            </li>
          ))}
        </ul>
      ))}
    </Page>
  );
}
