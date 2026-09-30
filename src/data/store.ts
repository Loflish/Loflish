import { GRIS_PALETTE } from '../lib/palette';
import { hashString, pick, rng, shuffle } from '../lib/random';
import { MEMOIRES, NOMS, PAYS, POOL, PRENOMS, PSEUDOS, Q1, Q2, Q3, Q4, SENS_POOL } from './pools';
import { SAKINAH } from './sakinah';
import { useSyncExternalStore } from 'react';
import { MAX_EN_AVANT, MAX_MEDIAS, placesRestantes, type Element, type Media, type RubriqueId, type Trace } from './types';

/**
 * Registre des traces du prototype.
 * Remplacé en production par l'API (Next.js + PostgreSQL, cf. cahier Bloc 10).
 */

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function dateFr(r: () => number, from: number, to: number): string {
  const y = from + Math.floor(r() * (to - from + 1));
  return `${1 + Math.floor(r() * 28)} ${pick(r, MOIS)} ${y}`;
}

function nomAffiche(r: () => number): { nom: string; pseudo?: string } {
  const x = r();
  if (x < 0.12) return { nom: 'Anonyme' };
  if (x < 0.4) return { nom: pick(r, PSEUDOS) };
  if (x < 0.62) return { nom: pick(r, PRENOMS) };
  if (x < 0.72) return { nom: `${pick(r, PRENOMS)[0]}. ${pick(r, NOMS)[0]}.` };
  return { nom: `${pick(r, PRENOMS)} ${pick(r, NOMS)}` };
}

/** Évite les gros groupes de même couleur : on parcourt la palette mélangée. */
function colorCycle(r: () => number, n: number): string[] {
  const out: string[] = [];
  while (out.length < n) out.push(...shuffle(r, GRIS_PALETTE.map((c) => c.id)));
  return out.slice(0, n);
}

function items(r: () => number, pool: readonly Omit<Element, 'id'>[], prefix: string, max: number): Element[] {
  const n = 1 + Math.floor(r() * max);
  return shuffle(r, pool)
    .slice(0, n)
    .map((e, i) => ({ ...e, id: `${prefix}${i}` }));
}

function generate(count: number): Trace[] {
  const r = rng(20260930);
  const colors = colorCycle(r, count);
  const out: Trace[] = [];
  for (let i = 0; i < count; i++) {
    const id = `t${(i + 1).toString(36)}${Math.floor(r() * 1296).toString(36)}`;
    const rr = rng(hashString(id));
    const isMemoire = rr() < 0.08;
    const who = nomAffiche(rr);
    const rubriques: Partial<Record<RubriqueId, Element[]>> = {};
    const keys = shuffle(rr, Object.keys(POOL) as (keyof typeof POOL)[]).slice(0, 2 + Math.floor(rr() * 6));
    if (rr() < 0.7) rubriques.sens = items(rr, SENS_POOL, 's', 4);
    for (const k of keys) rubriques[k as RubriqueId] = items(rr, POOL[k] as Omit<Element, 'id'>[], k, 3);
    const cree = dateFr(rr, 2025, 2026);
    const trace: Trace = {
      id,
      nom: isMemoire ? pick(rr, PRENOMS) + ' ' + pick(rr, NOMS) : who.nom,
      type: isMemoire ? 'memoire' : 'personnelle',
      couleur: colors[i],
      pays: rr() < 0.85 ? pick(rr, PAYS) : undefined,
      creeLe: cree,
      majLe: cree,
      rubriques,
      medias: [],
      versions: [{ v: 1, date: cree, note: 'Création du profil' }],
      demo: true,
    };
    if (isMemoire) {
      const m = pick(rr, MEMOIRES);
      trace.memoire = { deposeePar: pick(rr, PRENOMS), relation: m.relation, origine: m.origine, aperçu: m.aperçu };
    } else {
      trace.questions = [pick(rr, Q1), pick(rr, Q2), pick(rr, Q3), Q4[i % Q4.length]];
    }
    out.push(trace);
  }
  return out;
}

const LOCAL_KEY = 'nmm:mes-traces';

/**
 * Traces enregistrées avec un ancien format : l'ancienne rubrique « Objets /
 * créations / accomplissements » est répartie entre les trois rubriques
 * séparées ; une trace publiée a ses réponses scellées, et chaque fragment
 * déjà déposé est scellé à la date de migration.
 */
function migrer(t: Trace): Trace {
  type Ancien = Element & { nature?: string };
  const maintenant = new Date().toISOString();
  const r = { ...t.rubriques } as Record<string, Ancien[]>;
  const anciens = (r.objets ?? []) as Ancien[];
  if (anciens.some((e) => e.nature)) {
    r.objets = anciens.filter((e) => !e.nature || e.nature === 'objet');
    r.creations = [...(r.creations ?? []), ...anciens.filter((e) => e.nature === 'création')];
    r.accomplissements = [...(r.accomplissements ?? []), ...anciens.filter((e) => e.nature === 'accomplissement')];
  }
  for (const k of Object.keys(r)) r[k] = r[k].map(({ nature: _n, ...e }) => ({ ...e, scelleLe: e.scelleLe ?? maintenant }));
  return { ...t, rubriques: r, scelleeLe: t.scelleeLe ?? maintenant };
}

function loadLocal(): Trace[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Trace[]).map(migrer) : [];
  } catch {
    return [];
  }
}

const generated = generate(420);
let local = loadLocal();

export function allTraces(): Trace[] {
  return [SAKINAH, ...local, ...generated];
}

export function getTrace(id: string): Trace | undefined {
  return allTraces().find((t) => t.id === id);
}

// ——— traces de l'utilisateur (prototype : conservées dans ce navigateur)

const listeners = new Set<() => void>();
let snapshot = local.slice();

function save(): void {
  snapshot = local.slice();
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
  } catch {
    /* stockage plein ou indisponible : la trace reste en mémoire pour la session */
  }
  listeners.forEach((fn) => fn());
}

/** Publier = sceller ses réponses : la trace devient publique. */
export function publishLocal(t: Trace): void {
  const maintenant = new Date().toISOString();
  const scellee: Trace = {
    ...t,
    scelleeLe: t.scelleeLe ?? maintenant,
    rubriques: Object.fromEntries(
      Object.entries(t.rubriques).map(([k, list]) => [k, (list ?? []).map((e) => ({ ...e, scelleLe: e.scelleLe ?? maintenant }))]),
    ),
  };
  local = [scellee, ...local.filter((x) => x.id !== t.id)];
  save();
}

/** Mes traces (visibles comme « miennes » uniquement sur cet appareil). */
export function useMesTraces(): Trace[] {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => snapshot,
  );
}

export function isMine(id: string): boolean {
  return local.some((t) => t.id === id);
}

function touch(t: Trace, note: string): Trace {
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const last = t.versions[0];
  const versions = last && last.date === today ? t.versions : [{ v: (last?.v ?? 0) + 1, date: today, note }, ...t.versions];
  return { ...t, majLe: today, versions };
}

export function updateLocal(id: string, fn: (t: Trace) => Trace, note = 'Mise à jour des fragments'): void {
  local = local.map((t) => (t.id === id ? touch(fn(t), note) : t));
  save();
}

// ——— règles : deux bulles au plus ; les réponses sont scellées à la publication,
// chaque fragment et chaque média au moment où il est déposé, pour cinq ans.

/** Durée pendant laquelle ce qui est scellé ne peut plus changer. */
export const ANNEES_SCELLEE = 5;

function plusCinqAns(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + ANNEES_SCELLEE);
  return d;
}

/** Date à laquelle les réponses scellées pourront de nouveau être modifiées. */
export function reouverture(t: Trace): Date | null {
  return plusCinqAns(t.scelleeLe);
}

/** Les réponses sont-elles scellées (publiées depuis moins de cinq ans) ? */
export function estScellee(t: Trace): boolean {
  const r = reouverture(t);
  return !!r && Date.now() < r.getTime();
}

/** Un fragment ou un média déposé depuis moins de cinq ans ne peut être ni modifié ni retiré. */
export function estScelle(x: { scelleLe?: string }): boolean {
  const r = plusCinqAns(x.scelleLe);
  return !!r && Date.now() < r.getTime();
}

export function dateLongue(d: Date | string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Chaque personne émet au plus deux bulles, différentes : sa propre trace, et
 * une mémoire pour une personne décédée.
 */
export function peutCreer(type: Trace['type']): boolean {
  return !local.some((t) => t.type === type);
}

/** Modifier les réponses aux quatre questions (ou l'aperçu d'une mémoire), une fois les cinq ans passés. */
export function modifierReponses(id: string, questions: Trace['questions'], apercuMemoire?: string): void {
  const t = local.find((x) => x.id === id);
  if (!t || estScellee(t)) return;
  updateLocal(
    id,
    (t) => ({
      ...t,
      questions: questions ?? t.questions,
      memoire: t.memoire && apercuMemoire !== undefined ? { ...t.memoire, aperçu: apercuMemoire } : t.memoire,
    }),
    'Nouvelles réponses',
  );
  updateLocal(id, (x) => ({ ...x, scelleeLe: new Date().toISOString() }), 'Nouvelles réponses');
}

/**
 * Dépose un fragment (avec au plus un média) : il est scellé aussitôt. Refusé
 * si la rubrique (ou le sens) a déjà ses 10 fragments. Posé en avant s'il reste
 * une des 5 places.
 */
export function addElement(id: string, rubrique: RubriqueId, e: Element, medias: Media[] = []): boolean {
  const t = local.find((x) => x.id === id);
  if (!t || placesRestantes(t.rubriques[rubrique] ?? [], rubrique, e.sens) === 0) return false;
  const maintenant = new Date().toISOString();
  updateLocal(id, (t) => {
    const list = t.rubriques[rubrique] ?? [];
    const enAvant = !!e.enAvant && list.filter((x) => x.enAvant).length < MAX_EN_AVANT;
    const el: Element = { ...e, enAvant, scelleLe: maintenant, medias: e.medias?.slice(0, 1) };
    const ms = medias.slice(0, 1).map((m) => ({ ...m, origine: rubrique, scelleLe: maintenant }));
    return { ...t, rubriques: { ...t.rubriques, [rubrique]: [...list, el] }, medias: [...t.medias, ...ms] };
  });
  return true;
}

/** Retirer un fragment : seulement une fois ses cinq ans de scellement passés. */
export function removeElement(id: string, rubrique: RubriqueId, elementId: string): void {
  updateLocal(id, (t) => ({
    ...t,
    rubriques: { ...t.rubriques, [rubrique]: (t.rubriques[rubrique] ?? []).filter((e) => e.id !== elementId || estScelle(e)) },
  }));
}

/** Poser en avant (ou non) un fragment : c'est un choix d'affichage, toujours possible, 5 au plus. */
export function basculerEnAvant(id: string, rubrique: RubriqueId, elementId: string): void {
  updateLocal(
    id,
    (t) => {
      const list = t.rubriques[rubrique] ?? [];
      const n = list.filter((e) => e.enAvant).length;
      return {
        ...t,
        rubriques: {
          ...t.rubriques,
          [rubrique]: list.map((e) => (e.id === elementId ? { ...e, enAvant: e.enAvant ? false : n < MAX_EN_AVANT } : e)),
        },
      };
    },
    'Mise en avant modifiée',
  );
}

/** Les médias & documents de la trace elle-même (les médias joints aux fragments n'en font pas partie). */
export function mediasLibres(t: Trace): Media[] {
  return t.medias.filter((m) => !m.origine);
}

/** Dépose un média ou document (20 au plus), scellé aussitôt, posé en avant s'il reste une des 5 places. */
export function addMedia(id: string, m: Media): boolean {
  const t = local.find((x) => x.id === id);
  if (!t || mediasLibres(t).length >= MAX_MEDIAS) return false;
  updateLocal(
    id,
    (t) => {
      const libres = mediasLibres(t);
      const enAvant = libres.filter((x) => x.enAvant).length < MAX_EN_AVANT;
      return { ...t, medias: [...t.medias, { ...m, origine: undefined, enAvant, scelleLe: new Date().toISOString() }] };
    },
    'Ajout de médias',
  );
  return true;
}

export function basculerMediaEnAvant(id: string, mediaId: string): void {
  updateLocal(
    id,
    (t) => {
      const n = mediasLibres(t).filter((m) => m.enAvant).length;
      return { ...t, medias: t.medias.map((m) => (m.id === mediaId && !m.origine ? { ...m, enAvant: m.enAvant ? false : n < MAX_EN_AVANT } : m)) };
    },
    'Mise en avant modifiée',
  );
}

/** Les éléments posés en avant d'abord (5 au plus), puis tous les autres. */
export function enAvantDabord<T extends { enAvant?: boolean }>(list: T[]): { avant: T[]; reste: T[] } {
  const marques = list.filter((x) => x.enAvant).slice(0, MAX_EN_AVANT);
  // sans choix de l'auteur (anciennes traces, démonstration), les premiers déposés
  const avant = marques.length ? marques : list.slice(0, MAX_EN_AVANT);
  return { avant, reste: list.filter((x) => !avant.includes(x)) };
}

/** Texte d'aperçu : les 200 caractères par défaut, ou l'aperçu d'une mémoire. */
export function apercu(t: Trace): string {
  return t.questions ? t.questions[3] : t.memoire?.aperçu ?? '';
}

export const TYPE_LABEL: Record<Trace['type'], string> = {
  personnelle: 'Trace personnelle',
  memoire: 'Mémoire pour une personne décédée',
};
