import { useEffect, useState } from 'react';
import type { Media, MediaKind } from '../data/types';

/**
 * Fichiers déposés (photos, vidéos, enregistrements, documents).
 *
 * Prototype : ils sont gardés dans la base IndexedDB du navigateur (assez
 * grande pour des vidéos, contrairement au localStorage). En production, ils
 * iront dans le stockage des médias du serveur, à la même adresse logique.
 */

const DB = 'nmm-fichiers';
const STORE = 'fichiers';

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function enregistrerFichier(id: string, blob: Blob): Promise<void> {
  const db = await ouvrir();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function lireFichier(id: string): Promise<Blob | null> {
  const db = await ouvrir();
  return new Promise((res) => {
    const req = db.transaction(STORE).objectStore(STORE).get(id);
    req.onsuccess = () => res((req.result as Blob) ?? null);
    req.onerror = () => res(null);
  });
}

const urls = new Map<string, Promise<string | null>>();

/** Adresse lisible par le navigateur pour un média (fichier déposé, image de démonstration ou lien). */
export function useMediaUrl(m: Media | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(m?.src ?? null);
  useEffect(() => {
    if (!m) return setUrl(null);
    if (m.src) return setUrl(m.src);
    if (!m.fichier) return setUrl(null);
    let p = urls.get(m.id);
    if (!p) {
      p = lireFichier(m.id).then((b) => (b ? URL.createObjectURL(b) : null));
      urls.set(m.id, p);
    }
    let vivant = true;
    void p.then((u) => vivant && setUrl(u));
    return () => {
      vivant = false;
    };
  }, [m]);
  return url;
}

/** Tailles maximales acceptées dans le prototype. */
export const TAILLES_MAX: Record<Exclude<MediaKind, 'lien'>, number> = {
  image: 25 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  document: 25 * 1024 * 1024,
};

export const ACCEPT = 'image/*,video/*,audio/*,application/pdf,.pdf,.txt,.doc,.docx,.odt,.rtf';

export function natureDe(file: File): Exclude<MediaKind, 'lien'> {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'document';
}

/** Les photos sont allégées (1600 px) ; tout le reste est gardé tel quel, sans filtre. */
async function alleger(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    if (k === 1 && file.size < 2.5 * 1024 * 1024) return file;
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res) => c.toBlob((b) => res(b ?? file), 'image/jpeg', 0.86));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function duree(file: File, kind: 'video' | 'audio'): Promise<string | undefined> {
  return new Promise((res) => {
    const el = document.createElement(kind);
    const url = URL.createObjectURL(file);
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      const s = Math.round(el.duration);
      URL.revokeObjectURL(url);
      res(Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : undefined);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      res(undefined);
    };
    el.src = url;
  });
}

/**
 * Prépare un fichier déposé : vérifie sa taille, l'enregistre et renvoie le
 * média correspondant. Lève une erreur lisible si le fichier ne convient pas.
 */
export async function deposerFichier(file: File, id: string, titre: string): Promise<Media> {
  const kind = natureDe(file);
  if (file.size > TAILLES_MAX[kind]) {
    const mo = Math.round(TAILLES_MAX[kind] / 1024 / 1024);
    throw new Error(`Ce fichier est trop lourd (${mo} Mo au plus pour ce type).`);
  }
  const blob = kind === 'image' ? await alleger(file) : file;
  await enregistrerFichier(id, blob);
  return {
    id,
    kind,
    titre: titre || file.name.replace(/\.[^.]+$/, ''),
    fichier: true,
    mime: blob.type || file.type,
    nom: file.name,
    taille: blob.size,
    duree: kind === 'video' || kind === 'audio' ? await duree(file, kind) : undefined,
  };
}

/**
 * Prépare un fichier pour l'envoi au serveur : photo allégée, durée lue pour
 * les vidéos et les enregistrements, taille vérifiée d'avance.
 */
export async function preparerEnvoi(file: File): Promise<{ fichier: File; duree?: string }> {
  const kind = natureDe(file);
  if (file.size > TAILLES_MAX[kind]) {
    const mo = Math.round(TAILLES_MAX[kind] / 1024 / 1024);
    throw new Error(`Ce fichier est trop lourd (${mo} Mo au plus pour ce type).`);
  }
  if (kind === 'image') {
    const b = await alleger(file);
    return { fichier: b === file ? file : new File([b], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }) };
  }
  return { fichier: file, duree: kind === 'video' || kind === 'audio' ? await duree(file, kind) : undefined };
}

/** Un lien n'est accepté que s'il mène à une vraie page web (http ou https). */
export function lienValide(texte: string): URL | null {
  try {
    const u = new URL(texte.trim().match(/^[a-z]+:\/\//i) ? texte.trim() : `https://${texte.trim()}`);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}

/** Lecteur intégré pour les vidéos YouTube ou Vimeo partagées en lien (sans cookies publicitaires). */
export function lecteurIntegre(url: string): string | null {
  const u = lienValide(url);
  if (!u) return null;
  const h = u.hostname.replace(/^www\.|^m\./, '');
  let id: string | null = null;
  if (h === 'youtu.be') id = u.pathname.slice(1);
  else if (h === 'youtube.com') id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)/)?.[1] ?? null;
  if (id && /^[\w-]{6,}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
  const v = h === 'vimeo.com' ? u.pathname.match(/^\/(\d+)/)?.[1] : null;
  return v ? `https://player.vimeo.com/video/${v}` : null;
}

export function tailleLisible(o?: number): string {
  if (!o) return '';
  return o > 1024 * 1024 ? `${(o / 1024 / 1024).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(o / 1024))} Ko`;
}

/** Transforme le choix de l'auteur (fichier ou lien) en média prêt à déposer. */
export async function creerMedia(choix: { file: File } | { url: string }, id: string, titre: string): Promise<Media> {
  if ('file' in choix) return deposerFichier(choix.file, id, titre);
  const u = lienValide(choix.url);
  if (!u) throw new Error('Cette adresse ne mène pas à une page web.');
  return { id, kind: 'lien', url: u.href, titre: titre || u.hostname.replace(/^www\./, '') };
}
