import { useState } from 'react';
import { modifierParametres } from '../data/store';
import type { Parametres, Trace } from '../data/types';
import { Icon } from './Icon';

/**
 * Les choix de chacun sur l'usage de sa trace : ce ne sont pas des contenus,
 * ils ne sont jamais scellés. Un clic les change, tout de suite ; ils ne
 * s'affichent jamais publiquement (le fondateur, lui, les voit).
 */
export const CHOIX: { cle: keyof Pick<Parametres, 'archivageLongueDuree' | 'droitsReutilisation' | 'reseauxSociaux' | 'feedbackPrive'>; icone: string; titre: string; detail: string }[] = [
  {
    cle: 'archivageLongueDuree',
    icone: 'archive',
    titre: 'Archives de longue durée',
    detail: 'Confier une copie de ma trace à une archive faite pour traverser les siècles (comme l’Arctic World Archive).',
  },
  {
    cle: 'droitsReutilisation',
    icone: 'aiguille',
    titre: 'Musée et broderie',
    detail: 'Permettre que mes mots soient présentés dans le futur musée et deviennent une œuvre brodée à la main.',
  },
  {
    cle: 'reseauxSociaux',
    icone: 'reseau',
    titre: 'Réseaux sociaux',
    detail: 'Permettre que certains de mes mots soient partagés sur les réseaux sociaux du projet.',
  },
  {
    cle: 'feedbackPrive',
    icone: 'enveloppe',
    titre: 'Messages privés',
    detail: 'Accepter de recevoir des messages privés à propos de ma trace (jamais affichés publiquement).',
  },
];

export function ChoixConfidentialite({ trace }: { trace: Trace }) {
  const [erreur, setErreur] = useState('');
  return (
    <>
      <ul className="choix-liste">
        {CHOIX.map((c) => {
          const oui = !!trace.parametres?.[c.cle];
          return (
            <li key={c.cle}>
              <label className="choix-ligne">
                <Icon name={c.icone} size={22} />
                <span className="choix-texte-bloc">
                  <span className="choix-nom">{c.titre}</span>
                  <span className="choix-detail">{c.detail}</span>
                </span>
                <span className="interrupteur">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={oui}
                    onChange={(e) =>
                      void modifierParametres(trace.id, { [c.cle]: e.target.checked })
                        .then(() => setErreur(''))
                        .catch((err) => setErreur(err instanceof Error ? err.message : 'Ce choix n’a pas pu être enregistré.'))
                    }
                  />
                  <span className="interrupteur-etat">{oui ? 'Oui' : 'Non'}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {erreur && (
        <p className="editeur-erreur" role="alert">
          {erreur}
        </p>
      )}
    </>
  );
}
