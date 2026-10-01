import { useState } from 'react';
import type { Trace } from '../data/types';
import { appel, EN_LIGNE } from '../lib/api';
import { CONTACT } from '../lib/contact';
import { Icon } from './Icon';

/**
 * Signaler une trace. Trois motifs : quelqu'un est en danger ; haine,
 * harcèlement ou violence ; autre chose. Le fondateur reçoit chaque
 * signalement :
 * - en ligne, le serveur le garde et le lui envoie aussitôt par e-mail ;
 * - dans l'aperçu publié sur claude.ai, il est gardé dans le stockage partagé de la page ;
 * - ailleurs, un e-mail prêt à partir s'ouvre, adressé au fondateur.
 */

const MOTIFS = [
  ['danger', 'Quelqu’un est en danger'],
  ['haine', 'Haine, harcèlement ou violence'],
  ['autre', 'Autre chose'],
] as const;
type Motif = (typeof MOTIFS)[number][0];

type Db = { collection(p: string): { add(d: Record<string, unknown>): Promise<unknown> } };
type Usager = { id(): Promise<string | null> };
type ClaudeUse = { use(nom: string): Promise<unknown> };

/** Aperçu claude.ai : chaque personne écrit dans son propre espace (signalements/<son id>/envois) ; seul le propriétaire lit tout. */
async function garderDansLaPage(d: Record<string, unknown>): Promise<boolean> {
  const claude = (window as unknown as { claude?: ClaudeUse }).claude;
  if (!claude?.use) return false;
  try {
    const [db, u] = (await Promise.all([claude.use('db'), claude.use('user')])) as [Db | null, Usager | null];
    const id = await u?.id().catch(() => null);
    if (!db || !id) return false;
    await db.collection(`signalements/${id}/envois`).add({ ...d, envoyeLe: new Date().toISOString() });
    return true;
  } catch {
    return false;
  }
}

export function Signaler({ trace, onDone }: { trace: Trace; onDone: () => void }) {
  const [motif, setMotif] = useState<Motif>('autre');
  const [message, setMessage] = useState('');
  const [etat, setEtat] = useState<'' | 'envoi' | 'ok' | 'courriel' | 'erreur'>('');
  const [erreur, setErreur] = useState('');
  const libelle = MOTIFS.find(([v]) => v === motif)![1];

  if (etat === 'ok' || etat === 'courriel')
    return (
      <div className="salle-signaler">
        <p>
          {etat === 'ok'
            ? 'Merci. Ton signalement m’est bien parvenu : je le lis avec attention, et je déciderai de la suite.'
            : 'Merci. Ton application e-mail s’est ouverte avec le signalement : il ne reste qu’à l’envoyer.'}
        </p>
        <p className="muted petit">Le fondateur du musée</p>
        <button className="lien-entrer" onClick={onDone}>
          Revenir <Icon name="fleche" size={16} />
        </button>
      </div>
    );

  const envoyer = async () => {
    setEtat('envoi');
    const corps = { traceId: trace.id, motif, message: message.trim() || undefined };
    try {
      if (EN_LIGNE) {
        await appel('POST', '/api/signalements', corps);
        return setEtat('ok');
      }
      if (await garderDansLaPage({ ...corps, traceNom: trace.nom })) return setEtat('ok');
      const sujet = `Signalement : ${libelle}`;
      const texte = `Trace : ${trace.nom} (${trace.id})\nMotif : ${libelle}\n\n${message.trim()}`;
      window.location.href = `mailto:${CONTACT}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(texte)}`;
      setEtat('courriel');
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Le signalement n’a pas pu partir.');
      setEtat('erreur');
    }
  };

  return (
    <div className="salle-signaler editeur">
      <p className="salle-signaler-intro">Je lis moi-même chaque signalement, et je décide de la suite.</p>
      {motif === 'danger' && (
        <p className="mot-fondateur">
          Si quelqu’un est en danger immédiat, appelle les services d’urgence. Pour parler à quelqu’un, gratuitement et dans ta langue :{' '}
          <a href="https://findahelpline.com" target="_blank" rel="noreferrer">
            findahelpline.com
          </a>
          .
        </p>
      )}
      <fieldset className="field">
        <legend className="field-label">Ce qui ne va pas</legend>
        {MOTIFS.map(([v, l]) => (
          <label key={v} className="check">
            <input type="radio" name="motif" checked={motif === v} onChange={() => setMotif(v)} />
            <span>{l}</span>
          </label>
        ))}
      </fieldset>
      <label className="field">
        <span className="field-label">Quelques mots (facultatif)</span>
        <textarea value={message} maxLength={2000} rows={4} onChange={(e) => setMessage(e.target.value)} />
      </label>
      {etat === 'erreur' && (
        <p className="editeur-erreur" role="alert">
          {erreur}
        </p>
      )}
      <button className="bouton" onClick={envoyer} disabled={etat === 'envoi'}>
        {etat === 'envoi' ? 'Envoi…' : 'Envoyer le signalement'}
      </button>
    </div>
  );
}
