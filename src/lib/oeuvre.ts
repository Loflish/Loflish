import { appel, EN_LIGNE, ErreurApi } from './api';
import { rng } from './random';
import { COEUR, dansLOeuvre, LONGUEUR } from '../data/oeuvre-regles';

/**
 * L'œuvre commune : chaque personne coud un seul trait, et tous les traits
 * forment ensemble une broderie immense.
 *
 * Où vivent les traits :
 * - publié comme Artifact sur claude.ai, dans le stockage partagé de la page
 *   (capacité `db`) : chaque personne écrit un seul document, `traits/<son id>`,
 *   et tout le monde lit l'ensemble, en direct ;
 * - partout ailleurs (prototype), le trait reste sur cet appareil.
 * Dans les deux cas, un seul trait par personne et par appareil.
 *
 * La toile est immense (16 × 10, centrée sur le cœur de l'œuvre, là où elle a
 * commencé) : on s'y promène comme dans la constellation. Les coordonnées ne
 * dépendent pas de l'écran. Tous les fils ont la même longueur, comme toutes
 * les bulles ont la même taille.
 */

export { arrivee, COEUR, dansLOeuvre, LONGUEUR, MONDE } from '../data/oeuvre-regles';

export interface Trait {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** trait d'exemple (aperçu seulement), montré en pâle */
  demo?: boolean;
  /** le trait de la personne qui regarde */
  moi?: boolean;
}

const CLE = 'nmm:mon-trait';

type Doc = { id: string; data(): Record<string, unknown> | undefined };
type Snap = { docs: Doc[] };
type Db = {
  doc(p: string): { set(d: Record<string, unknown>): Promise<void> };
  collection(p: string): { limit(n: number): { onSnapshot(n: (s: Snap) => void, e?: (err: { code: string }) => void): () => void } };
};
type Usager = { id(): Promise<string | null> };
type ClaudeUse = { use(nom: string): Promise<unknown> };

function lireLocal(): Trait | null {
  try {
    const t = JSON.parse(localStorage.getItem(CLE) || 'null') as Trait | null;
    return t && Number.isFinite(t.x1) ? { ...t, moi: true } : null;
  } catch {
    return null;
  }
}

function valide(d: Record<string, unknown> | undefined): d is { x1: number; y1: number; x2: number; y2: number } {
  if (!d) return false;
  const n = [d.x1, d.y1, d.x2, d.y2];
  if (!n.every((v) => typeof v === 'number' && Number.isFinite(v))) return false;
  return dansLOeuvre(d.x1 as number, d.y1 as number) && dansLOeuvre(d.x2 as number, d.y2 as number);
}

/** Traits d'exemple (aperçu seulement) : des chemins qui se prolongent les uns les autres, comme une broderie qui pousse. */
export function traitsExemple(n = 420): Trait[] {
  const r = rng(20261001);
  const out: Trait[] = [];
  const bouts: [number, number, number][] = [];
  // ils naissent au cœur de l'œuvre et débordent un peu autour
  const zone = { x0: COEUR.x - 0.6, y0: COEUR.y - 0.4, x1: COEUR.x + COEUR.l + 0.6, y1: COEUR.y + COEUR.h + 0.4 };
  for (let i = 0; i < n; i++) {
    let x: number, y: number, a: number;
    const u = r();
    if (bouts.length && u < 0.72) {
      // on reprend au bout d'un trait récent, en changeant un peu de direction : des fils qui cheminent
      const b = bouts[Math.max(0, bouts.length - 1 - Math.floor(r() ** 2 * Math.min(40, bouts.length)))]!;
      [x, y] = [b[0], b[1]];
      a = b[2] + (r() - 0.5) * 1.6;
    } else if (bouts.length && u < 0.88) {
      const b = bouts[Math.floor(r() * bouts.length)]!;
      x = b[0] + (r() - 0.5) * 0.08;
      y = b[1] + (r() - 0.5) * 0.08;
      a = r() * Math.PI * 2;
    } else {
      x = zone.x0 + r() * (zone.x1 - zone.x0);
      y = zone.y0 + r() * (zone.y1 - zone.y0);
      a = r() * Math.PI * 2;
    }
    // près du bord de la zone, le fil fait demi-tour
    if (x + Math.cos(a) * LONGUEUR < zone.x0 || x + Math.cos(a) * LONGUEUR > zone.x1) a = Math.PI - a;
    if (y + Math.sin(a) * LONGUEUR < zone.y0 || y + Math.sin(a) * LONGUEUR > zone.y1) a = -a;
    const x2 = x + Math.cos(a) * LONGUEUR;
    const y2 = y + Math.sin(a) * LONGUEUR;
    out.push({ id: `ex${i}`, x1: x, y1: y, x2, y2, demo: true });
    bouts.push([x2, y2, a]);
  }
  return out;
}

export interface Oeuvre {
  /** « partage » : les traits de tout le monde, en direct ; « local » : cet appareil seulement */
  mode: 'local' | 'partage';
  traits: Trait[];
  mien: Trait | null;
  /** faux quand l'accès à la page ne permet que de regarder */
  peutCoudre: boolean;
  /** en ligne : il faut être connecté pour coudre son trait */
  connexion?: boolean;
}

/**
 * S'abonne à l'œuvre. Rend tout de suite la version locale, puis, si la page
 * tourne dans claude.ai avec le stockage partagé, la version commune.
 */
export function ecouterOeuvre(cb: (o: Oeuvre) => void): { coudre: (t: Omit<Trait, 'id'>) => Promise<boolean>; fin: () => void } {
  let db: Db | null = null;
  let uid: string | null = null;
  let stop: (() => void) | null = null;
  let fini = false;
  let etat: Oeuvre = { mode: 'local', traits: [], mien: lireLocal(), peutCoudre: true };
  const emettre = (p: Partial<Oeuvre>) => {
    etat = { ...etat, ...p };
    if (!fini) cb(etat);
  };
  emettre({ traits: etat.mien ? [etat.mien] : [] });

  // le vrai musée : les traits de tout le monde, relus toutes les 20 secondes
  if (EN_LIGNE) {
    const lire = () =>
      appel<{ traits: Trait[] }>('GET', '/api/traits')
        .then((r) => emettre({ mode: 'partage', traits: r.traits, mien: r.traits.find((t) => t.moi) ?? null }))
        .catch(() => undefined);
    void lire();
    const minuteur = window.setInterval(lire, 20000);
    return {
      coudre: async (t) => {
        try {
          const r = await appel<{ trait: Trait }>('POST', '/api/traits', { x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2 });
          emettre({ mien: r.trait, traits: [...etat.traits, r.trait] });
          return true;
        } catch (e) {
          if (e instanceof ErreurApi && e.statut === 401) emettre({ connexion: true });
          else if (e instanceof ErreurApi && e.statut === 409) void lire();
          return false;
        }
      },
      fin: () => {
        fini = true;
        window.clearInterval(minuteur);
      },
    };
  }

  const claude = (window as unknown as { claude?: ClaudeUse }).claude;
  if (claude?.use) {
    void (async () => {
      const [d, u] = (await Promise.all([claude.use('db'), claude.use('user')])) as [Db | null, Usager | null];
      uid = (await u?.id().catch(() => null)) ?? null;
      if (!d || !uid || fini) return;
      db = d;
      stop = d
        .collection('traits')
        .limit(5000)
        .onSnapshot(
          (s) => {
            const traits: Trait[] = [];
            let mien: Trait | null = null;
            for (const doc of s.docs) {
              const v = doc.data();
              if (!valide(v)) continue;
              const t: Trait = { id: doc.id, x1: v.x1, y1: v.y1, x2: v.x2, y2: v.y2, moi: doc.id === uid };
              traits.push(t);
              if (t.moi) mien = t;
            }
            emettre({ mode: 'partage', traits, mien });
          },
          () => emettre({ mode: 'local', traits: etat.mien ? [etat.mien] : [] }),
        );
    })();
  }

  const coudre = async (t: Omit<Trait, 'id'>): Promise<boolean> => {
    if (etat.mien) return false;
    const corps = { x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2 };
    if (db && uid) {
      try {
        await db.doc(`traits/${uid}`).set({ ...corps, cousuLe: new Date().toISOString() });
      } catch {
        // accès en lecture seule : on ne peut que regarder
        emettre({ peutCoudre: false });
        return false;
      }
    }
    const mien: Trait = { id: uid ?? 'moi', ...corps, moi: true };
    try {
      localStorage.setItem(CLE, JSON.stringify(mien));
    } catch {
      /* stockage indisponible : le trait vit le temps de la visite */
    }
    emettre({ mien, traits: etat.mode === 'partage' ? etat.traits : [mien] });
    return true;
  };

  return {
    coudre,
    fin: () => {
      fini = true;
      stop?.();
    },
  };
}
