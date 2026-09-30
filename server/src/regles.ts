/**
 * Les règles du musée, appliquées par le serveur : le site les montre, mais
 * c'est ici qu'elles font foi. Les limites viennent du même fichier que le
 * site (src/data/types.ts), pour qu'elles ne divergent jamais.
 */
import { LIMITES, MAX_EN_AVANT, MAX_MEDIAS, RUBRIQUES, limiteDe, type RubriqueId } from '../../src/data/types';

export { LIMITES, MAX_EN_AVANT, MAX_MEDIAS, limiteDe };
export type { RubriqueId };

export const RUBRIQUE_IDS = new Set<string>(RUBRIQUES.map((r) => r.id));
export const estRubrique = (r: string): r is RubriqueId => RUBRIQUE_IDS.has(r);

/** Ce qui est scellé ne change pas pendant cinq ans. */
export const ANNEES_SCELLEE = 5;
export function scelleEncore(depuis: Date | string, maintenant = new Date()): boolean {
  const d = new Date(depuis);
  d.setFullYear(d.getFullYear() + ANNEES_SCELLEE);
  return d > maintenant;
}
export function reouverture(depuis: Date | string): Date {
  const d = new Date(depuis);
  d.setFullYear(d.getFullYear() + ANNEES_SCELLEE);
  return d;
}

/** Fichiers acceptés : leur vraie nature est lue dans le fichier lui-même, pas dans son nom. */
export type Nature = 'image' | 'video' | 'audio' | 'document';
export const TAILLES_MAX: Record<Nature, number> = {
  image: 25 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  document: 25 * 1024 * 1024,
};
const MIMES: Record<string, Nature> = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image', 'image/gif': 'image', 'image/heic': 'image', 'image/avif': 'image',
  'video/mp4': 'video', 'video/webm': 'video', 'video/quicktime': 'video',
  'audio/mpeg': 'audio', 'audio/mp4': 'audio', 'audio/x-m4a': 'audio', 'audio/ogg': 'audio', 'audio/opus': 'audio', 'audio/wav': 'audio', 'audio/x-wav': 'audio', 'audio/webm': 'audio', 'audio/aac': 'audio', 'audio/flac': 'audio', 'audio/x-flac': 'audio',
  'application/pdf': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.oasis.opendocument.text': 'document',
  'application/msword': 'document', 'application/x-cfb': 'document', 'application/rtf': 'document', 'text/plain': 'document',
};
export function natureDe(mime: string): Nature | null {
  return MIMES[mime] ?? null;
}

/** Un lien n'est accepté que s'il mène à une vraie page web. */
export function lienValide(texte: string): string | null {
  try {
    const t = texte.trim();
    const u = new URL(/^[a-z]+:\/\//i.test(t) ? t : `https://${t}`);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}

/** Les couleurs GRIS des bulles (identifiants du site : b1…, v1…). */
export const couleurValide = (c: string) => /^[a-z]{1,2}\d{1,2}$/.test(c);

/** L'œuvre commune mesure 1,6 × 1 ; un trait fait au plus 0,3 (lib/oeuvre.ts du site). */
export const MONDE = { l: 1.6, h: 1 };
export const LONGUEUR_MAX_TRAIT = 0.3;
