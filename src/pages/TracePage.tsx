import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { BubbleImage, Footer } from '../components/Chrome';
import { TexteBrode } from '../components/TexteBrode';
import { BoutonPartager, lienTrace } from '../components/Partager';
import { Icon } from '../components/Icon';
import { FragmentEditor } from '../components/FragmentEditor';
import { ChoixMedia, MediaThumb, MediaVue, OuvrirMedia, type MediaChoisi } from '../components/Media';
import {
  addMedia,
  basculerEnAvant,
  basculerMediaEnAvant,
  deplacerEnAvant,
  deplacerMediaEnAvant,
  dateLongue,
  enAvantDabord,
  estScelle,
  estScellee,
  getTrace,
  isMine,
  mediasLibres,
  modifierReponses,
  removeElement,
  reouverture,
  TYPE_LABEL,
  useMesTraces,
} from '../data/store';
import { LIMITES, MAX_EN_AVANT, MAX_MEDIAS, QUESTIONS, RUBRIQUES, type Element, type Media, type Rubrique, type RubriqueId, type Trace } from '../data/types';
import { creerMedia } from '../lib/fichiers';
import { colorById } from '../lib/palette';
import { useMuseumMode } from '../lib/museum';

const Q_ICONS = ['parole', 'coeur', 'globe', 'plume'];

type SalleState =
  | { kind: 'rubrique'; r: Rubrique }
  | { kind: 'medias' }
  | { kind: 'ajout-media' }
  | { kind: 'question'; i: number };

export function TracePage() {
  useMuseumMode('trace');
  const { id = '' } = useParams();
  useMesTraces(); // se met à jour quand on ajoute un fragment
  const trace = getTrace(id);
  const location = useLocation();
  const editable = isMine(id);
  const mine = id === 'sakinah' || editable;
  const [auteur, setAuteur] = useState(mine);
  const [salle, setSalle] = useState<SalleState | null>(null);
  const scellee = !!trace && estScellee(trace);
  // l'auteur dépose des fragments et des médias (chacun scellé à son dépôt) ;
  // ses réponses, scellées à la publication, ne changent qu'après cinq ans
  const canAjouter = editable && auteur;
  const canRepondre = editable && auteur && !scellee;
  const [edition, setEdition] = useState(false);
  const [vue, setVue] = useState<Media | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setAuteur(mine);
    // arrivée depuis « Ma trace » : ouvrir directement une rubrique
    const ouvrir = (location.state as { ouvrir?: RubriqueId } | null)?.ouvrir;
    const r = RUBRIQUES.find((x) => x.id === ouvrir);
    if (r) setSalle({ kind: 'rubrique', r });
  }, [id, mine, location.state]);

  if (!trace) {
    return (
      <main className="page page-texte">
        <p className="lead">Cette trace n’existe pas, ou plus.</p>
        <Link to="/" className="lien-entrer">
          Retour au musée <Icon name="fleche" size={16} />
        </Link>
      </main>
    );
  }

  const color = colorById(trace.couleur);

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
        </div>
      </nav>

      {editable && auteur && <Bandeau trace={trace} />}

      {/* ——— En-tête : bulle + identité */}
      <header className="trace-head emerge">
        <div className="trace-bulle">
          <BubbleImage id={trace.id} couleur={trace.couleur} size={190} className="breathing" />
        </div>
        <div className="trace-identite">
          <h1 className="trace-nom">{trace.nom}</h1>
          {trace.pseudo && <p className="trace-sous">pseudo : {trace.pseudo}</p>}
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
                  <Icon name="lieu" size={20} /> Pays associé à ma trace
                </dt>
                <dd>{trace.pays}</dd>
              </div>
            )}
            <div>
              <dt>
                <Icon name="calendrier" size={20} /> Dates clés
              </dt>
              <dd>
                Créée le {trace.creeLe}
                <br />
                Dernière mise à jour : {trace.majLe}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {/* ——— Les 4 questions obligatoires, ou la provenance d'une mémoire */}
      {trace.questions ? (
        <section className="bloc questions emerge" aria-labelledby="h-questions">
          <h2 id="h-questions" className="bloc-titre">
            Les 4 questions obligatoires
          </h2>
          {canRepondre && !edition && (
            <p className="bloc-note bloc-note-auteur">
              Cinq ans ont passé : tu peux donner de nouvelles réponses. Elles seront scellées à leur tour.{' '}
              <button className="lien-discret petit" onClick={() => setEdition(true)}>
                Donner de nouvelles réponses
              </button>
            </p>
          )}
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
                {i === 1 && trace.q2Destinataire && <p className="question-dest">— à {trace.q2Destinataire}</p>}
                <blockquote className="question-reponse">
                  <p>{i === 3 ? <TexteBrode texte={answer} /> : answer.length > 170 ? answer.slice(0, 160).replace(/\s+\S*$/, '') + '…' : answer}</p>
                </blockquote>
                {i < 3 && answer.length > 170 && (
                  <button className="lien-discret petit" onClick={() => setSalle({ kind: 'question', i })}>
                    Lire en entier
                  </button>
                )}
              </li>
            ))}
          </ol>
          )}
        </section>
      ) : (
        trace.memoire && (
          <section className="bloc provenance emerge" aria-labelledby="h-prov">
            <h2 id="h-prov" className="bloc-titre">
              À propos de cette mémoire
            </h2>
            <div className="provenance-corps">
              <p className="provenance-qui">
                Déposée par {trace.memoire.deposeePar}
                {trace.memoire.relation ? `, ${trace.memoire.relation.toLowerCase()}` : ''}.
              </p>
              {trace.memoire.origine && <blockquote className="citation">« {trace.memoire.origine} »</blockquote>}
              {canRepondre &&
                (edition ? (
                  <ReponsesEditor trace={trace} onClose={() => setEdition(false)} />
                ) : (
                  <p className="bloc-note bloc-note-auteur">
                    Cinq ans ont passé : tu peux réécrire les 200 caractères de sa bulle.{' '}
                    <button className="lien-discret petit" onClick={() => setEdition(true)}>
                      Réécrire
                    </button>
                  </p>
                ))}
              <p className="muted petit">
                Ces mots ne sont pas ceux de la personne : ce sont des souvenirs transmis par un proche. Les quatre questions
                fondamentales n’appartiennent qu’aux traces personnelles.
              </p>
            </div>
          </section>
        )
      )}

      {/* ——— Fragments de mon existence */}
      <section className="bloc fragments emerge" aria-labelledby="h-fragments">
        <h2 id="h-fragments" className="bloc-titre">
          Fragments de mon existence
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
                  <h3 className="fragments-famille">Les 5 sens · une dernière fois</h3>
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
                        <Icon name={r.icone} size={18} /> {r.titre}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          );
        })()}
      </section>

      {/* ——— Médias, paramètres */}
      <div className={`trace-bas emerge${auteur ? '' : ' sans-parametres'}`}>
        <BlocMedias trace={trace} auteur={canAjouter} onVoirTout={() => setSalle({ kind: 'medias' })} onAjouter={() => setSalle({ kind: 'ajout-media' })} />


        {auteur && trace.parametres && (
          <section className="bloc parametres" aria-labelledby="h-param">
            <div className="bloc-entete">
              <h2 id="h-param" className="bloc-titre">
                <Icon name="cadenas" size={22} /> Paramètres non publics
              </h2>
            </div>
            <p className="bloc-note">Ces paramètres sont personnels et ne s’affichent pas publiquement.</p>
            <ul className="parametres-liste">
              {[
                ['document', 'Droits de réutilisation', trace.parametres.droitsReutilisation],
                ['archive', 'Archivage longue durée', trace.parametres.archivageLongueDuree],
                ['coeur', 'Choix après décès', trace.parametres.choixApresDeces],
                ['reseau', 'Autorisation réseaux sociaux', trace.parametres.reseauxSociaux],
                ['enveloppe', 'Feedback privé', trace.parametres.feedbackPrive],
              ].map(([icon, label, val]) => (
                <li key={label as string}>
                  <Icon name={icon as string} size={24} />
                  <span className="param-label">{label as string}</span>
                  <span className="param-val">{typeof val === 'boolean' ? (val ? 'Accordé' : 'Non') : (val as string)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <Footer />

      {salle && (
        <Salle onClose={() => setSalle(null)} titre={salleTitre(salle, trace)}>
          {salle.kind === 'rubrique' && <RubriqueDetail r={salle.r} trace={trace} canEdit={canAjouter} />}
          {salle.kind === 'question' && trace.questions && (
            <div className="salle-question">
              <p className="salle-q">{QUESTIONS[salle.i]}</p>
              {salle.i === 1 && trace.q2Destinataire && <p className="question-dest">— à {trace.q2Destinataire}</p>}
              <blockquote className="salle-reponse">{trace.questions[salle.i]}</blockquote>
              <p className="muted petit">
                {trace.questions[salle.i].length} / {LIMITES.q} caractères
              </p>
            </div>
          )}
          {salle.kind === 'medias' && <MediasTout trace={trace} auteur={canAjouter} />}
          {salle.kind === 'ajout-media' && <MediaAjout trace={trace} onDone={() => setSalle({ kind: 'medias' })} />}
        </Salle>
      )}
      {vue && <MediaVue m={vue} onClose={() => setVue(null)} />}
    </main>
    </OuvrirMedia.Provider>
  );
}

/**
 * Bandeau de l'auteur : la trace est publique, ses réponses sont scellées, et
 * chaque dépôt (fragment ou média) est scellé à son tour.
 */
function Bandeau({ trace }: { trace: Trace }) {
  const memoire = trace.type === 'memoire';
  if (!estScellee(trace)) {
    return (
      <p className="trace-bandeau emerge">
        Cinq ans ont passé depuis la publication : {memoire ? 'les 200 caractères de cette mémoire peuvent' : 'tes réponses peuvent'} de
        nouveau évoluer.
      </p>
    );
  }
  return (
    <p className="trace-bandeau trace-bandeau-scellee emerge">
      <Icon name="cadenas" size={18} />
      <span>
        {memoire ? 'Cette mémoire est publique. Ses 200 caractères sont scellés' : 'Ta trace est publique. Tes quatre réponses sont scellées'}{' '}
        jusqu’au {dateLongue(reouverture(trace)!)}. Chaque fragment et chaque média que tu déposes est scellé à son tour : une fois déposé,
        il ne peut plus être modifié ni retiré pendant cinq ans.
      </span>
    </p>
  );
}

/** De nouvelles réponses (ou 200 caractères), une fois les cinq ans passés ; elles sont scellées à leur tour. */
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
          <span className="field-label">Les 200 caractères de sa bulle</span>
          <textarea rows={3} maxLength={LIMITES.q4} value={ap} onChange={(e) => setAp(e.target.value)} />
          <span className="compteur">
            {ap.length} / {LIMITES.q4}
          </span>
        </label>
      )}
      <div className="editeur-actions">
        <button className="bouton" disabled={!valide} onClick={enregistrer}>
          Enregistrer
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
      return s.r.titre;
    case 'medias':
      return 'Médias & documents';
    case 'ajout-media':
      return 'Déposer un média ou un document';
    case 'question':
      return `${t.nom} — question ${s.i + 1}`;
  }
}

function mediasOf(items: Element[], trace: Trace): Media[] {
  const ids = items.flatMap((e) => e.medias ?? []);
  return [...new Set(ids)].map((id) => trace.medias.find((m) => m.id === id)).filter(Boolean) as Media[];
}

function FragmentTile({ r, trace, canEdit, onOpen }: { r: Rubrique; trace: Trace; canEdit: boolean; onOpen: () => void }) {
  const items = trace.rubriques[r.id] ?? [];
  const { avant } = enAvantDabord(items);
  const medias = mediasOf(avant, trace).slice(0, 3);
  const first = avant[0];
  const empty = items.length === 0;
  return (
    <button className={`fragment${empty ? ' is-empty' : ''}`} onClick={onOpen} disabled={empty && !canEdit}>
      <span className="fragment-head">
        <Icon name={r.icone} size={26} />
        <span className="fragment-titre">{r.court ?? r.titre}</span>
        {!empty && <Icon name="fleche" size={16} />}
      </span>
      <span className="fragment-compte">
        {empty ? (canEdit ? '+ Ajouter un premier fragment' : 'Rien n’a été déposé ici') : `${items.length} élément${items.length > 1 ? 's' : ''}${canEdit ? ' · ajouter' : ''}`}
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
      {first && (
        // sans image, le fragment mis en avant devient une citation : c'est lui qu'on lit d'abord
        <span className={`fragment-extrait${medias.length ? '' : ' fragment-citation'}`}>
          {first.titre ? <em>{first.titre} — </em> : null}
          {first.texte}
        </span>
      )}
    </button>
  );
}

function ElementView({
  e,
  trace,
  auteur,
  pleinAvant,
  onBasculer,
  onDeplacer,
  onRemove,
}: {
  e: Element;
  trace: Trace;
  auteur?: boolean;
  pleinAvant?: boolean;
  onBasculer?: () => void;
  onDeplacer?: (sens: -1 | 1) => void;
  onRemove?: () => void;
}) {
  const medias = (e.medias ?? []).map((id) => trace.medias.find((m) => m.id === id)).filter(Boolean) as Media[];
  const meta = [e.categorie, e.lien, e.quand, e.lieu].filter(Boolean).join(' · ');
  return (
    <article className="element">
      {e.titre && <h4 className="element-titre">{e.titre}</h4>}
      {meta && <p className="element-meta">{meta}</p>}
      <p className="element-texte">{e.texte}</p>
      {medias.length > 0 && (
        <div className="element-medias">
          {medias.map((m) => (
            <MediaThumb key={m.id} m={m} size="m" />
          ))}
        </div>
      )}
      {auteur && (
        <p className="element-auteur">
          {e.scelleLe && estScelle(e) && (
            <span className="element-scelle">
              <Icon name="cadenas" size={14} /> Scellé le {dateLongue(e.scelleLe)}
            </span>
          )}
          {onBasculer && (
            <button className="lien-discret petit" onClick={onBasculer} disabled={!e.enAvant && pleinAvant}>
              {e.enAvant ? 'Ne plus mettre en avant' : pleinAvant ? `${MAX_EN_AVANT} déjà mis en avant` : 'Mettre en avant'}
            </button>
          )}
          {onDeplacer && e.enAvant && <Trier onDeplacer={onDeplacer} />}
          {onRemove && (
            <button className="lien-discret petit element-retirer" onClick={onRemove}>
              Retirer ce fragment
            </button>
          )}
        </p>
      )}
    </article>
  );
}

/** Monter ou descendre un élément mis en avant : l'auteur choisit l'ordre de ses cinq, même après le scellement. */
function Trier({ onDeplacer }: { onDeplacer: (sens: -1 | 1) => void }) {
  return (
    <span className="trier" role="group" aria-label="Ordre sur le profil">
      <button className="lien-discret petit" onClick={() => onDeplacer(-1)} aria-label="Monter">
        ↑
      </button>
      <button className="lien-discret petit" onClick={() => onDeplacer(1)} aria-label="Descendre">
        ↓
      </button>
    </span>
  );
}

/**
 * Une liste de fragments qui partagent les mêmes limites (une rubrique, ou un
 * seul des 5 sens) : les 5 mis en avant, dans l'ordre choisi, puis « Voir tout ».
 */
function ListeFragments({ items, r, trace, canEdit }: { items: Element[]; r: Rubrique; trace: Trace; canEdit: boolean }) {
  const [tout, setTout] = useState(false);
  const { avant, reste } = enAvantDabord(items);
  const visibles = tout ? [...avant, ...reste] : avant;
  const pleinAvant = items.filter((e) => e.enAvant).length >= MAX_EN_AVANT;
  return (
    <>
      {visibles.map((e) => (
        <ElementView
          key={e.id}
          e={e}
          trace={trace}
          auteur={canEdit}
          pleinAvant={pleinAvant}
          onBasculer={canEdit ? () => basculerEnAvant(trace.id, r.id, e.id) : undefined}
          onDeplacer={canEdit ? (sens) => deplacerEnAvant(trace.id, r.id, e.id, sens) : undefined}
          // un fragment scellé ne se retire qu'une fois ses cinq ans passés
          onRemove={canEdit && !estScelle(e) ? () => removeElement(trace.id, r.id, e.id) : undefined}
        />
      ))}
      {reste.length > 0 && (
        <button className="lien-discret voir-tout" onClick={() => setTout((x) => !x)}>
          {tout ? 'Ne montrer que les fragments mis en avant' : `Voir tout (${items.length} fragments)`} <Icon name="fleche" size={14} />
        </button>
      )}
    </>
  );
}

function RubriqueDetail({ r, trace, canEdit }: { r: Rubrique; trace: Trace; canEdit: boolean }) {
  const items = trace.rubriques[r.id] ?? [];
  const editor = canEdit ? <FragmentEditor key={items.length} traceId={trace.id} rubrique={r.id} items={items} /> : null;

  return (
    <div className="rubrique-detail">
      {r.question && <p className="salle-q">{r.question}</p>}
      {items.length === 0 && canEdit && <p className="muted">Rien encore ici. Ce que tu déposes est publié sur ta trace, et scellé.</p>}
      <ListeFragments items={items} r={r} trace={trace} canEdit={canEdit} />
      {editor}
    </div>
  );
}

/** Médias & documents sur le profil : les 5 mis en avant, puis « Voir tout ». */
function BlocMedias({ trace, auteur, onVoirTout, onAjouter }: { trace: Trace; auteur: boolean; onVoirTout: () => void; onAjouter: () => void }) {
  const libres = mediasLibres(trace);
  const { avant } = enAvantDabord(libres);
  return (
    <section className="bloc medias" aria-labelledby="h-medias">
      <div className="bloc-entete">
        <h2 id="h-medias" className="bloc-titre">
          <Icon name="archive" size={22} /> Médias & documents
        </h2>
        <span className="compte">
          {libres.length}
          {auteur ? ` / ${MAX_MEDIAS}` : ''} élément{libres.length > 1 ? 's' : ''}
        </span>
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
            <span>Déposer un média</span>
          </button>
        )}
        {libres.length === 0 && !auteur && <p className="muted petit">Aucun média déposé pour l’instant.</p>}
      </div>
      <p className="bloc-note">Photos, vidéos, enregistrements, documents et liens. Les médias joints aux fragments restent dans leurs fragments.</p>
    </section>
  );
}

function MediasTout({ trace, auteur }: { trace: Trace; auteur: boolean }) {
  const libres = mediasLibres(trace);
  const { avant, reste } = enAvantDabord(libres);
  const plein = libres.filter((m) => m.enAvant).length >= MAX_EN_AVANT;
  return (
    <div className="salle-medias-tout">
      {[...avant, ...reste].map((m) => (
        <div key={m.id} className="media-case">
          <MediaThumb m={m} size="l" />
          {auteur && (
            <span className="media-case-actions">
              <button className="lien-discret petit" onClick={() => basculerMediaEnAvant(trace.id, m.id)} disabled={!m.enAvant && plein}>
                {m.enAvant ? 'Ne plus mettre en avant' : plein ? `${MAX_EN_AVANT} déjà mis en avant` : 'Mettre en avant'}
              </button>
              {m.enAvant && <Trier onDeplacer={(sens) => deplacerMediaEnAvant(trace.id, m.id, sens)} />}
            </span>
          )}
        </div>
      ))}
      {libres.length === 0 && <p className="muted">Aucun média déposé pour l’instant.</p>}
    </div>
  );
}

/** Déposer un média ou un document dans « Médias & documents » (20 au plus), scellé à son dépôt. */
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
      const m = await creerMedia(choix, `m-${Date.now().toString(36)}`, titre.trim());
      if (!addMedia(trace.id, { ...m, legende: legende.trim() || undefined })) throw new Error(`Tu as déjà déposé ${MAX_MEDIAS} médias.`);
      onDone();
    } catch (err) {
      setErreur(err instanceof Error && err.message ? err.message : 'Ce média n’a pas pu être déposé.');
    } finally {
      setEnvoi(false);
      setConfirmer(false);
    }
  };
  return (
    <div className="editeur media-ajout-form">
      <p className="editeur-titre">
        <Icon name="plus" size={16} /> Déposer un média
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
          <Icon name="cadenas" size={16} /> Une fois déposé, ce média sera scellé : tu ne pourras plus le retirer pendant cinq ans.
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

function Salle({ titre, onClose, children }: { titre: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const opener = useMemo(() => document.activeElement as HTMLElement | null, []);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      opener?.focus?.();
    };
  }, [onClose, opener]);
  return (
    <div className="salle-scrim" onClick={onClose}>
      <div className="salle" role="dialog" aria-modal="true" aria-label={titre} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="salle-entete">
          <h2 className="salle-titre">{titre}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <Icon name="fermer" size={20} />
          </button>
        </div>
        <div className="salle-corps">{children}</div>
      </div>
    </div>
  );
}
