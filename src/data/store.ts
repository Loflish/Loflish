import { GRIS_PALETTE } from '../lib/palette';
import { hashString, pick, rng, shuffle } from '../lib/random';
import { MEMOIRES, NOMS, PAYS, POOL, PRENOMS, PSEUDOS, Q1, Q2, Q3, Q4, SENS_POOL } from './pools';
import { SAKINAH } from './sakinah';
import type { Element, RubriqueId, Trace } from './types';

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
    .map((e, i) => ({ ...e, id: `${prefix}${i}`, enAvant: true }));
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

function loadLocal(): Trace[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Trace[]) : [];
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

export function publishLocal(t: Trace): void {
  local = [t, ...local.filter((x) => x.id !== t.id)];
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
  } catch {
    /* stockage indisponible : la trace reste en mémoire pour la session */
  }
}

/** Texte d'aperçu : les 200 caractères par défaut, ou l'aperçu d'une mémoire. */
export function apercu(t: Trace): string {
  return t.questions ? t.questions[3] : t.memoire?.aperçu ?? '';
}

export const TYPE_LABEL: Record<Trace['type'], string> = {
  personnelle: 'Trace personnelle',
  memoire: 'Mémoire pour une personne décédée',
};
