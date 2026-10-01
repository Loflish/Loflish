import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BubbleImage, PageTop } from '../components/Chrome';
import { TexteBrode } from '../components/TexteBrode';
import { Icon } from '../components/Icon';
import { dateLongue, peutCreer, publier, publishLocal, retenirEmailLocal, useCompte, useMesTraces } from '../data/store';
import { EN_LIGNE } from '../lib/api';
import { CONTACT } from '../lib/contact';
import { FormulaireCode } from './Pages';
import { LIMITES, QUESTION_MEMOIRE, QUESTIONS, type Trace } from '../data/types';
import { MATIERE_COUSUE, NB_MATIERES, loadCatalogue } from '../lib/hd';
import { GRIS_PALETTE, colorById } from '../lib/palette';
import { listePays, PAYS_AUTRE } from '../lib/pays';
import { useMuseum, useMuseumMode } from '../lib/museum';

/**
 * Créer ma trace : un parcours court pour publier, profond ensuite.
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
  /** matière de la bulle (0 = aquarelle cousue, 1 à 92 = taches), choisie dans le catalogue complet ; -1 tant qu'elle n'est pas tirée */
  matiere: number;
  q: [string, string, string, string];
  /** facultatif : à qui pense la personne en répondant à la question 2 */
  q2Dest: string;
  /** mémoire : le prénom de qui la dépose (facultatif) et son lien avec la personne */
  deposant: string;
  relation: string;
  /** mémoire : « Que peux-tu me dire sur cette personne ? » (500 caractères, aussi l'aperçu de sa bulle) */
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
  matiere: -1,
  q: ['', '', '', ''],
  q2Dest: '',
  deposant: '',
  relation: '',
  souvenir: '',
  opts: { archives: false, musee: false, broderie: false, reseaux: false },
  droits: false,
};

const KEY = 'nmm:brouillon';

/** Une matière au hasard dans tout le catalogue : l'aquarelle cousue (0) ou l'une des 92 taches. */
function matiereAuHasard(): number {
  return Math.floor(Math.random() * (NB_MATIERES + 1));
}

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
      return x.matiere >= 0 ? x : { ...x, matiere: matiereAuHasard() };
    } catch {
      return { ...EMPTY, matiere: matiereAuHasard() };
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

  const steps = d.kind === 'memoire' ? ['Choisir', 'Compte', 'La personne', 'Ce que tu sais d’elle', 'Aperçu', 'Vérifier'] : ['Choisir', 'Compte', 'Identité', 'Les 4 questions', 'Aperçu', 'Enrichir', 'Vérifier'];
  const last = steps.length - 1;
  const displayName = d.identite === 'anonyme' ? 'Anonyme' : d.nom.trim() || (d.kind === 'memoire' ? 'La personne' : 'Ton nom');
  const draftId = useMemo(() => `moi-${Math.random().toString(36).slice(2, 8)}`, []);

  const { compte } = useCompte();
  const canNext = (() => {
    if (step === 0) return !!d.kind;
    if (step === 1) return (EN_LIGNE ? !!compte : /.+@.+\..+/.test(d.email)) && d.majeur;
    if (step === 2) return (d.identite === 'anonyme' || d.nom.trim().length > 0) && !!d.couleur;
    if (step === 3) return d.kind === 'memoire' ? d.souvenir.trim().length > 0 : d.q.every((x) => x.trim().length > 0);
    if (step === last) return d.droits;
    return true;
  })();

  const [attente, setAttente] = useState<'' | 'erreur'>('');
  const [messageServeur, setMessageServeur] = useState('');

  /** La bulle rejoint les autres : la constellation l'accueille, puis son profil s'ouvre. */
  const terminer = (t: Trace) => {
    setPublishing(true);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    window.setTimeout(() => {
      engine.current?.addPresence({ id: t.id, nom: t.nom, hex: colorById(t.couleur).hex, matiere: t.matiere });
      navigate(`/trace/${t.id}`);
    }, 4200);
  };

  const publish = async () => {
    const t = construire();
    if (!EN_LIGNE) {
      publishLocal(t);
      retenirEmailLocal(d.email);
      return terminer(t);
    }
    try {
      setAttente('');
      const r = await publier(t, d.majeur);
      // la session a pu se fermer entre-temps : on revient à l'étape du compte
      if (r.connexion) {
        setStep(1);
        return;
      }
      terminer(r.trace!);
    } catch (e) {
      setMessageServeur(e instanceof Error ? e.message : 'La trace n’a pas pu être publiée.');
      setAttente('erreur');
    }
  };

  function construire(): Trace {
    const today = dateLongue(new Date());
    const t: Trace = {
      id: draftId,
      nom: displayName,
      type: d.kind === 'memoire' ? 'memoire' : 'personnelle',
      couleur: d.couleur,
      matiere: d.matiere >= 0 ? d.matiere : undefined,
      pays: d.pays || undefined,
      creeLe: today,
      majLe: today,
      questions: d.kind === 'memoire' ? undefined : (d.q.map((x) => x.trim()) as Draft['q']),
      q2Destinataire: d.kind === 'memoire' ? undefined : d.q2Dest.trim() || undefined,
      memoire: d.kind === 'memoire' ? deposant() : undefined,
      rubriques: {},
      medias: [],
      parametres: {
        droitsReutilisation: d.opts.broderie,
        archivageLongueDuree: d.opts.archives,
        choixApresDeces: 'Laisser ma trace telle quelle',
        reseauxSociaux: d.opts.reseaux,
        feedbackPrive: true,
      },
    };
    return t;
  }

  /** Qui dépose la mémoire : « Léa, sa petite-fille », « sa petite-fille », ou « un proche ». */
  function deposant(): NonNullable<Trace['memoire']> {
    const prenom = d.deposant.trim();
    const lien = d.relation.trim();
    const minuscule = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);
    return {
      deposeePar: prenom || (lien ? minuscule(lien) : 'un proche'),
      relation: prenom && lien ? lien : undefined,
      aperçu: d.souvenir.trim().slice(0, LIMITES.memoire),
    };
  }

  useMesTraces(); // se met à jour si une bulle est publiée ailleurs
  const libre = { personnelle: peutCreer('personnelle'), memoire: peutCreer('memoire') };

  if (!publishing && !libre.personnelle && !libre.memoire) {
    return (
      <main className="page page-texte creer">
        <PageTop />
        <div className="page-corps">
          <h1 className="page-titre">Tu as déjà tes deux bulles</h1>
          <p className="lead">
            Il n’est pas possible d’en créer une autre : chaque personne peut avoir deux bulles au plus, sa propre trace et une mémoire pour
            une personne décédée. Les tiennes sont déjà dans le musée.
          </p>
          <Link to="/compte" className="lien-entrer">
            Retrouver mes traces <Icon name="fleche" size={16} />
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
          Étape {step + 1} sur {steps.length}
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
              Chaque personne peut avoir deux bulles au plus : sa propre trace, et une mémoire pour une personne décédée.
            </p>
          </section>
        )}

        {step === 1 && (
          <section className="etape">
            <h1 className="etape-titre">Ton compte</h1>
            <p className="etape-texte">
              Ton adresse e-mail te permet de retrouver tes bulles : tu reçois un code à six chiffres pour entrer, sans mot de passe. Elle
              n’apparaîtra jamais sur ta trace.
            </p>
            {EN_LIGNE ? (
              compte ? (
                <p className="compte-ok">
                  Tu es connecté avec <strong>{compte.email}</strong>.
                </p>
              ) : (
                <FormulaireCode onEntre={() => undefined} emailInitial={d.email} />
              )
            ) : (
              <label className="field">
                <span className="field-label">Adresse e-mail</span>
                <input type="email" autoComplete="email" value={d.email} onChange={(e) => up({ email: e.target.value })} />
              </label>
            )}
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
                J’ai créé Nos Mots Mémoriaux pour lutter contre l’oubli. Je refuse de porter sur ma conscience la mort de qui que ce soit :
                ta vie compte infiniment plus que ta trace.
              </p>
            </aside>
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
              <div className="editeur-rang">
                <label className="field">
                  <span className="field-label">Ton prénom (facultatif)</span>
                  <input value={d.deposant} onChange={(e) => up({ deposant: e.target.value })} maxLength={40} />
                </label>
                <label className="field">
                  <span className="field-label">Ton lien avec elle (facultatif)</span>
                  <input value={d.relation} onChange={(e) => up({ relation: e.target.value })} maxLength={60} placeholder="sa petite-fille, son ami…" />
                </label>
              </div>
            )}
            <label className="field">
              <span className="field-label">Pays associé à {d.kind === 'memoire' ? 'cette mémoire' : 'ma trace'} (facultatif)</span>
              <select value={d.pays} onChange={(e) => up({ pays: e.target.value })}>
                <option value="">Aucun</option>
                {listePays().map((p) => (
                  <option key={p}>{p}</option>
                ))}
                <option value={PAYS_AUTRE}>Autre</option>
              </select>
            </label>
            <BulleChoix couleur={d.couleur} matiere={d.matiere} seed={draftId} onChange={up} memoire={d.kind === 'memoire'} />
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
                  {i === 1 && (
                    <span className="question-qui">
                      <span className="field-label">Qui ? (facultatif)</span>
                      <input value={d.q2Dest} maxLength={120} placeholder="ma mère, Inès, mes amis…" onChange={(e) => up({ q2Dest: e.target.value })} />
                    </span>
                  )}
                </label>
              );
            })}
          </section>
        )}

        {step === 3 && d.kind === 'memoire' && (
          <section className="etape">
            <h1 className="etape-titre">{QUESTION_MEMOIRE}</h1>
            <p className="etape-texte">
              Ce qu’elle était, ce qu’elle aimait, ce que tu gardes d’elle : ce que tu sais réellement, sans lui prêter de dernières paroles. Ces
              mots apparaîtront sur sa bulle, dans le musée. Tu pourras ensuite ajouter ses souvenirs, ses lieux, ses œuvres, des photos.
            </p>
            <label className="field">
              <span className="sr-only">{QUESTION_MEMOIRE}</span>
              <textarea rows={7} maxLength={LIMITES.memoire} value={d.souvenir} onChange={(e) => up({ souvenir: e.target.value })} />
              <span className="compteur">
                {d.souvenir.length} / {LIMITES.memoire}
              </span>
            </label>
          </section>
        )}

        {step === 4 && (
          <section className="etape etape-apercu">
            <h1 className="etape-titre">{d.kind === 'memoire' ? 'Voilà comment sa bulle apparaîtra dans le musée.' : 'Voilà comment ta bulle apparaîtra dans le musée.'}</h1>
            <div className={`apercu-demo${d.kind === 'memoire' ? ' apercu-memoire' : ''}`}>
              <BubbleImage id={draftId} couleur={d.couleur || 'b1'} matiere={d.matiere} size={150} className="breathing" />
              <div>
                <p className="apercu-nom">{displayName}</p>
                <p className="apercu-type">{d.kind === 'memoire' ? 'Mémoire pour une personne décédée' : 'Trace personnelle'}</p>
                <p className="apercu-texte">
                  <TexteBrode texte={d.kind === 'memoire' ? d.souvenir.trim() : d.q[3]} />
                </p>
              </div>
            </div>
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
                En publiant, {d.kind === 'memoire' ? 'ce que tu as écrit sur cette personne est scellé' : 'tes quatre réponses sont scellées'} : rien ne
                pourra être modifié pendant cinq ans. Chaque fragment que tu ajouteras ensuite sera scellé à son tour, au moment où tu le déposes.
              </p>
              <p>Tout ce qui est publié pourra être lu par n’importe quel visiteur, retrouvé par la recherche, et partagé par d’autres.</p>
              <label className="check">
                <input type="checkbox" checked={d.droits} onChange={(e) => up({ droits: e.target.checked })} />
                <span>J’autorise Nos Mots Mémoriaux à garder et à montrer ce que je publie.</span>
              </label>
            </div>
            <div className="verif">
              <h2>Tes données restent à toi</h2>
              <p>
                Où que tu vives, tes données t’appartiennent. Le scellement ne retire aucun de tes droits : à tout moment, tu peux m’écrire pour
                consulter, modifier ou supprimer tes données, toutes ou en partie, sans avoir à te justifier. Ton adresse e-mail n’est jamais
                montrée, jamais vendue, jamais partagée.
              </p>
              <p>
                <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
              </p>
            </div>
            <div className="verif">
              <h2>Choix facultatifs</h2>
              <p className="muted petit">Les refuser n’empêche pas la publication. Tu pourras les modifier plus tard.</p>
              {(
                [
                  ['archives', 'Confier une copie de ma trace à une archive faite pour traverser les siècles (comme l’Arctic World Archive)'],
                  ['broderie', 'Permettre que mes mots soient présentés dans le futur musée et deviennent une œuvre brodée à la main'],
                  ['reseaux', 'Permettre que certains de mes mots soient partagés sur les réseaux sociaux du projet'],
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
            <button className="bouton" disabled={!canNext} onClick={() => void publish()}>
              {d.kind === 'memoire' ? 'Sceller et publier sa mémoire' : 'Sceller et publier ma trace'}
            </button>
          )}
          {attente === 'erreur' && (
            <p className="editeur-erreur" role="alert">
              {messageServeur}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * Choisir sa bulle : une couleur de GRIS et une matière d'aquarelle. Les
 * flèches, de chaque côté de la bulle, font défiler toutes les matières ; la
 * bulle se transforme à chaque essai.
 */
function BulleChoix({
  couleur,
  matiere,
  seed,
  onChange,
  memoire = false,
}: {
  couleur: string;
  matiere: number;
  seed: string;
  onChange: (p: { couleur?: string; matiere?: number }) => void;
  memoire?: boolean;
}) {
  const teinte = couleur || 'b1';
  useEffect(() => {
    void loadCatalogue();
  }, []);
  // les flèches font défiler les matières une à une (en boucle)
  const tourner = (sens: -1 | 1) => onChange({ matiere: (((matiere < 0 ? 0 : matiere) + sens) % (NB_MATIERES + 1) + NB_MATIERES + 1) % (NB_MATIERES + 1) });
  return (
    <div className="bulle-choix">
      <div className="bulle-choix-apercu">
        <div className="bulle-fleches" role="group" aria-label="Matière de la bulle">
          <button type="button" className="icon-btn bulle-fleche" onClick={() => tourner(-1)} aria-label="Matière précédente">
            <Icon name="retour" size={20} />
          </button>
          <BubbleImage key={`${teinte}-${matiere}`} id={seed} couleur={teinte} matiere={matiere} size={150} className="breathing bulle-change" />
          <button type="button" className="icon-btn bulle-fleche" onClick={() => tourner(1)} aria-label="Matière suivante">
            <Icon name="fleche" size={20} />
          </button>
        </div>
        <p className="bulle-numero" aria-live="polite">
          {matiere === MATIERE_COUSUE ? 'Aquarelle cousue' : `Matière ${matiere} sur ${NB_MATIERES}`}
        </p>
      </div>
      <div className="bulle-choix-options">
        <fieldset className="couleurs">
          <legend className="field-label">{memoire ? 'Choisis la couleur de sa bulle' : 'Choisis la couleur de ta bulle'}</legend>
          <div className="couleurs-grille" role="radiogroup" aria-label="Couleur de la bulle">
            {GRIS_PALETTE.map((c) => (
              <button key={c.id} role="radio" aria-checked={couleur === c.id} aria-label={c.label} className="couleur" onClick={() => onChange({ couleur: c.id })}>
                <BubbleImage id={seed} couleur={c.id} matiere={matiere} size={46} />
              </button>
            ))}
          </div>
        </fieldset>
        <p className="muted petit">Les flèches, de chaque côté de la bulle, font défiler les matières.</p>
      </div>
    </div>
  );
}
