import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { changerVisibiliteJournal, ecrireJournal, lireJournal, premier, supprimerEntreeJournal } from '../data/store';
import { LIMITE_JOURNAL, type EntreeJournal, type Trace } from '../data/types';
import { autoGrow } from '../lib/autogrow';
import { Icon } from './Icon';

/**
 * Le journal d'une trace personnelle (16 novembre 2026) : des blocs de texte datés que la personne écrit au fil du
 * temps, en plus de ses fragments. Chaque entrée est scellée à l'écriture, visible par tous ou gardée pour soi au
 * choix, et toujours supprimable. Le journal se lit par paquets : on n'en charge jamais plus que ce qu'on lit.
 *
 * Pour un visiteur, la partie n'apparaît que s'il y a quelque chose à lire.
 */
export function Journal({ trace, auteur }: { trace: Trace; auteur: boolean }) {
  const [entrees, setEntrees] = useState<EntreeJournal[]>([]);
  const [suite, setSuite] = useState(false);
  const [etat, setEtat] = useState<'lecture' | 'pret' | 'panne'>('lecture');
  const [plus, setPlus] = useState(false);

  const charger = useCallback(
    async (avant?: string) => {
      try {
        const r = await lireJournal(trace.id, avant);
        setEntrees((deja) => (avant ? [...deja, ...r.entrees.filter((e) => !deja.some((d) => d.id === e.id))] : r.entrees));
        setSuite(r.suite);
        setEtat('pret');
      } catch {
        setEtat((e) => (e === 'lecture' ? 'panne' : e));
      }
    },
    [trace.id],
  );
  // le journal se relit quand on change de trace ou de regard (l'auteur voit aussi ses entrées gardées pour lui)
  useEffect(() => {
    setEtat('lecture');
    void charger();
  }, [charger, auteur]);

  const lireLaSuite = async () => {
    const derniere = entrees[entrees.length - 1];
    if (!derniere || plus) return;
    setPlus(true);
    await charger(derniere.ecritLe);
    setPlus(false);
  };

  if (trace.type !== 'personnelle') return null;
  // en vue visiteur, on ne montre que ce que tout le monde peut lire
  const lisibles = auteur ? entrees : entrees.filter((e) => e.visible);
  if (!auteur && lisibles.length === 0) return null;

  return (
    <section className="bloc journal" aria-labelledby="h-journal">
      <div className="bloc-entete">
        <h2 id="h-journal" className="bloc-titre">
          <Icon name="plume" size={22} /> Journal
        </h2>
      </div>
      {auteur && <p className="bloc-note">Écris ici au fil du temps. Chaque entrée garde sa date. Tu choisis, pour chacune, si elle se montre ou si elle reste à toi.</p>}
      {auteur && trace.scelleeLe && <Ecrire traceId={trace.id} onEcrit={(e) => setEntrees((deja) => [e, ...deja])} />}
      {etat === 'panne' && (
        <p className="editeur-erreur" role="alert">
          Le journal n’a pas pu être lu. Réessaie dans un instant.
        </p>
      )}
      {etat === 'pret' && lisibles.length === 0 && auteur && <p className="muted petit">Ton journal est encore vide.</p>}
      {lisibles.length > 0 && (
        <ol className="journal-liste">
          {lisibles.map((e) => (
            <Entree
              key={e.id}
              e={e}
              auteur={auteur}
              onVisible={async (visible) => {
                await changerVisibiliteJournal(trace.id, e.id, visible);
                setEntrees((deja) => deja.map((d) => (d.id === e.id ? { ...d, visible } : d)));
              }}
              onSupprime={async () => {
                await supprimerEntreeJournal(trace.id, e.id);
                setEntrees((deja) => deja.filter((d) => d.id !== e.id));
              }}
            />
          ))}
        </ol>
      )}
      {suite && (
        <button className="lien-entrer journal-suite" onClick={() => void lireLaSuite()} disabled={plus}>
          {plus ? 'Un instant…' : 'Lire la suite du journal'} <Icon name="fleche" size={16} />
        </button>
      )}
    </section>
  );
}

/** Le jour (« 12 juin 2026 ») et l'heure (« 21 h 40 »), séparés : chacun reste d'un seul tenant à l'écran. */
function dateEtHeure(iso: string): [string, string] {
  const d = new Date(iso);
  return [premier(d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })), `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`];
}

function Entree({ e, auteur, onVisible, onSupprime }: { e: EntreeJournal; auteur: boolean; onVisible: (v: boolean) => Promise<void>; onSupprime: () => Promise<void> }) {
  // une longue entrée se replie : on voit d'un coup d'œil la suite des dates
  const longue = e.texte.length > 700 || e.texte.split('\n').length > 10;
  const [ouverte, setOuverte] = useState(false);
  const [supprimer, setSupprimer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const idTexte = useId();
  const [jour, heure] = dateEtHeure(e.ecritLe);
  const agir = async (f: () => Promise<void>) => {
    setEnvoi(true);
    setErreur('');
    try {
      await f();
    } catch (x) {
      setErreur(x instanceof Error ? x.message : 'Cela n’a pas marché. Réessaie dans un instant.');
    }
    setEnvoi(false);
  };
  return (
    <li className={`journal-entree${e.visible ? '' : ' est-privee'}`}>
      <p className="journal-date">
        <time dateTime={e.ecritLe}>
          <span className="journal-jour">{jour}</span> <span className="journal-heure">{heure}</span>
        </time>
        {auteur && !e.visible && (
          <span className="journal-prive">
            <Icon name="cadenas" size={13} /> Pour moi seulement
          </span>
        )}
      </p>
      <div className="journal-corps">
        <p id={idTexte} className={`journal-texte${longue && !ouverte ? ' est-repliee' : ''}`} dir="auto">
          {e.texte}
        </p>
        {longue && (
          <button className="lien-discret petit" onClick={() => setOuverte(!ouverte)} aria-expanded={ouverte} aria-controls={idTexte}>
            {ouverte ? 'Replier' : 'Lire en entier'}
          </button>
        )}
        {auteur && (
          <div className="journal-actions">
            <button className="lien-discret petit" disabled={envoi} onClick={() => void agir(() => onVisible(!e.visible))}>
              <Icon name={e.visible ? 'cadenas' : 'oeil'} size={14} /> {e.visible ? 'Garder pour moi' : 'Montrer à tous'}
            </button>
            {supprimer ? (
              <>
                <button className="lien-discret petit journal-effacer" disabled={envoi} onClick={() => void agir(onSupprime)}>
                  Oui, supprimer cette entrée
                </button>
                <button className="lien-discret petit" onClick={() => setSupprimer(false)}>
                  Non, la garder
                </button>
              </>
            ) : (
              <button className="lien-discret petit" onClick={() => setSupprimer(true)}>
                <Icon name="fermer" size={14} /> Supprimer
              </button>
            )}
          </div>
        )}
        {erreur && (
          <p className="editeur-erreur" role="alert">
            {erreur}
          </p>
        )}
      </div>
    </li>
  );
}

function Ecrire({ traceId, onEcrit }: { traceId: string; onEcrit: (e: EntreeJournal) => void }) {
  const [texte, setTexte] = useState('');
  // rien n'est choisi d'avance : la personne dit elle-même si l'entrée se montre
  const [visible, setVisible] = useState<boolean | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [ecrit, setEcrit] = useState(false);
  const champ = useRef<HTMLTextAreaElement | null>(null);
  const uid = useId();
  const valide = texte.trim().length > 0 && texte.length <= LIMITE_JOURNAL && visible !== null;

  const envoyer = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!valide || envoi) return;
    if (!confirmer) return setConfirmer(true);
    setEnvoi(true);
    setErreur('');
    try {
      const e = await ecrireJournal(traceId, texte, visible!);
      onEcrit(e);
      setEcrit(true);
      setTexte('');
      setVisible(null);
      setConfirmer(false);
      if (champ.current) champ.current.style.height = 'auto';
    } catch (x) {
      setErreur(x instanceof Error ? x.message : 'L’entrée n’a pas pu être écrite. Réessaie dans un instant.');
    }
    setEnvoi(false);
  };

  return (
    <form className="editeur journal-ecrire" onSubmit={(ev) => void envoyer(ev)}>
      <label className="field">
        <span className="field-label">Écrire dans mon journal</span>
        <textarea
          ref={(el) => {
            champ.current = el;
            autoGrow(el);
          }}
          rows={4}
          value={texte}
          maxLength={LIMITE_JOURNAL}
          dir="auto"
          onChange={(ev) => {
            autoGrow(ev.target);
            setTexte(ev.target.value);
            setConfirmer(false);
            setEcrit(false);
          }}
        />
        <span className={`compteur${texte.length >= LIMITE_JOURNAL * 0.9 ? ' est-proche' : ''}`}>
          {texte.length} / {LIMITE_JOURNAL}
        </span>
      </label>
      <fieldset className="journal-choix">
        <legend className="field-label">Cette entrée</legend>
        <label className="check">
          <input type="radio" name={`${uid}-visible`} checked={visible === true} onChange={() => setVisible(true)} />
          <span>Se montre à tous, sur ma trace</span>
        </label>
        <label className="check">
          <input type="radio" name={`${uid}-visible`} checked={visible === false} onChange={() => setVisible(false)} />
          <span>Reste à moi seulement</span>
        </label>
      </fieldset>
      {erreur && (
        <p className="editeur-erreur" role="alert">
          {erreur}
        </p>
      )}
      {confirmer && (
        <p className="editeur-scelle" role="alert">
          <Icon name="cadenas" size={16} /> Une fois écrite, cette entrée est scellée : son texte et sa date ne changeront plus. Tu pourras toujours la supprimer.
        </p>
      )}
      <p className="sr-only" role="status">
        {ecrit ? 'C’est écrit : l’entrée est dans ton journal.' : ''}
      </p>
      <div className="editeur-actions">
        <button className="bouton" type="submit" disabled={!valide || envoi}>
          {envoi ? 'Écriture…' : confirmer ? 'Écrire et sceller' : 'Écrire'}
        </button>
        {confirmer && !envoi && (
          <button type="button" className="lien-discret" onClick={() => setConfirmer(false)}>
            Relire encore
          </button>
        )}
      </div>
    </form>
  );
}
