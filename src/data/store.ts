import { GRIS_PALETTE } from '../lib/palette';
import { hashString, pick, rng, shuffle } from '../lib/random';
import { MEMOIRES, NOMS, PAYS, POOL, PRENOMS, PSEUDOS, Q1, Q2, Q3, Q4, SENS_POOL } from './pools';
import { SAKINAH } from './sakinah';
import { useSyncExternalStore } from 'react';
import { placesRestantes, type Element, type Media, type RubriqueId, type Trace } from './types';

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
 * séparées, et chaque rubrique est ramenée à 5 fragments (5 par sens).
 */
function migrer(t: Trace): Trace {
  type Ancien = Element & { nature?: string; enAvant?: boolean };
  const r = { ...t.rubriques } as Record<string, Ancien[]>;
  const anciens = (r.objets ?? []) as Ancien[];
  if (anciens.some((e) => e.nature)) {
    r.objets = anciens.filter((e) => !e.nature || e.nature === 'objet');
    r.creations = [...(r.creations ?? []), ...anciens.filter((e) => e.nature === 'création')];
    r.accomplissements = [...(r.accomplissements ?? []), ...anciens.filter((e) => e.nature === 'accomplissement')];
  }
  for (const k of Object.keys(r)) {
    const list = r[k].map(({ nature: _n, enAvant: _a, ...e }) => e);
    r[k] =
      k === 'sens'
        ? list.filter((e, i) => list.slice(0, i).filter((x) => x.sens === e.sens).length < 5)
        : list.slice(0, 5);
  }
  return { ...t, rubriques: r };
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

export function publishLocal(t: Trace): void {
  local = [t, ...local.filter((x) => x.id !== t.id)];
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
  // une trace scellée ne bouge plus pendant cinq ans
  local = local.map((t) => (t.id === id && !estScellee(t) ? touch(fn(t), note) : t));
  save();
}

// ——— règles : deux bulles au plus, trace scellée cinq ans une fois terminée

/** Durée pendant laquelle une trace terminée reste scellée. */
export const ANNEES_SCELLEE = 5;

/** Date à laquelle une trace scellée pourra de nouveau être modifiée. */
export function reouverture(t: Trace): Date | null {
  if (!t.scelleeLe) return null;
  const d = new Date(t.scelleeLe);
  d.setFullYear(d.getFullYear() + ANNEES_SCELLEE);
  return d;
}

export function estScellee(t: Trace): boolean {
  const r = reouverture(t);
  return !!r && Date.now() < r.getTime();
}

export function dateLongue(d: Date | string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** L'auteur a terminé : la trace est scellée pour cinq ans. */
export function sceller(id: string): void {
  updateLocal(id, (t) => ({ ...t, scelleeLe: new Date().toISOString() }), 'Trace terminée et scellée pour cinq ans');
}

/**
 * Chaque personne émet au plus deux bulles, différentes : sa propre trace, et
 * une mémoire pour une personne décédée.
 */
export function peutCreer(type: Trace['type']): boolean {
  return !local.some((t) => t.type === type);
}

/** Modifier les réponses aux quatre questions (ou l'aperçu d'une mémoire), avant de sceller. */
export function modifierReponses(id: string, questions: Trace['questions'], apercuMemoire?: string): void {
  updateLocal(
    id,
    (t) => ({
      ...t,
      questions: questions ?? t.questions,
      memoire: t.memoire && apercuMemoire !== undefined ? { ...t.memoire, aperçu: apercuMemoire } : t.memoire,
    }),
    'Réponses modifiées',
  );
}

/** Ajoute un fragment ; refusé si la rubrique (ou le sens) a déjà ses 5 fragments. */
export function addElement(id: string, rubrique: RubriqueId, e: Element, medias: Media[] = []): boolean {
  const t = local.find((x) => x.id === id);
  if (!t || placesRestantes(t.rubriques[rubrique] ?? [], rubrique, e.sens) === 0) return false;
  updateLocal(id, (t) => {
    const list = t.rubriques[rubrique] ?? [];
    return { ...t, rubriques: { ...t.rubriques, [rubrique]: [...list, e] }, medias: [...t.medias, ...medias] };
  });
  return true;
}

export function removeElement(id: string, rubrique: RubriqueId, elementId: string): void {
  updateLocal(id, (t) => ({
    ...t,
    rubriques: { ...t.rubriques, [rubrique]: (t.rubriques[rubrique] ?? []).filter((e) => e.id !== elementId) },
  }));
}

/** Texte d'aperçu : les 200 caractères par défaut, ou l'aperçu d'une mémoire. */
export function apercu(t: Trace): string {
  return t.questions ? t.questions[3] : t.memoire?.aperçu ?? '';
}

export const TYPE_LABEL: Record<Trace['type'], string> = {
  personnelle: 'Trace personnelle',
  memoire: 'Mémoire pour une personne décédée',
};
