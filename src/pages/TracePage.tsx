import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { BubbleImage, Footer } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { FragmentEditor } from '../components/FragmentEditor';
import { MediaThumb } from '../components/Media';
import { dateLongue, estScellee, getTrace, isMine, modifierReponses, removeElement, reouverture, sceller, TYPE_LABEL, useMesTraces } from '../data/store';
import { LIMITES, QUESTIONS, RUBRIQUES, SENS_QUESTIONS, type Element, type Media, type Rubrique, type RubriqueId, type Trace } from '../data/types';
import { colorById } from '../lib/palette';
import { useMuseumMode } from '../lib/museum';

const Q_ICONS = ['parole', 'coeur', 'globe', 'plume'];

type SalleState =
  | { kind: 'rubrique'; r: Rubrique }
  | { kind: 'medias' }
  | { kind: 'versions' }
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
  const [copied, setCopied] = useState(false);
  const scellee = !!trace && estScellee(trace);
  // modifiable tant que l'auteur ne l'a pas terminée ; ensuite scellée cinq ans
  const canEdit = editable && auteur && !scellee;
  const [edition, setEdition] = useState(false);

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

  const share = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      try {
        await navigator.share?.({ title: `${trace.nom} — Nos mots mémoriaux`, url });
      } catch {
        /* partage indisponible */
      }
    }
  };

  const color = colorById(trace.couleur);

  return (
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
          <button className="lien-discret" onClick={share}>
            <Icon name="partager" size={16} /> {copied ? 'Lien copié' : 'Partager'}
          </button>
        </div>
      </nav>

      {editable && auteur && <Scellement trace={trace} />}

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
          {canEdit && !edition && (
            <p className="bloc-note bloc-note-auteur">
              Tu peux encore modifier tes réponses tant que ta trace n’est pas terminée.{' '}
              <button className="lien-discret petit" onClick={() => setEdition(true)}>
                Modifier mes réponses
              </button>
            </p>
          )}
          {canEdit && edition ? (
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
                  <p>{i < 3 && answer.length > 170 ? answer.slice(0, 160).replace(/\s+\S*$/, '') + '…' : answer}</p>
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
              {canEdit &&
                (edition ? (
                  <ReponsesEditor trace={trace} onClose={() => setEdition(false)} />
                ) : (
                  <p className="bloc-note bloc-note-auteur">
                    Ces 200 caractères apparaissent dans l’aperçu de sa bulle.{' '}
                    <button className="lien-discret petit" onClick={() => setEdition(true)}>
                      Modifier
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
        <ul className="fragments-grid">
          {RUBRIQUES.map((r) => (
            <li key={r.id}>
              <FragmentTile r={r} trace={trace} canEdit={canEdit} onOpen={() => setSalle({ kind: 'rubrique', r })} />
            </li>
          ))}
        </ul>
      </section>

      {/* ——— Médias, versions, paramètres */}
      <div className={`trace-bas emerge${auteur ? '' : ' sans-parametres'}`}>
        <section className="bloc medias" aria-labelledby="h-medias">
          <div className="bloc-entete">
            <h2 id="h-medias" className="bloc-titre">
              <Icon name="archive" size={22} /> Médias & documents
            </h2>
            <span className="compte">{trace.medias.length} éléments</span>
            {trace.medias.length > 0 && (
              <button className="lien-discret petit" onClick={() => setSalle({ kind: 'medias' })}>
                Voir tout <Icon name="fleche" size={14} />
              </button>
            )}
          </div>
          <div className="medias-rang">
            {trace.medias.slice(0, auteur ? 5 : 6).map((m) => (
              <MediaThumb key={m.id} m={m} size="s" />
            ))}
            {auteur && (
              <button className="media-ajout" title="Prototype : l’ajout de médias sera branché au stockage des fichiers.">
                <Icon name="plus" size={20} />
                <span>Ajouter des médias</span>
              </button>
            )}
            {trace.medias.length === 0 && !auteur && <p className="muted petit">Aucun média déposé pour l’instant.</p>}
          </div>
          <p className="bloc-note">Images, audio, vidéo, liens, fichiers autorisés.</p>
        </section>

        <section className="bloc versions" aria-labelledby="h-versions">
          <div className="bloc-entete">
            <h2 id="h-versions" className="bloc-titre">
              <Icon name="horloge" size={22} /> Historique des versions
            </h2>
          </div>
          <ol className="versions-liste">
            {trace.versions.slice(0, 3).map((v) => (
              <li key={v.v}>
                <span className="version-v">v{v.v}</span>
                <span className="version-date">{v.date}</span>
                <span className="version-note">{v.note}</span>
              </li>
            ))}
          </ol>
          <button className="lien-discret petit" onClick={() => setSalle({ kind: 'versions' })}>
            Voir tout l’historique <Icon name="fleche" size={14} />
          </button>
        </section>

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
          {salle.kind === 'rubrique' && <RubriqueDetail r={salle.r} trace={trace} canEdit={canEdit} />}
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
          {salle.kind === 'medias' && (
            <div className="salle-medias">
              {trace.medias.map((m) => (
                <MediaThumb key={m.id} m={m} size="l" />
              ))}
            </div>
          )}
          {salle.kind === 'versions' && (
            <div className="salle-versions">
              <ol className="versions-liste versions-longue">
                {trace.versions.map((v) => (
                  <li key={v.v}>
                    <span className="version-v">v{v.v}</span>
                    <span className="version-date">{v.date}</span>
                    <span className="version-note">{v.note}</span>
                  </li>
                ))}
              </ol>
              <p className="muted petit">
                Une trace se complète et se modifie librement jusqu’à ce que son auteur la termine. Elle est alors scellée
                pendant cinq ans : plus rien ne change. Chaque version reste datée dans l’historique.
              </p>
            </div>
          )}
        </Salle>
      )}
    </main>
  );
}

/**
 * Bandeau de l'auteur : tant que la trace n'est pas terminée, tout se modifie ;
 * une fois terminée, elle est scellée cinq ans, sans retour en arrière.
 */
function Scellement({ trace }: { trace: Trace }) {
  const [confirmer, setConfirmer] = useState(false);
  const laquelle = trace.type === 'memoire' ? 'cette mémoire' : 'ta trace';
  if (estScellee(trace)) {
    return (
      <p className="trace-bandeau trace-bandeau-scellee emerge">
        <Icon name="cadenas" size={18} />
        <span>
          {trace.type === 'memoire' ? 'Cette mémoire est terminée' : 'Ta trace est terminée'} et scellée depuis le{' '}
          {dateLongue(trace.scelleeLe!)}. Elle pourra être modifiée à nouveau à partir du {dateLongue(reouverture(trace)!)}.
        </span>
      </p>
    );
  }
  const fin = new Date();
  fin.setFullYear(fin.getFullYear() + 5);
  return (
    <div className="trace-bandeau emerge">
      {!confirmer ? (
        <>
          <p>
            {trace.type === 'memoire' ? 'C’est la mémoire que tu as déposée.' : 'C’est ta trace.'} Complète et modifie{' '}
            {laquelle} autant que tu veux. Quand tu auras terminé, elle sera scellée pendant cinq ans.
          </p>
          <button className="bouton bouton-discret" onClick={() => setConfirmer(true)}>
            J’ai terminé
          </button>
        </>
      ) : (
        <>
          <p>
            Une fois terminée, {laquelle} ne pourra plus être modifiée pendant cinq ans, jusqu’au {dateLongue(fin)}. Aucun retour en
            arrière ne sera possible.
          </p>
          <div className="trace-bandeau-actions">
            <button className="bouton" onClick={() => sceller(trace.id)}>
              Terminer et sceller
            </button>
            <button className="lien-discret" onClick={() => setConfirmer(false)}>
              Pas encore
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Modifier ses réponses (ou les 200 caractères d'une mémoire) avant de sceller. */
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
    case 'versions':
      return 'Historique des versions';
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
  const medias = mediasOf(items, trace).slice(0, 3);
  const first = items[0];
  const empty = items.length === 0;
  return (
    <button className={`fragment${empty ? ' is-empty' : ''}`} onClick={onOpen} disabled={empty && !canEdit}>
      <span className="fragment-head">
        <Icon name={r.icone} size={26} />
        <span className="fragment-titre">{r.titre}</span>
        {!empty && <Icon name="fleche" size={16} />}
      </span>
      <span className="fragment-compte">
        {empty
          ? canEdit
            ? '+ Ajouter un premier fragment'
            : 'Rien n’a été déposé ici'
          : `${items.length} élément${items.length > 1 ? 's' : ''}${canEdit && (r.id === 'sens' || items.length < 5) ? ' · ajouter' : ''}`}
      </span>
      {medias.length > 0 && (
        <span className="fragment-medias">
          {medias.map((m) => (
            <MediaThumb key={m.id} m={m} size="s" />
          ))}
        </span>
      )}
      {first && (
        <span className="fragment-extrait">
          {r.id === 'sens' && first.sens ? <em>{SENS_QUESTIONS[first.sens].court} — </em> : first.titre ? <em>{first.titre} — </em> : null}
          {first.texte}
        </span>
      )}
    </button>
  );
}

function ElementView({ e, trace, onRemove }: { e: Element; trace: Trace; onRemove?: () => void }) {
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
      {onRemove && (
        <button className="lien-discret petit element-retirer" onClick={onRemove}>
          Retirer ce fragment
        </button>
      )}
    </article>
  );
}

function RubriqueDetail({ r, trace, canEdit }: { r: Rubrique; trace: Trace; canEdit: boolean }) {
  const items = trace.rubriques[r.id] ?? [];
  const remove = (e: Element) => (canEdit ? () => removeElement(trace.id, r.id, e.id) : undefined);
  const editor = canEdit ? <FragmentEditor key={items.length} traceId={trace.id} rubrique={r.id} items={items} /> : null;

  if (r.id === 'sens') {
    return (
      <div className="sens-detail">
        {(Object.keys(SENS_QUESTIONS) as (keyof typeof SENS_QUESTIONS)[]).map((s) => {
          const list = items.filter((e) => e.sens === s);
          if (!list.length) return null;
          return (
            <section key={s} className="sens-groupe">
              <h3 className="salle-q">{SENS_QUESTIONS[s].question}</h3>
              {list.map((e) => (
                <ElementView key={e.id} e={e} trace={trace} onRemove={remove(e)} />
              ))}
            </section>
          );
        })}
        {editor}
      </div>
    );
  }

  return (
    <div className="rubrique-detail">
      {items.length === 0 && canEdit && <p className="muted">Rien encore ici. Ce que tu ajoutes est publié sur ta trace.</p>}
      {items.map((e) => (
        <ElementView key={e.id} e={e} trace={trace} onRemove={remove(e)} />
      ))}
      {editor}
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
