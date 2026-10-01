import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { BubbleImage, Footer } from '../components/Chrome';
import { ChoixConfidentialite } from '../components/ChoixConfidentialite';
import { TexteBrode } from '../components/TexteBrode';
import { BoutonPartager, lienTrace } from '../components/Partager';
import { Icon } from '../components/Icon';
import { FragmentEditor } from '../components/FragmentEditor';
import { Panneau } from '../components/Panneau';
import { Signaler } from '../components/Signaler';
import { ChoixMedia, MediaThumb, MediaVue, OuvrirMedia, type MediaChoisi } from '../components/Media';
import {
  dateLongue,
  deplacerFragment,
  deplacerMedia,
  deposerMedia,
  estScelle,
  estScellee,
  isMine,
  mediasLibres,
  modifierReponses,
  premier,
  premiersDabord,
  removeElement,
  reouverture,
  TYPE_LABEL,
  useDerniereErreur,
  useMesTraces,
  useTrace,
} from '../data/store';
import {
  LIMITES,
  MAX_EN_AVANT,
  MAX_MEDIAS,
  QUESTION_MEMOIRE,
  QUESTIONS,
  RUBRIQUES,
  questionRubrique,
  titreRubrique,
  type Element,
  type Media,
  type Rubrique,
  type RubriqueId,
  type Trace,
} from '../data/types';
import { EN_LIGNE } from '../lib/api';
import { CONTACT } from '../lib/contact';
import { colorById } from '../lib/palette';
import { useMuseumMode } from '../lib/museum';

const Q_ICONS = ['parole', 'coeur', 'globe', 'plume'];

/** Le nom de l'ensemble des photos, vidéos, enregistrements, documents et liens d'une trace. */
const TITRE_MEDIAS = 'Photos, vidéos, sons & documents';

type SalleState = { kind: 'rubrique'; r: Rubrique } | { kind: 'medias' } | { kind: 'ajout-media' } | { kind: 'signaler' };

export function TracePage() {
  useMuseumMode('trace');
  const { id = '' } = useParams();
  useMesTraces(); // se met à jour quand on ajoute un fragment
  // aperçu autonome : tout est déjà là ; en ligne : le profil complet se charge à la demande
  const { trace, chargement } = useTrace(id);
  const erreurServeur = useDerniereErreur();
  const location = useLocation();
  const editable = isMine(id);
  const mine = (!EN_LIGNE && id === 'sakinah') || editable;
  const [auteur, setAuteur] = useState(mine);
  const [salle, setSalle] = useState<SalleState | null>(null);
  const scellee = !!trace && estScellee(trace);
  // l'auteur dépose des fragments et des médias (chacun scellé à son dépôt) ;
  // ses réponses, scellées à la publication, se modifient d'un clic une fois les cinq ans passés
  const canAjouter = editable && auteur;
  const canRepondre = editable && auteur && !scellee;
  const [edition, setEdition] = useState(false);
  const [vue, setVue] = useState<Media | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setAuteur(mine);
    // arrivée depuis « Mes traces » : ouvrir directement une rubrique
    const ouvrir = (location.state as { ouvrir?: RubriqueId } | null)?.ouvrir;
    const r = RUBRIQUES.find((x) => x.id === ouvrir);
    if (r) setSalle({ kind: 'rubrique', r });
  }, [id, mine, location.state]);

  if (!trace && chargement) {
    return (
      <main className="page page-texte page-centree">
        <p className="lead muted">Un instant, la mémoire s’ouvre…</p>
      </main>
    );
  }

  if (!trace) {
    return (
      <main className="page page-texte page-centree">
        <div className="introuvable">
          <p className="introuvable-texte">Cette trace n’existe pas, ou plus.</p>
          <Link to="/" className="lien-entrer">
            Retour au musée <Icon name="fleche" size={16} />
          </Link>
        </div>
      </main>
    );
  }

  const color = colorById(trace.couleur);
  const memoire = trace.type === 'memoire';

  return (
    <OuvrirMedia.Provider value={setVue}>
      <main className="trace" style={{ ['--bulle' as string]: color.hex }}>
        <nav className="trace-nav" aria-label="Navigation du profil">
          <Link to="/" className="lien-discret">
            <Icon name="retour" size={16} /> Retour au musée
          </Link>
          <div className="trace-nav-right">
            {mine && (
              <div className="segmented segmented-petit" role="radiogroup" aria-label="Aperçu du profil">
                <button role="radio" aria-checked={!auteur} onClick={() => setAuteur(false)}>
                  Vue visiteur
                </button>
                <button role="radio" aria-checked={auteur} onClick={() => setAuteur(true)}>
                  Vue auteur
                </button>
              </div>
            )}
            <BoutonPartager titre={trace.nom} url={lienTrace(trace.id)} />
            {!mine && (
              <button className="lien-discret" onClick={() => setSalle({ kind: 'signaler' })}>
                <Icon name="drapeau" size={16} /> Signaler
              </button>
            )}
          </div>
        </nav>

        {editable && trace.statut === 'retiree' && (
          <p className="trace-bandeau trace-bandeau-retiree" role="status">
            {memoire ? 'Cette mémoire a été retirée du musée' : 'Ta bulle a été retirée du musée'}
            {trace.retireeRaison ? ` : ${trace.retireeRaison}` : '.'} Tu peux m’écrire pour en parler :{' '}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p>
        )}
        {editable && auteur && trace.statut !== 'retiree' && <Bandeau trace={trace} />}
        {erreurServeur && (
          <p className="trace-bandeau trace-bandeau-erreur" role="alert">
            {erreurServeur}
          </p>
        )}

        {/* ——— En-tête : la bulle, et le nom tel que la personne a choisi d'apparaître */}
        <header className="trace-head">
          <div className="trace-bulle">
            <BubbleImage id={trace.id} couleur={trace.couleur} size={190} className="breathing" />
          </div>
          <div className="trace-identite">
            <h1 className="trace-nom">{trace.nom}</h1>
            <dl className="trace-meta">
              <div>
                <dt>
                  <Icon name="trace" size={20} /> Type de trace
                </dt>
                <dd>{TYPE_LABEL[trace.type]}</dd>
              </div>
              {trace.pays && (
                <div>
                  <dt>
                    <Icon name="lieu" size={20} /> Pays associé
                  </dt>
                  <dd>{trace.pays}</dd>
                </div>
              )}
              <div>
                <dt>
                  <Icon name="calendrier" size={20} /> Dates clés
                </dt>
                <dd>
                  Créée le {premier(trace.creeLe)}
                  <br />
                  Dernière mise à jour le {premier(trace.majLe)}
                </dd>
              </div>
            </dl>
          </div>
        </header>

        {/* ——— Les 4 questions, en entier ; ou, pour une mémoire, ce que l'on peut dire de la personne */}
        {trace.questions ? (
          <section className="bloc questions" aria-labelledby="h-questions">
            <h2 id="h-questions" className="bloc-titre">
              Les 4 questions
            </h2>
            {canRepondre && edition ? (
              <ReponsesEditor trace={trace} onClose={() => setEdition(false)} />
            ) : (
              <ol className="questions-grid">
                {trace.questions.map((answer, i) => (
                  <li key={i} className={`question${i === 3 ? ' question-200' : ''}`}>
                    <h3 className="question-titre">
                      <Icon name={Q_ICONS[i]} size={24} />
                      <span>
                        {i + 1}. {QUESTIONS[i]}
                      </span>
                    </h3>
                    {i === 1 && trace.q2Destinataire && <p className="question-dest">à {trace.q2Destinataire}</p>}
                    <blockquote className="question-reponse">
                      <p>
                        <TexteBrode texte={answer} />
                      </p>
                    </blockquote>
                    {canRepondre && (
                      <button className="lien-discret petit" onClick={() => setEdition(true)}>
                        Modifier
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : (
          trace.memoire && (
            <section className="bloc provenance" aria-labelledby="h-prov">
              <h2 id="h-prov" className="bloc-titre">
                À propos de cette mémoire
              </h2>
              <div className="provenance-corps">
                <p className="provenance-qui">
                  Déposée par {trace.memoire.deposeePar}
                  {trace.memoire.relation ? `, ${trace.memoire.relation.toLowerCase()}` : ''}.
                </p>
                {canRepondre && edition ? (
                  <ReponsesEditor trace={trace} onClose={() => setEdition(false)} />
                ) : (
                  <>
                    <h3 className="question-titre">
                      <Icon name="plume" size={24} />
                      <span>{QUESTION_MEMOIRE}</span>
                    </h3>
                    <blockquote className="citation">
                      <TexteBrode texte={trace.memoire.aperçu} />
                    </blockquote>
                    {canRepondre && (
                      <button className="lien-discret petit" onClick={() => setEdition(true)}>
                        Modifier
                      </button>
                    )}
                  </>
                )}
                <p className="muted petit">Ces mots ne sont pas ceux de la personne : ce sont ceux d’un proche, qui transmet ce qu’il sait d’elle.</p>
              </div>
            </section>
          )
        )}

        {/* ——— Fragments d'existence */}
        <section className="bloc fragments" aria-labelledby="h-fragments">
          <h2 id="h-fragments" className="bloc-titre">
            {memoire ? 'Fragments de son existence' : 'Fragments de mon existence'}
          </h2>
          {/* pour qui visite, les rubriques encore vides se replient : le profil commence par ce qui a été déposé */}
          {(() => {
            const montree = (r: Rubrique) => canAjouter || (trace.rubriques[r.id]?.length ?? 0) > 0;
            const sens = RUBRIQUES.filter((r) => r.famille === 'sens' && montree(r));
            const autres = RUBRIQUES.filter((r) => !r.famille && montree(r));
            const vides = RUBRIQUES.filter((r) => !montree(r));
            const tuile = (r: Rubrique) => (
              <li key={r.id}>
                <FragmentTile r={r} trace={trace} canEdit={canAjouter} onOpen={() => setSalle({ kind: 'rubrique', r })} />
              </li>
            );
            return (
              <>
                {/* les 5 sens, côte à côte : chacun est une rubrique à part, avec ses propres limites */}
                {sens.length > 0 && (
                  <>
                    <h3 className="fragments-famille">{memoire ? 'Les 5 sens' : 'Les 5 sens, une dernière fois'}</h3>
                    <ul className="fragments-grid fragments-sens">{sens.map(tuile)}</ul>
                  </>
                )}
                <ul className="fragments-grid">{autres.map(tuile)}</ul>
                {vides.length > 0 && (
                  <details className="fragments-vides">
                    <summary>
                      Ce qui n’a pas encore été déposé ({vides.length} rubrique{vides.length > 1 ? 's' : ''})
                    </summary>
                    <ul className="fragments-vides-liste">
                      {vides.map((r) => (
                        <li key={r.id}>
                          <Icon name={r.icone} size={18} /> {titreRubrique(r, trace.type)}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            );
          })()}
        </section>

        {/* ——— Photos, vidéos, sons & documents ; les choix de confidentialité (pour l'auteur seulement) */}
        <div className={`trace-bas${auteur && editable ? '' : ' sans-parametres'}`}>
          <BlocMedias trace={trace} auteur={canAjouter} onVoirTout={() => setSalle({ kind: 'medias' })} onAjouter={() => setSalle({ kind: 'ajout-media' })} />

          {auteur && editable && (
            <section className="bloc parametres" aria-labelledby="h-param">
              <div className="bloc-entete">
                <h2 id="h-param" className="bloc-titre">
                  <Icon name="cadenas" size={22} /> Mes choix de confidentialité
                </h2>
              </div>
              <p className="bloc-note">Ils ne s’affichent jamais publiquement. Un clic les change, quand tu veux : ils ne sont pas scellés.</p>
              <ChoixConfidentialite trace={trace} />
            </section>
          )}
        </div>

        <Footer />

        {salle && (
          <Panneau onClose={() => setSalle(null)} titre={salleTitre(salle, trace)}>
            {salle.kind === 'rubrique' && <RubriqueDetail r={salle.r} trace={trace} canEdit={canAjouter} />}
            {salle.kind === 'medias' && <MediasTout trace={trace} auteur={canAjouter} />}
            {salle.kind === 'signaler' && <Signaler trace={trace} onDone={() => setSalle(null)} />}
            {salle.kind === 'ajout-media' && <MediaAjout trace={trace} onDone={() => setSalle({ kind: 'medias' })} />}
          </Panneau>
        )}
        {vue && <MediaVue m={vue} onClose={() => setVue(null)} />}
      </main>
    </OuvrirMedia.Provider>
  );
}

/**
 * Bandeau de l'auteur : la trace est publique, ses réponses sont scellées, chaque
 * dépôt est scellé à son tour ; et ses données restent les siennes.
 */
function Bandeau({ trace }: { trace: Trace }) {
  const memoire = trace.type === 'memoire';
  const droits = (
    <>
      {' '}
      Tes données restent à toi : tu peux m’écrire à tout moment pour les modifier ou les supprimer, toutes ou en partie (
      <a href={`mailto:${CONTACT}`}>{CONTACT}</a>).
    </>
  );
  if (!estScellee(trace)) {
    return (
      <p className="trace-bandeau">
        Cinq ans ont passé depuis la publication : un clic sur {memoire ? 'ce que tu as écrit' : 'une réponse'} ou sur un fragment te permet de le
        modifier.{droits}
      </p>
    );
  }
  return (
    <p className="trace-bandeau trace-bandeau-scellee">
      <Icon name="cadenas" size={18} />
      <span>
        {memoire ? 'Cette mémoire est publique. Ce que tu as écrit sur cette personne est scellé' : 'Ta trace est publique. Tes quatre réponses sont scellées'}{' '}
        jusqu’au {dateLongue(reouverture(trace)!)}. Chaque fragment et chaque fichier que tu déposes est scellé à son tour : une fois déposé, il
        ne peut plus être modifié ni retiré pendant cinq ans.{droits}
      </span>
    </p>
  );
}

/** De nouvelles réponses, une fois les cinq ans passés ; elles sont scellées à leur tour. */
function ReponsesEditor({ trace, onClose }: { trace: Trace; onClose: () => void }) {
  const [q, setQ] = useState<[string, string, string, string]>(trace.questions ?? ['', '', '', '']);
  const [ap, setAp] = useState(trace.memoire?.aperçu ?? '');
  const valide = trace.questions ? q.every((x) => x.trim().length > 0) : ap.trim().length > 0;
  const enregistrer = () => {
    if (!valide) return;
    if (trace.questions) modifierReponses(trace.id, q.map((x) => x.trim()) as [string, string, string, string]);
    else modifierReponses(trace.id, undefined, ap.trim());
    onClose();
  };
  return (
    <div className="reponses-editeur">
      {trace.questions ? (
        QUESTIONS.map((label, i) => {
          const max = i === 3 ? LIMITES.q4 : LIMITES.q;
          return (
            <label key={i} className="field">
              <span className="field-label">
                {i + 1}. {label}
              </span>
              <textarea
                rows={i === 3 ? 3 : 5}
                maxLength={max}
                value={q[i]}
                onChange={(e) => setQ((x) => x.map((v, j) => (j === i ? e.target.value : v)) as [string, string, string, string])}
              />
              <span className="compteur">
                {q[i].length} / {max}
              </span>
            </label>
          );
        })
      ) : (
        <label className="field">
          <span className="field-label">{QUESTION_MEMOIRE}</span>
          <textarea rows={6} maxLength={LIMITES.memoire} value={ap} onChange={(e) => setAp(e.target.value)} />
          <span className="compteur">
            {ap.length} / {LIMITES.memoire}
          </span>
        </label>
      )}
      <p className="editeur-scelle">
        <Icon name="cadenas" size={16} /> En enregistrant, ces mots sont scellés de nouveau pour cinq ans.
      </p>
      <div className="editeur-actions">
        <button className="bouton" disabled={!valide} onClick={enregistrer}>
          Enregistrer et sceller
        </button>
        <button className="lien-discret" onClick={onClose}>
          Annuler
        </button>
      </div>
    </div>
  );
}

function salleTitre(s: SalleState, t: Trace): string {
  switch (s.kind) {
    case 'rubrique':
      return titreRubrique(s.r, t.type);
    case 'medias':
      return TITRE_MEDIAS;
    case 'ajout-media':
      return 'Déposer une photo, une vidéo, un son ou un document';
    case 'signaler':
      return 'Signaler cette trace';
  }
}

function mediasOf(items: Element[], trace: Trace): Media[] {
  const ids = items.flatMap((e) => e.medias ?? []);
  return [...new Set(ids)].map((id) => trace.medias.find((m) => m.id === id)).filter(Boolean) as Media[];
}

/** Une tuile : la rubrique, et les trois premiers fragments, dans l'ordre choisi par l'auteur. */
function FragmentTile({ r, trace, canEdit, onOpen }: { r: Rubrique; trace: Trace; canEdit: boolean; onOpen: () => void }) {
  const items = trace.rubriques[r.id] ?? [];
  const { avant } = premiersDabord(items);
  const medias = mediasOf(avant, trace).slice(0, 3);
  const empty = items.length === 0;
  const titre = r.famille === 'sens' ? (r.court ?? r.titre) : titreRubrique(r, trace.type);
  return (
    <button className={`fragment${empty ? ' is-empty' : ''}`} onClick={onOpen} disabled={empty && !canEdit}>
      <span className="fragment-head">
        <Icon name={r.icone} size={26} />
        <span className="fragment-titre">{titre}</span>
        {!empty && <Icon name="fleche" size={16} />}
      </span>
      <span className="fragment-compte">
        {empty ? (canEdit ? 'Ajouter un premier fragment' : '') : `${items.length} fragment${items.length > 1 ? 's' : ''}`}
      </span>
      {medias.length > 0 && (
        // dans une tuile, les vignettes ne sont que des aperçus : un clic ouvre la salle, pas la visionneuse
        <OuvrirMedia.Provider value={null}>
          <span className="fragment-medias">
            {medias.map((m) => (
              <MediaThumb key={m.id} m={m} size="s" />
            ))}
          </span>
        </OuvrirMedia.Provider>
      )}
      {avant.length > 0 && (
        <span className="fragment-apercus">
          {avant.map((e) => (
            <span key={e.id} className="fragment-apercu" dir="auto">
              {e.titre ? <em>{e.titre}</em> : e.texte}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}

function ElementView({
  e,
  trace,
  rubrique,
  auteur,
  rang,
  total,
}: {
  e: Element;
  trace: Trace;
  rubrique: RubriqueId;
  auteur?: boolean;
  rang: number;
  total: number;
}) {
  const [modifier, setModifier] = useState(false);
  const medias = (e.medias ?? []).map((id) => trace.medias.find((m) => m.id === id)).filter(Boolean) as Media[];
  const meta = [e.categorie, e.lien, e.quand, e.lieu].filter(Boolean).join(', ');
  const scelle = estScelle(e);
  if (modifier)
    return (
      <div className="element">
        <FragmentEditor traceId={trace.id} rubrique={rubrique} items={[]} modifier={e} memoire={trace.type === 'memoire'} onDone={() => setModifier(false)} />
      </div>
    );
  return (
    <article className={`element${auteur && rang < MAX_EN_AVANT ? ' element-montre' : ''}`}>
      {e.titre && <h4 className="element-titre">{e.titre}</h4>}
      {meta && <p className="element-meta">{meta}</p>}
      <p className="element-texte" dir="auto">
        {e.texte}
      </p>
      {medias.length > 0 && (
        <div className="element-medias">
          {medias.map((m) => (
            <MediaThumb key={m.id} m={m} size="m" />
          ))}
        </div>
      )}
      {auteur && (
        <p className="element-auteur">
          {rang < MAX_EN_AVANT && <span className="element-montre-note">Montré sur ton profil</span>}
          {e.scelleLe && scelle && (
            <span className="element-scelle">
              <Icon name="cadenas" size={14} /> Scellé le {dateLongue(e.scelleLe)}
            </span>
          )}
          {total > 1 && <Trier premier={rang === 0} dernier={rang === total - 1} onDeplacer={(sens) => deplacerFragment(trace.id, rubrique, e.id, sens)} />}
          {!scelle && (
            <>
              <button className="lien-discret petit" onClick={() => setModifier(true)}>
                Modifier
              </button>
              <button className="lien-discret petit element-retirer" onClick={() => removeElement(trace.id, rubrique, e.id)}>
                Retirer
              </button>
            </>
          )}
        </p>
      )}
    </article>
  );
}

/** Monter ou descendre un élément : l'auteur range son espace, même après le scellement. */
function Trier({ onDeplacer, premier, dernier }: { onDeplacer: (sens: -1 | 1) => void; premier: boolean; dernier: boolean }) {
  return (
    <span className="trier" role="group" aria-label="Ranger">
      <button className="lien-discret petit" onClick={() => onDeplacer(-1)} disabled={premier} aria-label="Monter">
        ↑
      </button>
      <button className="lien-discret petit" onClick={() => onDeplacer(1)} disabled={dernier} aria-label="Descendre">
        ↓
      </button>
    </span>
  );
}

/** Une rubrique ouverte : tous ses fragments, dans l'ordre choisi par l'auteur. */
function RubriqueDetail({ r, trace, canEdit }: { r: Rubrique; trace: Trace; canEdit: boolean }) {
  const items = trace.rubriques[r.id] ?? [];
  const question = questionRubrique(r, trace.type);
  return (
    <div className="rubrique-detail">
      {question && <p className="salle-q">{question}</p>}
      {canEdit && items.length > 1 && (
        <p className="bloc-note bloc-note-auteur">Les trois premiers se montrent sur ton profil. Range-les avec les flèches.</p>
      )}
      {items.map((e, i) => (
        <ElementView key={e.id} e={e} trace={trace} rubrique={r.id} auteur={canEdit} rang={i} total={items.length} />
      ))}
      {canEdit && <FragmentEditor key={items.length} traceId={trace.id} rubrique={r.id} items={items} memoire={trace.type === 'memoire'} />}
    </div>
  );
}

/** Sur le profil : les trois premiers (dans l'ordre choisi par l'auteur), puis « Voir tout ». */
function BlocMedias({ trace, auteur, onVoirTout, onAjouter }: { trace: Trace; auteur: boolean; onVoirTout: () => void; onAjouter: () => void }) {
  const libres = mediasLibres(trace);
  const { avant } = premiersDabord(libres);
  return (
    <section className="bloc medias" aria-labelledby="h-medias">
      <div className="bloc-entete">
        <h2 id="h-medias" className="bloc-titre">
          <Icon name="archive" size={22} /> {TITRE_MEDIAS}
        </h2>
        {auteur && <span className="compte">{`${libres.length} sur ${MAX_MEDIAS}`}</span>}
        {libres.length > 0 && (
          <button className="lien-discret petit" onClick={onVoirTout}>
            Voir tout <Icon name="fleche" size={14} />
          </button>
        )}
      </div>
      <div className="medias-rang">
        {avant.map((m) => (
          <MediaThumb key={m.id} m={m} size="s" />
        ))}
        {auteur && libres.length < MAX_MEDIAS && (
          <button className="media-ajout" onClick={onAjouter}>
            <Icon name="plus" size={20} />
            <span>Déposer</span>
          </button>
        )}
        {libres.length === 0 && !auteur && <p className="muted petit">Rien n’a encore été déposé ici.</p>}
      </div>
      {auteur && <p className="bloc-note">Les fichiers joints à un fragment restent dans leur fragment.</p>}
    </section>
  );
}

function MediasTout({ trace, auteur }: { trace: Trace; auteur: boolean }) {
  const libres = mediasLibres(trace);
  return (
    <>
      {auteur && libres.length > 1 && <p className="bloc-note bloc-note-auteur">Les trois premiers se montrent sur ton profil. Range-les avec les flèches.</p>}
      <div className="salle-medias-tout">
        {libres.map((m, i) => (
          <div key={m.id} className="media-case">
            <MediaThumb m={m} size="l" />
            {auteur && (
              <span className="media-case-actions">
                {i < MAX_EN_AVANT && <span className="element-montre-note">Montré sur ton profil</span>}
                {libres.length > 1 && <Trier premier={i === 0} dernier={i === libres.length - 1} onDeplacer={(sens) => deplacerMedia(trace.id, m.id, sens)} />}
              </span>
            )}
          </div>
        ))}
        {libres.length === 0 && <p className="muted">Rien n’a encore été déposé ici.</p>}
      </div>
    </>
  );
}

/** Déposer une photo, une vidéo, un son, un document ou un lien (20 au plus), scellé à son dépôt. */
function MediaAjout({ trace, onDone }: { trace: Trace; onDone: () => void }) {
  const [choix, setChoix] = useState<MediaChoisi>(null);
  const [titre, setTitre] = useState('');
  const [legende, setLegende] = useState('');
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const restant = MAX_MEDIAS - mediasLibres(trace).length;
  const deposer = async () => {
    if (!choix || envoi) return;
    if (!confirmer) return setConfirmer(true);
    setEnvoi(true);
    try {
      await deposerMedia(trace.id, choix, titre.trim(), legende.trim());
      onDone();
    } catch (err) {
      setErreur(err instanceof Error && err.message ? err.message : 'Ce fichier n’a pas pu être déposé.');
    } finally {
      setEnvoi(false);
      setConfirmer(false);
    }
  };
  return (
    <div className="editeur media-ajout-form">
      <p className="editeur-titre">
        <Icon name="plus" size={16} /> Déposer
        <span className="editeur-places">
          {restant} place{restant > 1 ? 's' : ''} sur {MAX_MEDIAS}
        </span>
      </p>
      <div className="field">
        <ChoixMedia value={choix} onChange={setChoix} id="ajout-media" />
      </div>
      <label className="field">
        <span className="field-label">Titre (facultatif)</span>
        <input value={titre} maxLength={90} onChange={(e) => setTitre(e.target.value)} />
      </label>
      <label className="field">
        <span className="field-label">Légende (facultatif)</span>
        <textarea rows={3} maxLength={400} value={legende} onChange={(e) => setLegende(e.target.value)} />
      </label>
      {erreur && (
        <p className="editeur-erreur" role="alert">
          {erreur}
        </p>
      )}
      {confirmer && (
        <p className="editeur-scelle" role="alert">
          <Icon name="cadenas" size={16} /> Une fois déposé, ce fichier sera scellé : tu ne pourras plus le retirer pendant cinq ans.
        </p>
      )}
      <div className="editeur-actions">
        <button className="bouton" disabled={!choix || envoi} onClick={deposer}>
          {envoi ? 'Dépôt…' : confirmer ? 'Déposer et sceller' : 'Déposer'}
        </button>
        {confirmer && !envoi && (
          <button className="lien-discret" onClick={() => setConfirmer(false)}>
            Relire encore
          </button>
        )}
      </div>
    </div>
  );
}
