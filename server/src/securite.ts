import { createHmac, randomBytes } from 'node:crypto';
import { config } from './config';

/** Un jeton aléatoire, sûr, lisible dans une adresse. */
export const jeton = (octets = 32) => randomBytes(octets).toString('base64url');

/** On ne garde jamais un jeton en clair : seulement son empreinte signée. */
export const empreinte = (valeur: string) => createHmac('sha256', config.secret).update(valeur).digest('base64url');

/** Identifiant court d'une trace, pour les adresses (/trace/…). */
export function idTrace(): string {
  const a = 'abcdefghijkmnpqrstuvwxyz23456789';
  const b = randomBytes(10);
  return 't' + [...b].map((x) => a[x % a.length]).join('');
}
