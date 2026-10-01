import { GRIS_PALETTE } from '../lib/palette';
import { hashString, pick, rng, shuffle } from '../lib/random';
import { MEMOIRES, NOMS, PAYS, POOL, PRENOMS, PSEUDOS, Q1, Q2, Q3, Q4, SENS_POOL } from './pools';
import { chargerEditions } from './archives';
import { JEANNOT } from './jeannot';
import { SAKINAH } from './sakinah';
import { useEffect, useSyncExternalStore } from 'react';
import { appel, DEMO, depuisPresence, EN_LIGNE, ErreurApi, normaliserTrace, type Presence } from '../lib/api';
import { creerMedia, preparerEnvoi } from '../lib/fichiers';
import type { MediaChoisi } from '../components/Media';
import { MAX_EN_AVANT, MAX_MEDIAS, placesRestantes, type Element, type Media, type RubriqueId, type Trace } from './types';

/**
 * Registre des traces.
 * - Prototype (sans VITE_API) : traces de démonstration et traces de l'auteur
 *   gardées dans ce navigateur.
 * - En ligne (VITE_API) : le vrai musée, servi par le serveur (dossier server/) ;
 *   voir la section « en ligne » en bas de ce fichier.
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
    if (rr() < 0.7)
      for (const { sens, ...e } of items(rr, SENS_POOL, 's', 4)) (rubriques[sens!] ??= []).push(e);
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
 * Une fois, au premier chargement de cette version : on efface les traces
 * créées pendant les essais du prototype (traces, brouillon, fichiers
 * déposés), pour repartir d'un musée propre sur cet appareil.
 */
const PURGE = 'nmm:purge-essais-1';
function purgerEssais(): void {
  try {
    if (localStorage.getItem(PURGE)) return;
    localStorage.removeItem(LOCAL_KEY);
    localStorage.removeItem('nmm:brouillon');
    indexedDB?.deleteDatabase('nmm-fichiers');
    localStorage.setItem(PURGE, '1');
  } catch {
    /* stockage indisponible : rien à effacer */
  }
}
purgerEssais();

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
  // l'ancienne rubrique « Les 5 sens » : chaque sens devient sa propre rubrique
  let medias = t.medias;
  if (r.sens) {
    for (const { sens, ...e } of r.sens) {
      const cible = sens ?? 'voir';
      r[cible] = [...(r[cible] ?? []), e];
      medias = medias.map((m) => (m.origine === ('sens' as RubriqueId) && e.medias?.includes(m.id) ? { ...m, origine: cible } : m));
    }
    delete r.sens;
  }
  const anciens = (r.objets ?? []) as Ancien[];
  if (anciens.some((e) => e.nature)) {
    r.objets = anciens.filter((e) => !e.nature || e.nature === 'objet');
    r.creations = [...(r.creations ?? []), ...anciens.filter((e) => e.nature === 'création')];
    r.accomplissements = [...(r.accomplissements ?? []), ...anciens.filter((e) => e.nature === 'accomplissement')];
  }
  for (const k of Object.keys(r)) r[k] = r[k].map(({ nature: _n, ...e }) => ({ ...e, scelleLe: e.scelleLe ?? maintenant }));
  return { ...t, rubriques: r, medias, scelleeLe: t.scelleeLe ?? maintenant };
}

function loadLocal(): Trace[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Trace[]).map(migrer) : [];
  } catch {
    return [];
  }
}

const generated = DEMO ? generate(420) : [];
let local = EN_LIGNE ? [] : loadLocal();
/** en ligne : les présences publiées (légères) et les profils déjà chargés en entier */
let distant: Trace[] = [];
const complets = new Map<string, Trace>();

export function allTraces(): Trace[] {
  if (!EN_LIGNE) return [SAKINAH, JEANNOT, ...local, ...generated];
  const exemples = DEMO ? [SAKINAH, JEANNOT] : [];
  return [...exemples, ...distant.map((t) => complets.get(t.id) ?? t), ...generated];
}

export function getTrace(id: string): Trace | undefined {
  return complets.get(id) ?? local.find((t) => t.id === id) ?? allTraces().find((t) => t.id === id);
}

// ——— traces de l'utilisateur (prototype : conservées dans ce navigateur)

const listeners = new Set<() => void>();
let snapshot = local.slice();

let version = 0;
function notifier(): void {
  snapshot = local.slice();
  version++;
  listeners.forEach((fn) => fn());
}

function save(): void {
  if (!EN_LIGNE)
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
    } catch {
      /* stockage plein ou indisponible : la trace reste en mémoire pour la session */
    }
  notifier();
}

const abonner = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

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
  return useSyncExternalStore(abonner, () => snapshot);
}

export function isMine(id: string): boolean {
  return local.some((t) => t.id === id);
}

function touch(t: Trace): Trace {
  return { ...t, majLe: dateLongue(new Date()) };
}

export function updateLocal(id: string, fn: (t: Trace) => Trace): void {
  local = local.map((t) => (t.id === id ? touch(fn(t)) : t));
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

/** Une date en toutes lettres, à la française : « 1er octobre 2031 », « 2 novembre 2025 ». */
export function dateLongue(d: Date | string): string {
  return premier(new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
}
export const premier = (date: string) => date.replace(/^1 /, '1er ');

/**
 * Chaque personne émet au plus deux bulles, différentes : sa propre trace, et
 * une mémoire pour une personne décédée.
 */
export function peutCreer(type: Trace['type']): boolean {
  return !local.some((t) => t.type === type);
}

/** Modifier les réponses aux quatre questions (ou l'aperçu d'une mémoire), une fois les cinq ans passés. */
export function modifierReponses(id: string, questions: Trace['questions'], apercuMemoire?: string): void {
  if (EN_LIGNE) return void action(id, () => appel('PUT', `/api/traces/${id}/reponses`, { questions, apercu: apercuMemoire }));
  const t = local.find((x) => x.id === id);
  if (!t || estScellee(t)) return;
  updateLocal(id, (t) => ({
    ...t,
    questions: questions ?? t.questions,
    memoire: t.memoire && apercuMemoire !== undefined ? { ...t.memoire, aperçu: apercuMemoire } : t.memoire,
    scelleeLe: new Date().toISOString(),
  }));
}

/**
 * Dépose un fragment (avec au plus un média) : il est scellé aussitôt, et se
 * range à la fin de sa rubrique. Refusé si la rubrique a déjà tous ses fragments.
 */
export function addElement(id: string, rubrique: RubriqueId, e: Element, medias: Media[] = []): boolean {
  const t = local.find((x) => x.id === id);
  if (!t || placesRestantes(t.rubriques[rubrique] ?? [], rubrique) === 0) return false;
  const maintenant = new Date().toISOString();
  updateLocal(id, (t) => {
    const list = t.rubriques[rubrique] ?? [];
    const { enAvant: _ancien, ...propre } = e;
    const el: Element = { ...propre, scelleLe: maintenant, medias: e.medias?.slice(0, 1) };
    const ms = medias.slice(0, 1).map((m) => ({ ...m, origine: rubrique, scelleLe: maintenant }));
    return { ...t, rubriques: { ...t.rubriques, [rubrique]: [...list, el] }, medias: [...t.medias, ...ms] };
  });
  return true;
}

/** Retirer un fragment : seulement une fois ses cinq ans de scellement passés. */
export function removeElement(id: string, rubrique: RubriqueId, elementId: string): void {
  if (EN_LIGNE) return void action(id, () => appel('DELETE', `/api/fragments/${elementId}`));
  updateLocal(id, (t) => ({
    ...t,
    rubriques: { ...t.rubriques, [rubrique]: (t.rubriques[rubrique] ?? []).filter((e) => e.id !== elementId || estScelle(e)) },
  }));
}

/** Monte ou descend un élément d'un cran parmi ceux qui partagent sa liste (même rubrique, ou médias libres). */
function deplacer<T extends { id: string }>(list: T[], idEl: string, sens: -1 | 1, meme: (x: T) => boolean): T[] {
  const i = list.findIndex((x) => x.id === idEl);
  if (i < 0) return list;
  let j = i + sens;
  while (j >= 0 && j < list.length && !meme(list[j]!)) j += sens;
  if (j < 0 || j >= list.length) return list;
  const out = list.slice();
  [out[i], out[j]] = [out[j]!, out[i]!];
  return out;
}

/** Ranger ses fragments : monter (-1) ou descendre (+1) d'un cran. Les trois premiers se montrent sur le profil. */
export function deplacerFragment(id: string, rubrique: RubriqueId, elementId: string, sens: -1 | 1): void {
  if (EN_LIGNE) return void action(id, () => appel('POST', `/api/fragments/${elementId}/deplacer`, { sens }));
  updateLocal(id, (t) => {
    const list = t.rubriques[rubrique] ?? [];
    return { ...t, rubriques: { ...t.rubriques, [rubrique]: deplacer(list, elementId, sens, () => true) } };
  });
}

/** Modifier un fragment : seulement une fois ses cinq ans de scellement passés ; il est scellé de nouveau. */
export async function modifierFragment(id: string, rubrique: RubriqueId, elementId: string, champs: Omit<Element, 'id' | 'medias' | 'scelleLe' | 'enAvant'>): Promise<void> {
  if (EN_LIGNE) {
    const r = await appel<{ trace: Trace }>('PUT', `/api/fragments/${elementId}`, champs);
    retenir(r.trace);
    return;
  }
  updateLocal(id, (t) => ({
    ...t,
    rubriques: {
      ...t.rubriques,
      [rubrique]: (t.rubriques[rubrique] ?? []).map((e) => (e.id === elementId && !estScelle(e) ? { ...e, ...champs, scelleLe: new Date().toISOString() } : e)),
    },
  }));
}

/** Les médias & documents de la trace elle-même (les médias joints aux fragments n'en font pas partie). */
export function mediasLibres(t: Trace): Media[] {
  return t.medias.filter((m) => !m.origine);
}

/** Dépose un média ou document (20 au plus), scellé aussitôt, rangé à la fin. */
export function addMedia(id: string, m: Media): boolean {
  const t = local.find((x) => x.id === id);
  if (!t || mediasLibres(t).length >= MAX_MEDIAS) return false;
  const { enAvant: _ancien, ...propre } = m;
  updateLocal(id, (t) => ({ ...t, medias: [...t.medias, { ...propre, origine: undefined, scelleLe: new Date().toISOString() }] }));
  return true;
}

export function deplacerMedia(id: string, mediaId: string, sens: -1 | 1): void {
  if (EN_LIGNE) return void action(id, () => appel('POST', `/api/medias/${mediaId}/deplacer`, { sens }));
  updateLocal(id, (t) => ({ ...t, medias: deplacer(t.medias, mediaId, sens, (m) => !m.origine) }));
}

/** Les trois premiers (dans l'ordre choisi par l'auteur) se montrent sur la vue d'ensemble ; le reste s'ouvre d'un clic. */
export function premiersDabord<T>(list: T[]): { avant: T[]; reste: T[] } {
  return { avant: list.slice(0, MAX_EN_AVANT), reste: list.slice(MAX_EN_AVANT) };
}

/** Texte d'aperçu : les 200 caractères, ou, pour une mémoire, ce que l'on dit de la personne (500 caractères). */
export function apercu(t: Trace): string {
  return t.questions ? t.questions[3] : t.memoire?.aperçu ?? '';
}

export const TYPE_LABEL: Record<Trace['type'], string> = {
  personnelle: 'Trace personnelle',
  memoire: 'Mémoire pour une personne décédée',
};

// ————————————————————————————————————————————————————————————— en ligne
// Le vrai musée : les mêmes fonctions, qui passent par le serveur. Le serveur
// applique les règles (scellement, limites…) ; le site se met à jour avec sa réponse.

export interface CompteSession {
  id: string;
  email: string;
  role: 'membre' | 'moderation' | 'admin';
  majeur: boolean;
}
let compte: CompteSession | null = null;
let pret = !EN_LIGNE;
/** le dernier refus du serveur, montré discrètement à l'auteur */
let derniereErreur = '';

export function useCompte(): { compte: CompteSession | null; pret: boolean } {
  useSyncExternalStore(abonner, () => version);
  return { compte, pret };
}
export function useDerniereErreur(): string {
  useSyncExternalStore(abonner, () => version);
  return derniereErreur;
}

/** Au démarrage : les présences du musée, la personne connectée et ses traces. */
export async function chargerMusee(): Promise<void> {
  if (!EN_LIGNE) return;
  const [p, moi] = await Promise.all([
    appel<{ presences: Presence[] }>('GET', '/api/presences').catch(() => ({ presences: [] as Presence[] })),
    appel<{ compte: CompteSession | null }>('GET', '/api/moi').catch(() => ({ compte: null })),
  ]);
  distant = p.presences.map(depuisPresence);
  compte = moi.compte;
  await chargerEditions().catch(() => undefined);
  if (compte) await rafraichirMesTraces().catch(() => undefined);
  pret = true;
  notifier();
}

async function rafraichirMesTraces(): Promise<void> {
  const r = await appel<{ traces: Trace[] }>('GET', '/api/moi/traces');
  local = r.traces.map(normaliserTrace);
  for (const t of local) complets.set(t.id, t);
}

function retenir(t: Trace): Trace {
  const n = normaliserTrace(t);
  complets.set(n.id, n);
  local = local.map((x) => (x.id === n.id ? n : x));
  notifier();
  return n;
}

async function recharger(id: string): Promise<Trace | undefined> {
  const r = await appel<{ trace: Trace }>('GET', `/api/traces/${id}`);
  return retenir(r.trace);
}

/** Une action de l'auteur : envoyée au serveur, puis le profil est relu. */
async function action(id: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    derniereErreur = '';
    await fn();
    await recharger(id);
  } catch (e) {
    derniereErreur = e instanceof Error ? e.message : 'Une erreur est survenue.';
    notifier();
  }
}

const introuvables = new Set<string>();
const enCours = new Set<string>();

/** Un profil complet : chargé à la demande en ligne, tout de suite dans le prototype. */
export function useTrace(id: string): { trace?: Trace; chargement: boolean; introuvable: boolean } {
  useSyncExternalStore(abonner, () => version);
  const t = getTrace(id);
  const aCharger = EN_LIGNE && (!t || !!t.leger) && !introuvables.has(id);
  useEffect(() => {
    if (!aCharger || enCours.has(id)) return;
    enCours.add(id);
    recharger(id)
      .catch((e) => {
        if (e instanceof ErreurApi && e.statut === 404) introuvables.add(id);
        notifier();
      })
      .finally(() => enCours.delete(id));
  }, [id, aCharger]);
  return { trace: t && !t.leger ? t : undefined, chargement: aCharger, introuvable: !t && !aCharger };
}

/** Recevoir un code à six chiffres par e-mail (en développement, le serveur le renvoie aussi). */
export async function demanderCode(email: string): Promise<{ code?: string }> {
  return appel('POST', '/api/auth/code', { email });
}

/** Entrer avec le code reçu : la session s'ouvre sur cet appareil, les traces de la personne reviennent. */
export async function entrerAvecCode(email: string, code: string): Promise<CompteSession> {
  const r = await appel<{ compte: CompteSession }>('POST', '/api/auth/verifier', { email, code });
  compte = r.compte;
  await rafraichirMesTraces().catch(() => undefined);
  notifier();
  return r.compte;
}

// ——— le compte : son adresse, et les choix de chacun sur ses données

const CLE_EMAIL = 'nmm:email';

/** L'adresse e-mail : celle du compte en ligne, celle donnée à la création dans le prototype. */
export function emailDuCompte(): string {
  if (EN_LIGNE) return compte?.email ?? '';
  try {
    return localStorage.getItem(CLE_EMAIL) ?? '';
  } catch {
    return '';
  }
}

/** Aperçu autonome : retenir l'adresse donnée à la création (rien n'est envoyé). */
export function retenirEmailLocal(email: string): void {
  try {
    if (email.trim()) localStorage.setItem(CLE_EMAIL, email.trim().toLowerCase());
  } catch {
    /* navigation privée : tant pis */
  }
  notifier();
}

/**
 * Changer d'adresse. En ligne, un code part vers la nouvelle adresse : rien ne change tant
 * qu'il n'est pas donné (confirmerEmail). Dans l'aperçu autonome, l'adresse change tout de suite.
 */
export async function changerEmail(email: string): Promise<{ confirmation: boolean; code?: string }> {
  if (!EN_LIGNE) {
    retenirEmailLocal(email);
    return { confirmation: false };
  }
  const r = await appel<{ code?: string }>('POST', '/api/moi/email', { email });
  return { confirmation: true, code: r.code };
}

export async function confirmerEmail(email: string, code: string): Promise<void> {
  const r = await appel<{ compte: CompteSession }>('POST', '/api/moi/email/confirmer', { email, code });
  compte = r.compte;
  notifier();
}

/** Modifier ses choix sur ses données (archives, musée, réseaux…) : ce ne sont pas des contenus, ils ne sont pas scellés. */
export async function modifierParametres(id: string, p: Partial<NonNullable<Trace['parametres']>>): Promise<void> {
  if (!EN_LIGNE) {
    updateLocal(id, (t) => ({ ...t, parametres: { ...(t.parametres as NonNullable<Trace['parametres']>), ...p } }));
    return;
  }
  await appel('PUT', `/api/traces/${id}/parametres`, p);
  await rafraichirMesTraces();
  notifier();
}

export async function seDeconnecter(): Promise<void> {
  await appel('POST', '/api/auth/deconnexion').catch(() => undefined);
  compte = null;
  local = [];
  notifier();
}

export async function effacerMonCompte(): Promise<void> {
  await appel('DELETE', '/api/moi', { confirmation: 'EFFACER' });
  const moi = new Set(local.map((t) => t.id));
  distant = distant.filter((t) => !moi.has(t.id));
  compte = null;
  local = [];
  notifier();
}

/** Publier (et sceller) sa trace. En ligne, il faut être connecté : sinon, `connexion` est vrai. */
export async function publier(t: Trace, majeur: boolean): Promise<{ trace?: Trace; connexion?: boolean }> {
  if (!EN_LIGNE) {
    publishLocal(t);
    return { trace: t };
  }
  if (!compte) return { connexion: true };
  if (majeur && !compte.majeur) {
    await appel('POST', '/api/moi/majeur', { majeur: true });
    compte = { ...compte, majeur: true };
  }
  const corps =
    t.type === 'personnelle'
      ? { type: t.type, nom: t.nom, pseudo: t.pseudo, couleur: t.couleur, matiere: t.matiere, pays: t.pays, questions: t.questions, q2Destinataire: t.q2Destinataire, parametres: t.parametres }
      : { type: t.type, nom: t.nom, couleur: t.couleur, matiere: t.matiere, pays: t.pays, memoire: t.memoire, parametres: t.parametres };
  const r = await appel<{ trace: Trace }>('POST', '/api/traces', corps);
  const n = normaliserTrace(r.trace);
  local = [n, ...local];
  complets.set(n.id, n);
  distant = [...distant, n];
  notifier();
  return { trace: n };
}

/** Déposer un fragment (avec au plus un média : fichier ou lien). Lève une erreur lisible si c'est refusé. */
export async function deposerFragment(traceId: string, rubrique: RubriqueId, e: Omit<Element, 'id'>, choix: MediaChoisi, mediaTitre = ''): Promise<void> {
  if (!EN_LIGNE) {
    const id = `${rubrique}-${Date.now().toString(36)}`;
    const medias: Media[] = choix ? [await creerMedia(choix, `m-${id}`, mediaTitre)] : [];
    if (!addElement(traceId, rubrique, { ...e, id, medias: medias.map((m) => m.id) }, medias)) throw new Error('Cette rubrique est complète.');
    return;
  }
  const donnees = { rubrique, ...e, mediaTitre: mediaTitre || undefined, mediaLien: choix && 'url' in choix ? { url: choix.url } : undefined };
  const r =
    choix && 'file' in choix
      ? await appel<{ trace: Trace }>('POST', `/api/traces/${traceId}/fragments`, formulaire(donnees, (await preparerEnvoi(choix.file)).fichier))
      : await appel<{ trace: Trace }>('POST', `/api/traces/${traceId}/fragments`, donnees);
  retenir(r.trace);
}

/** Déposer un média ou un document dans « Médias & documents ». */
export async function deposerMedia(traceId: string, choix: NonNullable<MediaChoisi>, titre: string, legende: string): Promise<void> {
  if (!EN_LIGNE) {
    const m = await creerMedia(choix, `m-${Date.now().toString(36)}`, titre);
    if (!addMedia(traceId, { ...m, legende: legende || undefined })) throw new Error(`Tu as déjà déposé ${MAX_MEDIAS} photos, vidéos, sons ou documents.`);
    return;
  }
  const prepare = 'file' in choix ? await preparerEnvoi(choix.file) : null;
  const donnees = { titre: titre || undefined, legende: legende || undefined, duree: prepare?.duree, lien: 'url' in choix ? choix.url : undefined };
  const r = await appel<{ trace: Trace }>('POST', `/api/traces/${traceId}/medias`, prepare ? formulaire(donnees, prepare.fichier) : donnees);
  retenir(r.trace);
}

function formulaire(donnees: unknown, fichier: File): FormData {
  const f = new FormData();
  f.append('donnees', JSON.stringify(donnees));
  f.append('fichier', fichier, fichier.name);
  return f;
}
