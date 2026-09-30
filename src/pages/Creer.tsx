import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BubbleImage, PageTop } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { publishLocal } from '../data/store';
import { LIMITES, QUESTIONS, type Trace } from '../data/types';
import { GRIS_PALETTE, colorById } from '../lib/palette';
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
  pronoms: string;
  pays: string;
  couleur: string;
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
  pronoms: '',
  pays: '',
  couleur: '',
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
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
    } catch {
      return EMPTY;
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
      pronoms: d.pronoms || undefined,
      type: d.kind === 'memoire' ? 'memoire' : 'personnelle',
      couleur: d.couleur,
      pays: d.pays || undefined,
      creeLe: today,
      majLe: today,
      questions: d.kind === 'memoire' ? undefined : d.q,
      memoire:
        d.kind === 'memoire'
          ? { deposeePar: 'Toi', relation: d.relation || undefined, origine: d.origine || undefined, aperçu: d.souvenir.slice(0, 200) }
          : undefined,
      rubriques: d.kind === 'memoire' ? { souvenirs: [{ id: 'm0', texte: d.souvenir, enAvant: true }] } : {},
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
      engine.current?.addPresence({ id: t.id, nom: t.nom, hex: colorById(t.couleur).hex });
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* ignore */
      }
      navigate(`/trace/${t.id}`);
    }, 4200);
  };

  if (publishing) {
    return (
      <main className="page creer creer-publication" aria-live="polite">
        <div className="publication">
          <BubbleImage id={draftId} couleur={d.couleur || 'b1'} size={180} className="rejoint" />
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
              <button className="choix-item" aria-pressed={d.kind === 'personnelle'} onClick={() => up({ kind: 'personnelle' })}>
                <span className="choix-titre">Ma propre trace</span>
                <span className="choix-texte">Tu réponds toi-même aux quatre questions.</span>
              </button>
              <button className="choix-item" aria-pressed={d.kind === 'memoire'} onClick={() => up({ kind: 'memoire' })}>
                <span className="choix-titre">Une mémoire pour une personne décédée</span>
                <span className="choix-texte">Tu transmets ce que tu sais réellement d’elle, sans lui prêter de dernières paroles.</span>
              </button>
            </div>
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
            {d.kind === 'personnelle' && (
              <label className="field">
                <span className="field-label">Pronoms (facultatif)</span>
                <input value={d.pronoms} onChange={(e) => up({ pronoms: e.target.value })} maxLength={24} placeholder="elle, il, iel…" />
              </label>
            )}
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
            <ColorPicker value={d.couleur} onChange={(couleur) => up({ couleur })} seed={draftId} />
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
              <BubbleImage id={draftId} couleur={d.couleur || 'b1'} size={150} className="breathing" />
              <div>
                <p className="apercu-nom">{displayName}</p>
                <p className="apercu-type">{d.kind === 'memoire' ? 'Mémoire pour une personne décédée' : 'Trace personnelle'}</p>
                <p className="apercu-texte">{d.kind === 'memoire' ? d.souvenir.slice(0, 200) : d.q[3]}</p>
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
              <h2>Ta trace sera publique</h2>
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
              Publier ma trace dans Nos mots mémoriaux
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function ColorPicker({ value, onChange, seed }: { value: string; onChange: (id: string) => void; seed: string }) {
  return (
    <fieldset className="couleurs">
      <legend className="field-label">Choisis la couleur de ta bulle</legend>
      <div className="couleurs-grille" role="radiogroup" aria-label="Couleur de la bulle">
        {GRIS_PALETTE.map((c) => (
          <button key={c.id} role="radio" aria-checked={value === c.id} aria-label={c.label} className="couleur" onClick={() => onChange(c.id)}>
            <BubbleImage id={`${seed}-${c.id}`} couleur={c.id} size={46} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
