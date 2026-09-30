import type { Trace } from '../data/types';

/**
 * Le lien avec le serveur du musée (dossier server/).
 *
 * Le site fonctionne de deux façons :
 * - construit avec VITE_API (par exemple « /api »), il parle au vrai musée :
 *   comptes, traces, médias, œuvre commune, archives, modération ;
 * - sans VITE_API, c'est le prototype autonome (aperçu, démonstration) : tout
 *   reste dans le navigateur.
 */
const BRUT = (import.meta.env.VITE_API as string | undefined)?.replace(/\/$/, '') ?? '';
export const EN_LIGNE = BRUT !== '';
/** l'origine du serveur, quand l'API est sur un autre domaine que le site */
const ORIGINE = /^https?:\/\//.test(BRUT) ? new URL(BRUT).origin : '';
/** montrer aussi les traces de démonstration (jamais en production) */
export const DEMO = !EN_LIGNE || import.meta.env.VITE_DEMO === '1';

export class ErreurApi extends Error {
  constructor(
    message: string,
    public statut: number,
    public code: string,
  ) {
    super(message);
  }
}

/** Un appel au serveur. Les erreurs arrivent avec un message clair, en français. */
export async function appel<T = unknown>(methode: string, chemin: string, corps?: unknown): Promise<T> {
  const url = `${BRUT}${chemin.replace(/^\/api/, '')}`;
  const formulaire = typeof FormData !== 'undefined' && corps instanceof FormData;
  let r: Response;
  try {
    r = await fetch(url, {
      method: methode,
      credentials: 'include',
      headers: corps === undefined || formulaire ? undefined : { 'content-type': 'application/json' },
      body: corps === undefined ? undefined : formulaire ? corps : JSON.stringify(corps),
    });
  } catch {
    throw new ErreurApi('Le musée ne répond pas. Vérifie ta connexion et réessaie.', 0, 'reseau');
  }
  const d = (await r.json().catch(() => ({}))) as { erreur?: string; code?: string } & T;
  if (!r.ok) throw new ErreurApi(d.erreur ?? 'Une erreur est survenue.', r.status, d.code ?? 'erreur');
  return d;
}

/** L'adresse complète d'une route de l'API (liens de téléchargement). */
export const adresseApi = (chemin: string) => `${BRUT}${chemin.replace(/^\/api/, '')}`;

/** Les fichiers servis par le serveur : même adresse si le site et l'API partagent le domaine. */
export function adresseFichier(src?: string): string | undefined {
  return src && ORIGINE && src.startsWith('/api/') ? ORIGINE + src : src;
}

export function normaliserTrace(t: Trace): Trace {
  return { ...t, medias: (t.medias ?? []).map((m) => ({ ...m, src: adresseFichier(m.src) })) };
}

/** Une présence de la constellation (légère) : juste ce qu'il faut pour la bulle et son aperçu. */
export interface Presence {
  id: string;
  nom: string;
  type: Trace['type'];
  couleur: string;
  matiere?: number;
  pays?: string;
  creeLe: string;
  apercu?: string;
}

export function depuisPresence(p: Presence): Trace {
  return {
    id: p.id,
    nom: p.nom,
    type: p.type,
    couleur: p.couleur,
    matiere: p.matiere,
    pays: p.pays,
    creeLe: p.creeLe,
    majLe: p.creeLe,
    questions: p.type === 'personnelle' ? ['', '', '', p.apercu ?? ''] : undefined,
    memoire: p.type === 'memoire' ? { deposeePar: '', aperçu: p.apercu ?? '' } : undefined,
    rubriques: {},
    medias: [],
    leger: true,
  };
}
