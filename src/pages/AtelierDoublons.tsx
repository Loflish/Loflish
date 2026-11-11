import { useEffect, useState } from 'react';
import { BubbleImage } from '../components/Chrome';
import { GRIS_PALETTE } from '../lib/palette';
import { Page } from './Pages';
import { chargerPlanches } from './planches';

/**
 * Les bulles qui se ressemblent (local seulement, jamais publié) : les groupes calculés par design/hd/doublons.py parmi
 * les bulles que Tom aime. Dans chaque groupe, il retire ce qui fait doublon ; ses choix s'écrivent dans
 * design/doublons-choix.json (vite.config.ts). Par défaut, tout est gardé.
 */

interface Bulle {
  n: number;
  planche: number;
  nom: string;
}
interface Groupe {
  id: number;
  score: number;
  bulles: Bulle[];
}

export default function AtelierDoublons() {
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [retirees, setRetirees] = useState<number[] | null>(null);
  const [panne, setPanne] = useState(false);
  const [px, setPx] = useState(150);

  useEffect(() => {
    void Promise.all([
      chargerPlanches(),
      fetch('/__doublons').then((r) => r.json() as Promise<{ groupes: Groupe[] }>),
      fetch('/__doublons-choix')
        .then((r) => (r.ok ? (r.json() as Promise<{ retirees?: number[] }>) : ({} as { retirees?: number[] })))
        .catch(() => ({}) as { retirees?: number[] }),
    ]).then(([, d, c]) => {
      setGroupes(d.groupes);
      setRetirees(c.retirees ?? []);
    });
  }, []);

  useEffect(() => {
    if (!retirees) return;
    fetch('/__doublons-choix', { method: 'POST', body: JSON.stringify({ retirees, maj: new Date().toISOString() }) })
      .then((r) => setPanne(!r.ok))
      .catch(() => setPanne(true));
  }, [retirees]);

  const basculer = (n: number) => setRetirees((r) => (r ? (r.includes(n) ? r.filter((x) => x !== n) : [...r, n]) : [n]));
  const concernees = groupes.reduce((s, g) => s + g.bulles.length, 0);

  return (
    <Page className="atelier" titre="Les bulles qui se ressemblent">
      <h1 className="page-titre">Les bulles qui se ressemblent</h1>
      <p className="lead">
        Parmi celles que tu aimes, {concernees} bulles se ressemblent, en {groupes.length} groupes (la plus forte ressemblance d’abord). Dans chaque groupe,
        retire ce qui fait doublon ; le reste est gardé. Chaque clic s’enregistre.
      </p>
      <p className="tri-compte">
        {retirees?.length ?? 0} retirée{(retirees?.length ?? 0) > 1 ? 's' : ''}
        {panne && ' · ce choix n’a pas pu être écrit dans le fichier : préviens Claude'}
      </p>
      <div className="atelier-barre">
        <span className="comparer-tailles">
          {[42, 92, 150].map((t) => (
            <button key={t} className="bouton" aria-pressed={t === px} onClick={() => setPx(t)}>
              {t === 42 ? 'Dans la constellation' : t === 92 ? 'Zoom' : 'De près'}
            </button>
          ))}
        </span>
      </div>
      {groupes.map((g) => {
        const teinte = GRIS_PALETTE[(g.id * 7) % GRIS_PALETTE.length]!.id;
        return (
          <section key={g.id} className="doublons-groupe">
            <h2 className="doublons-titre">
              Groupe {g.id} · ressemblance {Math.round(g.score * 100)} %
            </h2>
            <ol className="atelier-grille">
              {g.bulles.map((b) => {
                const retiree = retirees?.includes(b.n) ?? false;
                return (
                  <li key={b.n} className={`atelier-carte${retiree ? ' avis-retirer' : ''}`}>
                    <BubbleImage id={`doublon-${b.n}`} couleur={teinte} matiere={b.n} size={px} />
                    <p className="atelier-numero">
                      {b.planche === 2 ? '2' : '3'} {String(b.n % 1000).padStart(2, '0')}
                    </p>
                    <p className="atelier-rappel">{b.nom}</p>
                    <div className="atelier-avis">
                      <button className={retiree ? 'est-actif' : ''} aria-pressed={retiree} onClick={() => basculer(b.n)}>
                        {retiree ? 'Retirée' : 'Retirer'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </Page>
  );
}
