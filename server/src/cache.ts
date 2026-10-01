import { randomBytes } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Les réponses lues par tous les visiteurs (la constellation, l'œuvre commune) sont gardées en
 * mémoire et ne sont recalculées qu'après une écriture. Le navigateur, lui, redemande avec
 * l'étiquette (ETag) de sa version : si rien n'a changé, il reçoit un simple « 304 », sans données.
 *
 * Toute écriture réussie (POST, PUT, DELETE) change la version : c'est plus simple et plus sûr que
 * de suivre chaque endroit du code qui touche aux traces ou aux traits.
 */
const demarrage = randomBytes(4).toString('hex');
let version = 0;

export function changement() {
  version++;
}

export const versionActuelle = () => version;

/** L'étiquette d'une réponse : propre à ce démarrage du serveur, à la version, et à un éventuel détail. */
export const etiquette = (nom: string, detail = '') => `"${nom}-${demarrage}-${version}${detail ? '-' + detail : ''}"`;

/** Vrai si le navigateur a déjà cette version (la réponse 304 est alors envoyée). */
export function dejaAJour(req: FastifyRequest, rep: FastifyReply, etag: string): boolean {
  rep.header('etag', etag);
  const recu = req.headers['if-none-match'];
  if (!recu || !recu.split(',').some((e) => e.trim().replace(/^W\//, '') === etag)) return false;
  rep.status(304).send();
  return true;
}

/** Une valeur calculée une fois par version. */
export function memoire<T>(calculer: () => Promise<T>): () => Promise<T> {
  let pour = -1;
  let valeur: Promise<T> | null = null;
  return () => {
    if (!valeur || pour !== version) {
      pour = version;
      valeur = calculer().catch((e) => {
        valeur = null;
        throw e;
      });
    }
    return valeur;
  };
}
