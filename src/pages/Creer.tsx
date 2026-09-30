import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BubbleImage, PageTop } from '../components/Chrome';
import { TexteBrode } from '../components/TexteBrode';
import { Icon } from '../components/Icon';
import { peutCreer, publishLocal, useMesTraces } from '../data/store';
import { LIMITES, QUESTIONS, type Trace } from '../data/types';
import { NB_MATIERES, loadCatalogue } from '../lib/hd';
import { GRIS_PALETTE, colorById } from '../lib/palette';
import { hashString } from '../lib/random';
import { useMuseum, useMuseumMode } from '../lib/museum';

/**
 * Créer ma trace — parcours court pour publier, profond ensuite.
 * Créer → Compte → Identité publique → 4 questions → Aperçu → Enrichir → Vérifier → Publier.
 * Le brouillon est privé et enregistré automatiquement.
 */

type Kind = 'personnelle' | 'memoire';

interface Draft {
  kind: Kind | null;
  email: string;
  majeur: boolean;
  identite: 'complet' | 'prenom' | 'pseudo' | 'anonyme';
  nom: string;
  pays: string;
  couleur: string;
  /** matière d'aquarelle de la bulle (1 à 77), choisie dans le catalogue complet */
  matiere: number;
  q: [string, string, string, string];
  relation: string;
  origine: string;
  souvenir: string;
  opts: { archives: boolean; musee: boolean; broderie: boolean; reseaux: boolean };
  droits: boolean;
}

const EMPTY: Draft = {
  kind: null,
  email: '',
  majeur: false,
  identite: 'prenom',
  nom: '',
  pays: '',
  couleur: '',
  matiere: 0,
  q: ['', '', '', ''],
  relation: '',
  origine: '',
  souvenir: '',
  opts: { archives: false, musee: false, broderie: false, reseaux: false },
  droits: false,
};

const KEY = 'nmm:brouillon';

export function Creer() {
  useMuseumMode('creer');
  const { engine } = useMuseum();
  const navigate = useNavigate();
  const [d, setD] = useState<Draft>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const x: Draft = raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
      // un brouillon pour une bulle déjà émise ne peut pas aboutir (deux bulles au plus, différentes)
      if (x.kind && !peutCreer(x.kind)) x.kind = null;
      // une matière est déjà posée au hasard : on peut la garder ou en choisir une autre
      return x.matiere ? x : { ...x, matiere: 1 + Math.floor(Math.random() * NB_MATIERES) };
    } catch {
      return { ...EMPTY, matiere: 1 + Math.floor(Math.random() * NB_MATIERES) };
    }
  });
  const [step, setStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(d));
        setSaved(true);
      } catch {
        /* ignore */
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [d]);

  const colonne = useRef<HTMLDivElement>(null);
  const firstStep = useRef(true);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    // accessibilité : le focus suit l'étape
    colonne.current?.querySelector<HTMLElement>('.etape-compteur')?.focus();
  }, [step]);

  const up = (p: Partial<Draft>) => {
    setSaved(false);
    setD((x) => ({ ...x, ...p }));
  };

  const steps = d.kind === 'memoire' ? ['Choisir', 'Compte', 'La personne', 'Un premier souvenir', 'Aperçu', 'Vérifier'] : ['Choisir', 'Compte', 'Identité', 'Les 4 questions', 'Aperçu', 'Enrichir', 'Vérifier'];
  const last = steps.length - 1;
  const displayName = d.identite === 'anonyme' ? 'Anonyme' : d.nom.trim() || (d.kind === 'memoire' ? 'La personne' : 'Ton nom');
  const draftId = useMemo(() => `moi-${Math.random().toString(36).slice(2, 8)}`, []);

  const canNext = (() => {
    if (step === 0) return !!d.kind;
    if (step === 1) return /.+@.+\..+/.test(d.email) && d.majeur;
    if (step === 2) return (d.identite === 'anonyme' || d.nom.trim().length > 0) && !!d.couleur;
    if (step === 3) return d.kind === 'memoire' ? d.souvenir.trim().length > 0 : d.q.every((x) => x.trim().length > 0);
    if (step === last) return d.droits;
    return true;
  })();

  const publish = () => {
    setPublishing(true);
    const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const t: Trace = {
      id: draftId,
      nom: displayName,
      type: d.kind === 'memoire' ? 'memoire' : 'personnelle',
      couleur: d.couleur,
      matiere: d.matiere,
      pays: d.pays || undefined,
      creeLe: today,
      majLe: today,
      questions: d.kind === 'memoire' ? undefined : d.q,
      memoire:
        d.kind === 'memoire'
          ? { deposeePar: 'Toi', relation: d.relation || undefined, origine: d.origine || undefined, aperçu: d.souvenir.slice(0, 200) }
          : undefined,
      rubriques: d.kind === 'memoire' ? { souvenirs: [{ id: 'm0', texte: d.souvenir }] } : {},
      medias: [],
      versions: [{ v: 1, date: today, note: 'Création du profil' }],
      parametres: {
        droitsReutilisation: d.opts.broderie || d.opts.musee,
        archivageLongueDuree: d.opts.archives,
        choixApresDeces: 'Laisser ma trace telle quelle',
        reseauxSociaux: d.opts.reseaux,
        feedbackPrive: true,
      },
    };
    window.setTimeout(() => {
      publishLocal(t);
      engine.current?.addPresence({ id: t.id, nom: t.nom, hex: colorById(t.couleur).hex, matiere: t.matiere });
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* ignore */
      }
      navigate(`/trace/${t.id}`);
    }, 4200);
  };

  useMesTraces(); // se met à jour si une bulle est publiée ailleurs
  const libre = { personnelle: peutCreer('personnelle'), memoire: peutCreer('memoire') };

  if (!publishing && !libre.personnelle && !libre.memoire) {
    return (
      <main className="page page-texte creer">
        <PageTop />
        <div className="page-corps emerge">
          <h1 className="page-titre">Tu as tes deux bulles</h1>
          <p className="lead">
            Chaque personne peut émettre deux bulles au plus : sa propre trace, et une mémoire pour une personne décédée. Les tiennes
            sont déjà dans le musée.
          </p>
          <Link to="/ma-trace" className="lien-entrer">
            Retrouver ma trace <Icon name="fleche" size={16} />
          </Link>
        </div>
      </main>
    );
  }

  if (publishing) {
    return (
      <main className="page creer creer-publication" aria-live="polite">
        <div className="publication">
          <BubbleImage id={draftId} couleur={d.couleur || 'b1'} matiere={d.matiere} size={180} className="rejoint" />
          <p className="publication-texte">Ta bulle rejoint les autres.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page creer">
      <PageTop />
      <div className="creer-colonne" ref={colonne}>
        <p className="etape-compteur" tabIndex={-1}>
          Étape {step + 1} sur {steps.length} — {steps[step]}
          <span className={`brouillon${saved ? ' is-saved' : ''}`}>{saved ? 'Brouillon privé enregistré' : 'Enregistrement…'}</span>
        </p>

        {step === 0 && (
          <section className="etape">
            <h1 className="etape-titre">Que souhaites-tu créer ?</h1>
            <div className="choix">
              <button
                className="choix-item"
                aria-pressed={d.kind === 'personnelle'}
                disabled={!libre.personnelle}
                onClick={() => up({ kind: 'personnelle' })}
              >
                <span className="choix-titre">Ma propre trace</span>
                <span className="choix-texte">
                  {libre.personnelle ? 'Tu réponds toi-même aux quatre questions.' : 'Ta trace est déjà dans le musée.'}
                </span>
              </button>
              <button className="choix-item" aria-pressed={d.kind === 'memoire'} disabled={!libre.memoire} onClick={() => up({ kind: 'memoire' })}>
                <span className="choix-titre">Une mémoire pour une personne décédée</span>
                <span className="choix-texte">
                  {libre.memoire
                    ? 'Tu transmets ce que tu sais réellement d’elle, sans lui prêter de dernières paroles.'
                    : 'Tu as déjà déposé une mémoire.'}
                </span>
              </button>
            </div>
            <p className="muted petit">
              Chaque personne peut émettre deux bulles au plus : sa propre trace, et une mémoire pour une personne décédée.
            </p>
          </section>
        )}

        {step === 1 && (
          <section className="etape">
            <h1 className="etape-titre">Ton compte</h1>
            <p className="etape-texte">Ton adresse e-mail n’apparaîtra jamais sur ta trace. Aucune pièce d’identité n’est demandée.</p>
            <label className="field">
              <span className="field-label">Adresse e-mail</span>
              <input type="email" autoComplete="email" value={d.email} onChange={(e) => up({ email: e.target.value })} />
            </label>
            <label className="check">
              <input type="checkbox" checked={d.majeur} onChange={(e) => up({ majeur: e.target.checked })} />
              <span>J’ai 18 ans ou plus.</span>
            </label>
            <aside className="mot-fondateur" aria-labelledby="h-mot">
              <p id="h-mot" className="mot-fondateur-titre">
                Un mot avant de commencer
              </p>
              <p>Laisser sa trace, ce n’est pas dire adieu. Ce musée existe pour célébrer des vies, jamais pour y mettre fin.</p>
              <p>
                Si tu penses au suicide, je t’en prie, n’en fais rien : parle à quelqu’un maintenant. Des personnes formées t’écoutent,
                gratuitement, partout dans le monde et dans ta langue :{' '}
                <a href="https://findahelpline.com" target="_blank" rel="noreferrer">
                  findahelpline.com
                </a>
                . En cas de danger immédiat, appelle les services d’urgence.
              </p>
              <p>
                J’ai créé Nos mots mémoriaux pour lutter contre l’oubli. Je refuse de porter sur ma conscience la mort de qui que ce soit :
                ta vie compte infiniment plus que ta trace.
              </p>
              <p className="mot-fondateur-signature">— la personne qui a créé ce musée</p>
            </aside>
            <p className="muted petit">Prototype : aucun compte n’est réellement créé, rien n’est envoyé.</p>
          </section>
        )}

        {step === 2 && (
          <section className="etape">
            <h1 className="etape-titre">{d.kind === 'memoire' ? 'La personne' : 'Comment souhaites-tu apparaître ?'}</h1>
            {d.kind === 'personnelle' && (
              <div className="chips" role="radiogroup" aria-label="Forme du nom affiché">
                {(
                  [
                    ['complet', 'Prénom et nom'],
                    ['prenom', 'Prénom seul'],
                    ['pseudo', 'Pseudonyme'],
                    ['anonyme', 'Anonyme'],
                  ] as const
                ).map(([v, l]) => (
                  <button key={v} role="radio" className="chip" aria-checked={d.identite === v} aria-pressed={d.identite === v} onClick={() => up({ identite: v })}>
                    {l}
                  </button>
                ))}
              </div>
            )}
            {d.identite !== 'anonyme' || d.kind === 'memoire' ? (
              <label className="field">
                <span className="field-label">{d.kind === 'memoire' ? 'Comment souhaites-tu l’identifier ?' : 'Nom affiché'}</span>
                <input value={d.nom} onChange={(e) => up({ nom: e.target.value })} maxLength={60} />
              </label>
            ) : null}
            {d.kind === 'memoire' && (
              <>
                <label className="field">
                  <span className="field-label">Quelle était ta relation avec elle ? (facultatif)</span>
                  <input value={d.relation} onChange={(e) => up({ relation: e.target.value })} />
                </label>
                <label className="field">
                  <span className="field-label">D’où viennent ces souvenirs ? (facultatif)</span>
                  <textarea rows={3} value={d.origine} onChange={(e) => up({ origine: e.target.value })} />
                </label>
              </>
            )}
            <label className="field">
              <span className="field-label">Pays associé à {d.kind === 'memoire' ? 'cette mémoire' : 'ma trace'} (facultatif, encouragé)</span>
              <input value={d.pays} onChange={(e) => up({ pays: e.target.value })} maxLength={48} />
            </label>
            <BulleChoix couleur={d.couleur} matiere={d.matiere} seed={draftId} onChange={up} />
          </section>
        )}

        {step === 3 && d.kind === 'personnelle' && (
          <section className="etape etape-questions">
            <h1 className="sr-only">Les quatre questions</h1>
            {QUESTIONS.map((q, i) => {
              const max = i === 3 ? LIMITES.q4 : LIMITES.q;
              return (
                <label key={i} className="question-champ">
                  <span className="question-libelle">{q}</span>
                  <textarea
                    rows={i === 3 ? 3 : 6}
                    maxLength={max}
                    value={d.q[i]}
                    onChange={(e) => {
                      const q2 = [...d.q] as Draft['q'];
                      q2[i] = e.target.value;
                      up({ q: q2 });
                    }}
                  />
                  <span className="compteur" aria-live="off">
                    {d.q[i].length} / {max}
                  </span>
                </label>
              );
            })}
          </section>
        )}

        {step === 3 && d.kind === 'memoire' && (
          <section className="etape">
            <h1 className="etape-titre">Un premier souvenir</h1>
            <p className="etape-texte">Un souvenir réel, vécu ou transmis. Tu pourras ajouter lieux, œuvres, personnes et médias ensuite.</p>
            <label className="field">
              <span className="sr-only">Souvenir</span>
              <textarea rows={7} maxLength={1200} value={d.souvenir} onChange={(e) => up({ souvenir: e.target.value })} />
              <span className="compteur">{d.souvenir.length} / 1200</span>
            </label>
          </section>
        )}

        {step === 4 && (
          <section className="etape etape-apercu">
            <h1 className="etape-titre">Voilà comment ta bulle apparaîtra dans le musée.</h1>
            <div className="apercu-demo">
              <BubbleImage id={draftId} couleur={d.couleur || 'b1'} matiere={d.matiere} size={150} className="breathing" />
              <div>
                <p className="apercu-nom">{displayName}</p>
                <p className="apercu-type">{d.kind === 'memoire' ? 'Mémoire pour une personne décédée' : 'Trace personnelle'}</p>
                <p className="apercu-texte">
                  <TexteBrode texte={d.kind === 'memoire' ? d.souvenir.slice(0, 200) : d.q[3]} />
                </p>
              </div>
            </div>
            <p className="muted petit">Au survol, on ne voit que ton nom. Au clic, cet aperçu apparaît, puis on peut entrer dans ta mémoire.</p>
          </section>
        )}

        {step === 5 && d.kind === 'personnelle' && (
          <section className="etape">
            <h1 className="etape-titre">Ta trace est prête.</h1>
            <p className="etape-texte">
              Tu peux la publier maintenant, et revenir quand tu veux pour y ajouter tes fragments d’existence : les cinq sens, tes souvenirs,
              les chapitres de ta vie, les œuvres qui t’ont marqué, les lieux, les personnes…
            </p>
            <p className="etape-texte">Une existence n’est jamais « complète » : rien ne presse.</p>
          </section>
        )}

        {step === last && (
          <section className="etape">
            <h1 className="etape-titre">Avant de publier</h1>
            <div className="verif">
              <h2>{d.kind === 'memoire' ? 'Cette mémoire sera publique et scellée' : 'Ta trace sera publique et scellée'}</h2>
              <p>
                En publiant, {d.kind === 'memoire' ? 'les 200 caractères et le premier souvenir sont scellés' : 'tes quatre réponses sont scellées'}{' '}
                : ils ne pourront plus être modifiés pendant cinq ans. Chaque fragment que tu ajouteras ensuite sera scellé à son tour, au
                moment où tu le déposes.
              </p>
              <p>Tout ce qui est publié pourra être lu par n’importe quel visiteur, retrouvé par la recherche, et partagé ou capturé par d’autres.</p>
              <label className="check">
                <input type="checkbox" checked={d.droits} onChange={(e) => up({ droits: e.target.checked })} />
                <span>J’autorise Nos mots mémoriaux à héberger et afficher les contenus publics de ma trace.</span>
              </label>
            </div>
            <div className="verif">
              <h2>Choix facultatifs</h2>
              <p className="muted petit">Les refuser n’empêche pas la publication. Tu pourras les modifier plus tard.</p>
              {(
                [
                  ['archives', 'Intégrer ma trace aux futures archives patrimoniales longue durée'],
                  ['musee', 'Permettre sa présentation dans le futur musée et les expositions physiques'],
                  ['broderie', 'Permettre que mes mots deviennent une œuvre brodée'],
                  ['reseaux', 'Permettre sa présentation sur les réseaux sociaux du projet'],
                ] as const
              ).map(([k, l]) => (
                <label key={k} className="check">
                  <input type="checkbox" checked={d.opts[k]} onChange={(e) => up({ opts: { ...d.opts, [k]: e.target.checked } })} />
                  <span>{l}</span>
                </label>
              ))}
            </div>
          </section>
        )}

        <div className="etape-actions">
          {step > 0 ? (
            <button className="lien-discret" onClick={() => setStep((s) => s - 1)}>
              <Icon name="retour" size={16} /> Retour
            </button>
          ) : (
            <Link to="/" className="lien-discret">
              <Icon name="retour" size={16} /> Retour au musée
            </Link>
          )}
          {step < last ? (
            <button className="bouton" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              {step === 5 ? 'Vérifier et publier' : 'Continuer'}
            </button>
          ) : (
            <button className="bouton" disabled={!canNext} onClick={publish}>
              Sceller et publier ma trace
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * Choisir sa bulle : une couleur de GRIS et une matière d'aquarelle, parmi le
 * catalogue complet. Les matières sont posées comme des taches sur une feuille,
 * chacune déjà dans la couleur choisie ; la bulle se transforme à chaque essai.
 */
function BulleChoix({
  couleur,
  matiere,
  seed,
  onChange,
}: {
  couleur: string;
  matiere: number;
  seed: string;
  onChange: (p: { couleur?: string; matiere?: number }) => void;
}) {
  const teinte = couleur || 'b1';
  useEffect(() => {
    void loadCatalogue();
  }, []);
  const matieres = useMemo(() => Array.from({ length: NB_MATIERES }, (_, i) => i + 1), []);
  return (
    <div className="bulle-choix">
      <div className="bulle-choix-apercu">
        <BubbleImage key={`${teinte}-${matiere}`} id={seed} couleur={teinte} matiere={matiere} size={150} className="breathing bulle-change" />
      </div>
      <div className="bulle-choix-options">
        <fieldset className="couleurs">
          <legend className="field-label">Choisis la couleur de ta bulle</legend>
          <div className="couleurs-grille" role="radiogroup" aria-label="Couleur de la bulle">
            {GRIS_PALETTE.map((c) => (
              <button key={c.id} role="radio" aria-checked={couleur === c.id} aria-label={c.label} className="couleur" onClick={() => onChange({ couleur: c.id })}>
                <BubbleImage id={seed} couleur={c.id} matiere={matiere} size={46} />
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="couleurs matieres">
          <legend className="field-label">Choisis sa matière</legend>
          <div className="matieres-feuille" role="radiogroup" aria-label="Matière de la bulle">
            {matieres.map((n) => {
              // posées à la main : un léger décalage, jamais une grille parfaite
              const h = hashString(`matiere-${n}`);
              const dx = ((h % 9) - 4) * 0.6;
              const dy = (((h >> 4) % 9) - 4) * 0.6;
              return (
                <button
                  key={n}
                  role="radio"
                  aria-checked={matiere === n}
                  aria-label={`Matière ${n} sur ${NB_MATIERES}`}
                  className="couleur matiere"
                  style={{ transform: `translate(${dx}px, ${dy}px)` }}
                  onClick={() => onChange({ matiere: n })}
                >
                  <BubbleImage id={seed} couleur={teinte} matiere={n} size={46} />
                </button>
              );
            })}
          </div>
          <button type="button" className="lien-discret matiere-hasard" onClick={() => onChange({ matiere: 1 + Math.floor(Math.random() * NB_MATIERES) })}>
            Au hasard
          </button>
        </fieldset>
      </div>
    </div>
  );
}
