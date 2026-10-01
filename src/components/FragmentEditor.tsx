import { useId, useState } from 'react';
import { deposerFragment, modifierFragment } from '../data/store';
import { CATEGORIES_OEUVRES, limiteDe, placesRestantes, type Element, type RubriqueId } from '../data/types';
import { Icon } from './Icon';
import { ChoixMedia, type MediaChoisi } from './Media';

/**
 * Déposer un fragment d'existence sur sa trace, avec au plus un fichier
 * (photo, vidéo, enregistrement, document) ou un lien, montré tel quel.
 * Un fragment est scellé dès qu'il est déposé : l'auteur le sait avant.
 * Cinq ans plus tard, il se modifie ici aussi (et il est scellé de nouveau).
 */

type Champ = 'titre' | 'quand' | 'lieu' | 'lien' | 'categorie';

const CONFIG: Record<RubriqueId, { champs: Champ[]; titre?: string; texte: string; max: number }> = {
  voir: { champs: [], texte: 'Ce que tu aimerais voir', max: 800 },
  entendre: { champs: [], texte: 'Ce que tu aimerais entendre', max: 800 },
  sentir: { champs: [], texte: 'Ce que tu aimerais sentir', max: 800 },
  gouter: { champs: [], texte: 'Ce que tu aimerais manger', max: 800 },
  toucher: { champs: [], texte: 'Ce que tu aimerais toucher ou tenir', max: 800 },
  souvenirs: { champs: ['titre', 'quand', 'lieu'], titre: 'Titre du souvenir', texte: 'Raconte', max: 1200 },
  chapitres: { champs: ['titre', 'quand'], titre: 'Nom du chapitre', texte: 'Ce qu’il a été', max: 1200 },
  oeuvres: { champs: ['titre', 'categorie'], titre: 'L’œuvre', texte: 'Pourquoi cette œuvre t’a marqué ?', max: 1200 },
  jamaisDit: { champs: [], texte: 'Ce que tu n’as jamais dit', max: 1200 },
  paroleLibre: { champs: ['titre'], titre: 'Titre (facultatif)', texte: 'Ta parole', max: 1200 },
  personnes: { champs: ['titre', 'lien'], titre: 'Son nom ou surnom', texte: 'Ce qu’elle a représenté pour toi', max: 1200 },
  lieux: { champs: ['titre', 'lieu'], titre: 'Le lieu', texte: 'Pourquoi il a compté', max: 1200 },
  convictions: { champs: ['titre'], titre: 'Ta conviction', texte: 'Ce en quoi tu crois', max: 1200 },
  objets: { champs: ['titre'], titre: 'L’objet', texte: 'Son histoire', max: 1200 },
  creations: { champs: ['titre', 'quand'], titre: 'Ta création', texte: 'Ce qu’elle raconte de toi', max: 1200 },
  accomplissements: { champs: ['titre', 'quand'], titre: 'Ton accomplissement', texte: 'Pourquoi il compte pour toi', max: 1200 },
  aimeVivre: { champs: [], texte: 'Ce que tu aurais encore aimé vivre', max: 800 },
  petitesChoses: { champs: [], texte: 'Une petite chose qui faisait ton bonheur', max: 800 },
};

/** Pour une mémoire, les mêmes champs, dits à propos de la personne. */
const CONFIG_MEMOIRE: Partial<Record<RubriqueId, { titre?: string; texte: string }>> = {
  voir: { texte: 'Ce qu’elle aimait voir' },
  entendre: { texte: 'Ce qu’elle aimait entendre' },
  sentir: { texte: 'Ce qu’elle aimait sentir' },
  gouter: { texte: 'Ce qu’elle aimait manger' },
  toucher: { texte: 'Ce qu’elle aimait toucher ou tenir' },
  chapitres: { titre: 'Nom du chapitre', texte: 'Ce qu’il a été pour elle' },
  oeuvres: { titre: 'L’œuvre', texte: 'Pourquoi cette œuvre l’a marquée' },
  jamaisDit: { texte: 'Ce que tu ne lui as jamais dit' },
  personnes: { titre: 'Son nom ou surnom', texte: 'Ce que cette personne a représenté pour elle' },
  lieux: { titre: 'Le lieu', texte: 'Pourquoi il a compté pour elle' },
  convictions: { titre: 'Sa conviction', texte: 'Ce en quoi elle croyait' },
  objets: { titre: 'L’objet', texte: 'Son histoire' },
  creations: { titre: 'Sa création', texte: 'Ce qu’elle raconte d’elle' },
  accomplissements: { titre: 'Son accomplissement', texte: 'Pourquoi il comptait' },
  aimeVivre: { texte: 'Ce qu’elle aurait encore aimé vivre' },
  petitesChoses: { texte: 'Une petite chose qui faisait son bonheur' },
};

const TITRE_FACULTATIF: RubriqueId[] = ['paroleLibre'];

export function FragmentEditor({
  traceId,
  rubrique,
  items,
  onDone,
  memoire = false,
  modifier,
}: {
  traceId: string;
  rubrique: RubriqueId;
  items: Element[];
  onDone?: () => void;
  memoire?: boolean;
  /** un fragment déjà déposé, dont les cinq ans sont passés */
  modifier?: Element;
}) {
  const cfg = { ...CONFIG[rubrique], ...(memoire ? CONFIG_MEMOIRE[rubrique] : {}) };
  const uid = useId();
  const [f, setF] = useState({
    titre: modifier?.titre ?? '',
    texte: modifier?.texte ?? '',
    quand: modifier?.quand ?? '',
    lieu: modifier?.lieu ?? '',
    lien: modifier?.lien ?? '',
    categorie: modifier?.categorie ?? (rubrique === 'oeuvres' ? 'Livre' : ''),
  });
  const [media, setMedia] = useState<MediaChoisi>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [ok, setOk] = useState(false);
  const has = (c: Champ) => cfg.champs.includes(c);
  const titreRequis = has('titre') && !TITRE_FACULTATIF.includes(rubrique);
  const valide = f.texte.trim().length > 0 && (!titreRequis || f.titre.trim().length > 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valide || envoi) return;
    // d'abord, l'auteur sait que ce qu'il dépose sera scellé
    if (!confirmer) {
      setConfirmer(true);
      return;
    }
    setEnvoi(true);
    setErreur('');
    const champs = {
      texte: f.texte.trim(),
      titre: f.titre.trim() || undefined,
      quand: f.quand.trim() || undefined,
      lieu: f.lieu.trim() || undefined,
      lien: f.lien.trim() || undefined,
      categorie: has('categorie') ? f.categorie : undefined,
    };
    try {
      // aperçu autonome : gardé dans ce navigateur ; en ligne : envoyé au musée, qui vérifie chaque règle
      if (modifier) await modifierFragment(traceId, rubrique, modifier.id, champs);
      else await deposerFragment(traceId, rubrique, champs, media, f.titre.trim());
    } catch (err) {
      setErreur(err instanceof Error && err.message ? err.message : 'Le fragment n’a pas pu être déposé. Essaie avec un fichier plus léger.');
      return;
    } finally {
      setEnvoi(false);
      setConfirmer(false);
    }
    setF((x) => ({ ...x, titre: '', texte: '', quand: '', lieu: '', lien: '' }));
    setMedia(null);
    setOk(true);
    window.setTimeout(() => setOk(false), 2600);
    onDone?.();
  };

  const restant = placesRestantes(items, rubrique);
  if (!modifier && restant === 0) return <p className="editeur-complet">Cette rubrique a ses {limiteDe(rubrique)} fragments.</p>;

  return (
    <form className="editeur" onSubmit={submit}>
      <p className="editeur-titre">
        {modifier ? (
          'Modifier ce fragment'
        ) : (
          <>
            <Icon name="plus" size={16} /> Ajouter un fragment
            <span className="editeur-places">
              {restant} place{restant > 1 ? 's' : ''} sur {limiteDe(rubrique)}
            </span>
          </>
        )}
      </p>
      {has('titre') && (
        <label className="field">
          <span className="field-label">{cfg.titre}</span>
          <input id={`${uid}-titre`} value={f.titre} maxLength={90} onChange={(e) => setF({ ...f, titre: e.target.value })} />
        </label>
      )}
      {has('categorie') && (
        <label className="field">
          <span className="field-label">Catégorie</span>
          <select id={`${uid}-cat`} value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value })}>
            {CATEGORIES_OEUVRES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      )}
      {has('lien') && (
        <label className="field">
          <span className="field-label">{memoire ? 'Son lien avec elle (facultatif)' : 'Ton lien avec cette personne (facultatif)'}</span>
          <input id={`${uid}-lien`} value={f.lien} maxLength={60} placeholder="ma sœur, un ami, une professeure…" onChange={(e) => setF({ ...f, lien: e.target.value })} />
        </label>
      )}
      {(has('quand') || has('lieu')) && (
        <div className="editeur-rang">
          {has('quand') && (
            <label className="field">
              <span className="field-label">Quand (facultatif)</span>
              <input id={`${uid}-quand`} value={f.quand} maxLength={40} placeholder="été 2009, de 1994 à 2005…" onChange={(e) => setF({ ...f, quand: e.target.value })} />
            </label>
          )}
          {has('lieu') && (
            <label className="field">
              <span className="field-label">Où (facultatif)</span>
              <input id={`${uid}-lieu`} value={f.lieu} maxLength={60} placeholder="une ville, un pays…" onChange={(e) => setF({ ...f, lieu: e.target.value })} />
            </label>
          )}
        </div>
      )}
      <label className="field">
        <span className="field-label">{cfg.texte}</span>
        <textarea id={`${uid}-texte`} rows={5} maxLength={cfg.max} value={f.texte} onChange={(e) => setF({ ...f, texte: e.target.value })} />
        <span className="compteur">
          {f.texte.length} / {cfg.max}
        </span>
      </label>
      {!modifier && (
        <div className="field">
          <span className="field-label">Une photo, une vidéo, un son, un document ou un lien (facultatif, un seul)</span>
          <ChoixMedia value={media} onChange={setMedia} id={`${uid}-media`} />
        </div>
      )}
      {erreur && (
        <p className="editeur-erreur" role="alert">
          {erreur}
        </p>
      )}
      {confirmer && (
        <p className="editeur-scelle" role="alert">
          <Icon name="cadenas" size={16} />{' '}
          {modifier
            ? 'Une fois enregistré, ce fragment sera de nouveau scellé pour cinq ans.'
            : 'Une fois déposé, ce fragment sera scellé : tu ne pourras plus le modifier ni le retirer pendant cinq ans.'}
        </p>
      )}
      <div className="editeur-actions">
        <button className="bouton" type="submit" disabled={!valide || envoi}>
          {envoi ? 'Dépôt…' : confirmer ? (modifier ? 'Enregistrer et sceller' : 'Déposer et sceller') : modifier ? 'Enregistrer' : 'Ajouter'}
        </button>
        {confirmer && !envoi && (
          <button type="button" className="lien-discret" onClick={() => setConfirmer(false)}>
            Relire encore
          </button>
        )}
        {modifier && !confirmer && (
          <button type="button" className="lien-discret" onClick={() => onDone?.()}>
            Annuler
          </button>
        )}
        <span className={`editeur-ok${ok ? ' is-on' : ''}`} aria-live="polite">
          {ok ? 'Déposé et scellé.' : ''}
        </span>
      </div>
    </form>
  );
}
