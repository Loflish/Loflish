import { useId, useState } from 'react';
import { addElement } from '../data/store';
import { CATEGORIES_OEUVRES, MAX_EN_AVANT, MAX_FRAGMENTS, SENS_QUESTIONS, placesRestantes, type Element, type Media, type RubriqueId, type Sens } from '../data/types';
import { creerMedia } from '../lib/fichiers';
import { Icon } from './Icon';
import { ChoixMedia, type MediaChoisi } from './Media';

/**
 * Déposer un fragment d'existence sur sa trace, avec au plus un média
 * (photo, vidéo, enregistrement, document ou lien), montré tel quel.
 * Un fragment est scellé dès qu'il est déposé : l'auteur le sait avant.
 */

type Champ = 'titre' | 'quand' | 'lieu' | 'lien' | 'categorie' | 'sens';

const CONFIG: Record<RubriqueId, { champs: Champ[]; titre?: string; texte: string; max: number }> = {
  sens: { champs: ['sens'], texte: 'Ta réponse', max: 800 },
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
  accomplissements: { champs: ['titre', 'quand'], titre: 'Ton accomplissement', texte: 'Pourquoi tu en es fier·ère', max: 1200 },
  aimeVivre: { champs: [], texte: 'Ce que tu aurais encore aimé vivre', max: 800 },
  petitesChoses: { champs: [], texte: 'Une petite chose qui te rendait heureux·se', max: 800 },
};

const TITRE_FACULTATIF: RubriqueId[] = ['paroleLibre'];

export function FragmentEditor({ traceId, rubrique, items, onDone }: { traceId: string; rubrique: RubriqueId; items: Element[]; onDone?: () => void }) {
  const cfg = CONFIG[rubrique];
  const uid = useId();
  // les sens qui ont encore de la place (10 fragments par sens)
  const sensLibres = (Object.keys(SENS_QUESTIONS) as Sens[]).filter((s) => placesRestantes(items, 'sens', s) > 0);
  const [f, setF] = useState({
    titre: '',
    texte: '',
    quand: '',
    lieu: '',
    lien: '',
    categorie: rubrique === 'oeuvres' ? 'Livre' : '',
    sens: (sensLibres[0] ?? 'voir') as Sens,
  });
  const pleinAvant = items.filter((e) => e.enAvant).length >= MAX_EN_AVANT;
  const [media, setMedia] = useState<MediaChoisi>(null);
  const [enAvant, setEnAvant] = useState(!pleinAvant);
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
    const id = `${rubrique}-${Date.now().toString(36)}`;
    try {
      const medias: Media[] = media ? [await creerMedia(media, `m-${id}`, f.titre.trim())] : [];
      const el: Element = {
        id,
        texte: f.texte.trim(),
        titre: f.titre.trim() || undefined,
        quand: f.quand.trim() || undefined,
        lieu: f.lieu.trim() || undefined,
        lien: f.lien.trim() || undefined,
        categorie: has('categorie') ? f.categorie : undefined,
        sens: has('sens') ? f.sens : undefined,
        medias: medias.map((m) => m.id),
        enAvant: enAvant && !pleinAvant,
      };
      if (!addElement(traceId, rubrique, el, medias)) {
        setErreur(`Cette rubrique a déjà ses ${MAX_FRAGMENTS} fragments.`);
        return;
      }
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

  const complet = rubrique === 'sens' ? sensLibres.length === 0 : placesRestantes(items, rubrique) === 0;
  if (complet) {
    return (
      <p className="editeur-complet">
        {rubrique === 'sens' ? `Chaque sens a ses ${MAX_FRAGMENTS} fragments.` : `Cette rubrique a ses ${MAX_FRAGMENTS} fragments.`}
      </p>
    );
  }
  const restant = rubrique === 'sens' ? placesRestantes(items, 'sens', f.sens) : placesRestantes(items, rubrique);

  return (
    <form className="editeur" onSubmit={submit}>
      <p className="editeur-titre">
        <Icon name="plus" size={16} /> Ajouter un fragment
        <span className="editeur-places">
          {restant} place{restant > 1 ? 's' : ''} sur {MAX_FRAGMENTS}
          {rubrique === 'sens' ? ' pour ce sens' : ''}
        </span>
      </p>
      {has('sens') && (
        <label className="field">
          <span className="field-label">Le sens</span>
          <select id={`${uid}-sens`} value={f.sens} onChange={(e) => setF({ ...f, sens: e.target.value as Sens })}>
            {sensLibres.map((s) => (
              <option key={s} value={s}>
                {SENS_QUESTIONS[s].question}
              </option>
            ))}
          </select>
        </label>
      )}
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
          <span className="field-label">Votre lien (facultatif)</span>
          <input id={`${uid}-lien`} value={f.lien} maxLength={60} placeholder="ma sœur, un ami, une professeure…" onChange={(e) => setF({ ...f, lien: e.target.value })} />
        </label>
      )}
      {(has('quand') || has('lieu')) && (
        <div className="editeur-rang">
          {has('quand') && (
            <label className="field">
              <span className="field-label">Quand (facultatif)</span>
              <input id={`${uid}-quand`} value={f.quand} maxLength={40} placeholder="été 2009, 1994 — 2005…" onChange={(e) => setF({ ...f, quand: e.target.value })} />
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
      <div className="field">
        <span className="field-label">Un média ou un document (facultatif, un seul)</span>
        <ChoixMedia value={media} onChange={setMedia} id={`${uid}-media`} />
      </div>
      <label className="check">
        <input type="checkbox" checked={enAvant && !pleinAvant} disabled={pleinAvant} onChange={(e) => setEnAvant(e.target.checked)} />
        <span>
          {pleinAvant
            ? `Les ${MAX_EN_AVANT} places mises en avant sont prises : ce fragment sera visible avec « Voir tout ».`
            : `Mettre en avant sur mon profil (${MAX_EN_AVANT} par rubrique)`}
        </span>
      </label>
      {erreur && (
        <p className="editeur-erreur" role="alert">
          {erreur}
        </p>
      )}
      {confirmer && (
        <p className="editeur-scelle" role="alert">
          <Icon name="cadenas" size={16} /> Une fois déposé, ce fragment sera scellé : tu ne pourras plus le modifier ni le retirer pendant
          cinq ans.
        </p>
      )}
      <div className="editeur-actions">
        <button className="bouton" type="submit" disabled={!valide || envoi}>
          {envoi ? 'Dépôt…' : confirmer ? 'Déposer et sceller' : 'Ajouter à ma trace'}
        </button>
        {confirmer && !envoi && (
          <button type="button" className="lien-discret" onClick={() => setConfirmer(false)}>
            Relire encore
          </button>
        )}
        <span className={`editeur-ok${ok ? ' is-on' : ''}`} aria-live="polite">
          {ok ? 'Déposé et scellé.' : ''}
        </span>
      </div>
    </form>
  );
}
