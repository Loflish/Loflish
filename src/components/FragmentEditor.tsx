import { useId, useState } from 'react';
import { addElement } from '../data/store';
import { CATEGORIES_OEUVRES, MAX_FRAGMENTS, SENS_QUESTIONS, placesRestantes, type Element, type Media, type RubriqueId, type Sens } from '../data/types';
import { Icon } from './Icon';

/**
 * Ajouter un fragment d'existence à sa trace.
 * Les photos déposées sont affichées telles quelles (aucun filtre) et
 * rejoignent automatiquement « Médias & documents ».
 */

type Champ = 'titre' | 'quand' | 'lieu' | 'lien' | 'categorie' | 'sens' | 'photo';

const CONFIG: Record<RubriqueId, { champs: Champ[]; titre?: string; texte: string; max: number }> = {
  sens: { champs: ['sens', 'photo'], texte: 'Ta réponse', max: 800 },
  souvenirs: { champs: ['titre', 'quand', 'lieu', 'photo'], titre: 'Titre du souvenir', texte: 'Raconte', max: 1200 },
  chapitres: { champs: ['titre', 'quand'], titre: 'Nom du chapitre', texte: 'Ce qu’il a été', max: 1200 },
  oeuvres: { champs: ['titre', 'categorie', 'photo'], titre: 'L’œuvre', texte: 'Pourquoi cette œuvre t’a marqué ?', max: 1200 },
  jamaisDit: { champs: [], texte: 'Ce que tu n’as jamais dit', max: 1200 },
  paroleLibre: { champs: ['titre', 'photo'], titre: 'Titre (facultatif)', texte: 'Ta parole', max: 1200 },
  personnes: { champs: ['titre', 'lien', 'photo'], titre: 'Son nom ou surnom', texte: 'Ce qu’elle a représenté pour toi', max: 1200 },
  lieux: { champs: ['titre', 'lieu', 'photo'], titre: 'Le lieu', texte: 'Pourquoi il a compté', max: 1200 },
  convictions: { champs: ['titre'], titre: 'Ta conviction', texte: 'Ce en quoi tu crois', max: 1200 },
  objets: { champs: ['titre', 'photo'], titre: 'L’objet', texte: 'Son histoire', max: 1200 },
  creations: { champs: ['titre', 'quand', 'photo'], titre: 'Ta création', texte: 'Ce qu’elle raconte de toi', max: 1200 },
  accomplissements: { champs: ['titre', 'quand'], titre: 'Ton accomplissement', texte: 'Pourquoi tu en es fier·ère', max: 1200 },
  aimeVivre: { champs: [], texte: 'Ce que tu aurais encore aimé vivre', max: 800 },
  petitesChoses: { champs: [], texte: 'Une petite chose qui te rendait heureux·se', max: 800 },
};

const TITRE_FACULTATIF: RubriqueId[] = ['paroleLibre'];

async function resizeImage(file: File, max = 1100): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function FragmentEditor({ traceId, rubrique, items, onDone }: { traceId: string; rubrique: RubriqueId; items: Element[]; onDone?: () => void }) {
  const cfg = CONFIG[rubrique];
  const uid = useId();
  // les sens qui ont encore de la place (5 fragments par sens)
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
  const [photo, setPhoto] = useState<{ src: string; name: string } | null>(null);
  const [erreur, setErreur] = useState('');
  const [ok, setOk] = useState(false);
  const has = (c: Champ) => cfg.champs.includes(c);
  const titreRequis = has('titre') && !TITRE_FACULTATIF.includes(rubrique);
  const valide = f.texte.trim().length > 0 && (!titreRequis || f.titre.trim().length > 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valide) return;
    const id = `${rubrique}-${Date.now().toString(36)}`;
    const medias: Media[] = photo
      ? [{ id: `m-${id}`, kind: 'image', titre: f.titre.trim() || photo.name, src: photo.src, origine: rubrique }]
      : [];
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
    };
    try {
      if (!addElement(traceId, rubrique, el, medias)) {
        setErreur(`Cette rubrique a déjà ses ${MAX_FRAGMENTS} fragments.`);
        return;
      }
    } catch {
      setErreur('Le fragment n’a pas pu être enregistré. Essaie avec une photo plus légère.');
      return;
    }
    setF((x) => ({ ...x, titre: '', texte: '', quand: '', lieu: '', lien: '' }));
    setPhoto(null);
    setOk(true);
    window.setTimeout(() => setOk(false), 2600);
    onDone?.();
  };

  const complet = rubrique === 'sens' ? sensLibres.length === 0 : placesRestantes(items, rubrique) === 0;
  if (complet) {
    return (
      <p className="editeur-complet">
        {rubrique === 'sens'
          ? `Chaque sens a ses ${MAX_FRAGMENTS} fragments. Pour en déposer un autre, retire d’abord un fragment.`
          : `Cette rubrique a ses ${MAX_FRAGMENTS} fragments. Pour en déposer un autre, retire d’abord un fragment.`}
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
      {has('photo') && (
        <div className="field">
          <span className="field-label">Une photo (facultatif)</span>
          {photo ? (
            <div className="editeur-photo">
              <img src={photo.src} alt="" />
              <button type="button" className="lien-discret petit" onClick={() => setPhoto(null)}>
                Retirer la photo
              </button>
            </div>
          ) : (
            <label className="editeur-fichier lien-discret" htmlFor={`${uid}-photo`}>
              <Icon name="image" size={16} /> Choisir une photo
            </label>
          )}
          {!photo && (
            <input
              id={`${uid}-photo`}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setPhoto({ src: await resizeImage(file), name: file.name.replace(/\.[^.]+$/, '') });
                } catch {
                  setErreur('Cette image n’a pas pu être lue.');
                }
              }}
            />
          )}
        </div>
      )}
      {erreur && <p className="editeur-erreur" role="alert">{erreur}</p>}
      <div className="editeur-actions">
        <button className="bouton" type="submit" disabled={!valide}>
          Ajouter à ma trace
        </button>
        <span className={`editeur-ok${ok ? ' is-on' : ''}`} aria-live="polite">
          {ok ? 'Ajouté.' : ''}
        </span>
      </div>
    </form>
  );
}
