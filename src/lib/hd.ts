/**
 * Matières HD — générées avec Higgsfield (Nano Banana, 4K) puis préparées
 * par design/hd/preparer.py : fonds peints, lin, taches d'aquarelle,
 * et papiers faits main.
 *
 * Interrupteur unique : HD = false rend exactement le rendu précédent
 * (fond et bulles entièrement procéduraux). Si un fichier manque, le site
 * revient aussi au rendu procédural.
 */
export const HD = true;

const base = `${import.meta.env.BASE_URL}hd/`;

/** Nombre de taches d'aquarelle préparées (public/hd/taches) : le catalogue complet des matières. */
export const NB_MATIERES = 100;
/**
 * La matière 0 : l'aquarelle cousue, peinte par le moteur lui-même (voiles
 * d'aquarelle, papier, fil au point avant sur le bord). La toute première
 * bulle du musée, gardée telle quelle et proposée en tête du catalogue.
 */
export const MATIERE_COUSUE = 0;
const NB_TACHES = NB_MATIERES;

/**
 * Variantes de Palerme à comparer avec les fonds actuels, le temps que Tom choisisse
 * (fonds 5K générés le 21 octobre 2026, Seedream 4.5) :
 * - `?fond=A` ou `?fond=D` : la constellation sur une aquarelle où affleurent des frises d'étoiles dorées ;
 * - `?fond=m2` : le mélange choisi le 21 octobre (le n° 5, brodé, aux voiles de vert sauge des Nabis, repeint plus
 *   vif « imbibé dans une toile brute », posé à 62 % sur la peinture actuelle) ; `?fond=m2b` : sa version plus pâle ;
 * - `?pages=marbre` : les pages sur un marbre ivoire veiné de rose et de vert antique.
 * Sans paramètre, le site montre la version choisie par Tom (27 et 30 octobre) : le fond feutré, l'eau et l'entrée.
 * `?fond=ancien&eau=0&entree=0` rouvre la version d'avant, pour comparer.
 */
const parametres = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const fondDemande = parametres?.get('fond') ?? 'feutre';
const ESSAIS_FOND: Record<string, string> = {
  A: 'palerme/fond-A-mosaique',
  D: 'palerme/fond-D-mosaique',
  m2: 'essais/fond-m2',
  // la version d'avant, plus pâle (palette B des Nabis), gardée pour comparer
  m2b: 'essais/fond-m2b',
  // la même peinture refaite en feutre de laine (photos de feutres envoyées par Tom le 26 octobre)
  feutre: 'essais/fond-feutre',
};
/** le fond de la constellation à l'essai (chemin sans le format), ou null pour le fond actuel */
export const FOND_ESSAI: string | null = ESSAIS_FOND[fondDemande] ?? null;
/** le fond feutré porte sa propre matière (la laine) : le lin fin ne s'y pose pas */
export const FOND_FEUTRE = fondDemande === 'feutre';
const PAGES_MARBRE = parametres?.get('pages') === 'marbre';
/**
 * La constellation sur une toile plus brute (Tom, 21 octobre au soir : « un tissu encore plus brut »,
 * dans l'esprit des tissus de Ruth Rae) : `?toile=1` (mousseline de coton écrue) ou `?toile=2` (mousseline voilée
 * de gaze déchirée, plus brute).
 * Le relief de la trame seul, sans couleur, posé en lumière douce sur la peinture et les bulles.
 */
/**
 * La peinture vivante tournée par un modèle vidéo (Higgsfield), à comparer avec l'eau du code :
 * `?video=essai` (Seedance 2.5, 720p) ou `?video=<nom>` pour public/hd/essais/fond-video-<nom>.mp4.
 */
const videoDemandee = parametres?.get('video') ?? '';
export const FOND_VIDEO: string | null = /^[a-z0-9-]{1,40}$/.test(videoDemandee) ? `${base}essais/fond-video-${videoDemandee}.mp4` : null;
const toileDemandee = parametres?.get('toile');
export const TOILE_BRUTE: string | null = ['1', '2', '3', '4'].includes(toileDemandee ?? '') ? `${base}essais/toile-${toileDemandee}.webp` : null;
/**
 * `?toile=3` : une chemise de coton à fines rayures, froissée de plis souples (Tom, 22 octobre, d'après une chemise
 * brodée de Ruth Rae ; refusée le 26 octobre). `?toile=4` : du feutre de laine mérinos fait main, duveteux, d'après les
 * photos de feutres envoyées par Tom le 26 octobre. Ces matières ne se répètent pas : elles couvrent tout l'écran
 * d'un seul tenant.
 */
export const TOILE_PLEINE = toileDemandee === '3' || toileDemandee === '4';

/**
 * L'entrée du musée, avec le fond qui coule (components/Entree.tsx, engine/eau.ts) :
 * - sans paramètre : la règle choisie par Tom (22 octobre) — le hook complet (moins de 20 s : les gouttes peignent
 *   le fond, quelques phrases, les bulles, une bulle qui s'ouvre) aux deux premières visites, puis les gouttes seules ;
 * - `?entree=toujours` : le hook à chaque chargement ; `?entree=gouttes` : les gouttes seules à chaque chargement ;
 * - `?entree=0` : aucune entrée.
 */
const entreeDemandee = parametres?.get('entree') ?? '1';
export const ENTREE: 'normale' | 'hook' | 'gouttes' | null =
  entreeDemandee === '1' ? 'normale' : entreeDemandee === 'toujours' ? 'hook' : entreeDemandee === 'gouttes' ? 'gouttes' : null;

/** Les fonds, en format ordinateur (large) et téléphone (haut). */
export type Fond = 'explorer' | 'tissu';
export const FONDS: Record<Fond, { large: string; haut: string }> = {
  explorer: FOND_ESSAI
    ? { large: `${base}${FOND_ESSAI}-16x9.webp`, haut: `${base}${FOND_ESSAI}-9x16.webp` }
    : { large: `${base}fond-16x9.webp`, haut: `${base}fond-9x16.webp` },
  /** Toutes les pages sauf la constellation : un tissu de coton ivoire, plis doux, fibres visibles. */
  tissu: PAGES_MARBRE
    ? { large: `${base}palerme/page-marbre-16x9.webp`, haut: `${base}palerme/page-marbre-9x16.webp` }
    : { large: `${base}fond-tissu-16x9.webp`, haut: `${base}fond-tissu-9x16.webp` },
};

/** Téléphone ou connexion économe : on garde les images fixes, plus légères. */
export const LEGER =
  typeof window !== 'undefined' &&
  (window.matchMedia('(max-width: 700px)').matches ||
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true);

// Sur téléphone, 30 taches réparties entre toutes les techniques suffisent (site plus léger).
const petitEcran = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches;
const indices = petitEcran
  ? Array.from({ length: 30 }, (_, i) => Math.floor((i * NB_TACHES) / 30) + 1)
  : Array.from({ length: NB_TACHES }, (_, i) => i + 1);

function fondVideo(): { src: string; type: string }[] {
  const grand = typeof window !== 'undefined' && window.screen.width * window.devicePixelRatio > 2200;
  const f = `${base}fond-explorer-${grand ? 2560 : 1920}`;
  return [
    { src: `${f}.av1.mp4`, type: 'video/mp4; codecs="av01.0.08M.08"' },
    { src: `${f}.webm`, type: 'video/webm; codecs="vp9"' },
    { src: `${f}.mp4`, type: 'video/mp4' },
  ];
}

export const HD_FILES = {
  /** Diffusion d'encre filmée en 4K, recolorée dans la couleur de la bulle (transition vers une mémoire). */
  encre: [`${base}encre.webm`, `${base}encre.mp4`],
  /**
   * Le fond d'Explorer qui vit : boucle 4K (Kling) partant et revenant au fond peint,
   * livrée en 2560 ou 1920 px selon l'écran, en AV1, puis VP9, puis H.264.
   */
  fondVideo: fondVideo(),
  lin: `${base}lin.webp`,
};

/** Lots 02 et 03 validés : six remplacements conservés en PNG sans perte. */
const matieresSansPerte = new Set([15, 50, 70, 81, 85, 95]);

/**
 * Les palettes de matières (26 octobre, design/bulles-vie.md) : A = les 100 taches d'aquarelle (1 à 100) ;
 * B = 100 éléments de la vie à l'aquarelle et à l'encre (101 à 200) ; C = 52 bulles de la direction artistique
 * (201 à 252 ; 68 prévues de plus au renouvellement des crédits). Tom compose ses 100 bulles en piochant dans les trois ;
 * la constellation tire toujours dans A.
 */
export const PALETTES = {
  A: { debut: 1, fin: NB_MATIERES, dossier: 'taches', prefixe: 'tache' },
  B: { debut: 101, fin: 200, dossier: 'taches-vie', prefixe: 'vie' },
  C: { debut: 201, fin: 252, dossier: 'taches-da', prefixe: 'da' },
} as const;
const NB_TOUTES = PALETTES.C.fin;
/** le numéro affiché dans sa palette (B 14 pour la matière 114) */
export function numeroDansPalette(n: number): { palette: 'A' | 'B' | 'C'; numero: number } {
  if (n >= PALETTES.C.debut) return { palette: 'C', numero: n - PALETTES.C.debut + 1 };
  if (n >= PALETTES.B.debut) return { palette: 'B', numero: n - PALETTES.B.debut + 1 };
  return { palette: 'A', numero: n };
}
const tacheUrl = (n: number) => {
  const { palette, numero } = numeroDansPalette(n);
  const p = PALETTES[palette];
  const ext = palette === 'A' && matieresSansPerte.has(n) ? 'png' : 'webp';
  return `${base}${p.dossier}/${p.prefixe}-${String(numero).padStart(2, '0')}.${ext}`;
};
/** une matière des palettes B et C n'existe que si son image est déjà faite */
export function matiereDisponible(n: number): boolean {
  return taches.has(n);
}

/**
 * Surfaces HD des pages : les papiers faits main (calques translucides de
 * fibres) sont exposés en variables CSS, et la classe `hd` les active.
 */
export function installSurfaces(): void {
  if (!HD || typeof document === 'undefined') return;
  const r = document.documentElement;
  r.classList.add('hd');
  // adresse absolue : une url() relative dans une variable se résoudrait depuis la feuille de style
  const abs = (f: string) => `url("${new URL(`${base}${f}`, location.href).href}")`;
  r.style.setProperty('--papier-chiffon', abs('papier-chiffon.webp'));
  r.style.setProperty('--papier-washi', abs('papier-washi.webp'));
}

const taches = new Map<number, HTMLImageElement | HTMLCanvasElement>();
const enCours = new Map<number, Promise<void>>();
let loading: Promise<void> | null = null;

function charger(n: number): Promise<void> {
  if (!HD || n < 1 || n > NB_TOUTES) return Promise.resolve();
  let p = enCours.get(n);
  if (!p) {
    p = new Promise<void>((res) => {
      const img = new Image();
      img.onload = () => {
        if (matieresSansPerte.has(n)) {
          // Même source canvas que la fiche approuvée : conserver le filtrage du pigment.
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            taches.set(n, canvas);
          } else {
            taches.set(n, img);
          }
        } else {
          taches.set(n, img);
        }
        res();
      };
      img.onerror = () => res();
      img.src = tacheUrl(n);
    });
    enCours.set(n, p);
  }
  return p;
}

/** Charge une seule fois les taches d'aquarelle de base (toutes sur ordinateur, 30 sur téléphone). */
export function loadTaches(): Promise<void> {
  if (!HD) return Promise.resolve();
  loading ??= Promise.all(indices.map(charger)).then(() => undefined);
  return loading;
}

/** Charge des matières précises (celles que des personnes ont choisies). */
export function loadMatieres(list: (number | undefined)[]): Promise<void> {
  return Promise.all([loadTaches(), ...list.filter((n): n is number => !!n && n > 0).map(charger)]).then(() => undefined);
}

/** Le catalogue complet, pour choisir sa matière. */
export function loadCatalogue(): Promise<void> {
  return loadMatieres(Array.from({ length: NB_TACHES }, (_, i) => i + 1));
}

/**
 * Les palettes B et C (l'atelier seulement) : seules les matières déjà faites sont chargées, d'après la liste que
 * tient design/hd/taches_vie.cjs (index.json de chaque dossier).
 */
export function loadPalettes(): Promise<void> {
  const une = (p: (typeof PALETTES)['B' | 'C']) =>
    fetch(`${base}${p.dossier}/index.json`)
      .then((r) => (r.ok ? (r.json() as Promise<number[]>) : []))
      .catch(() => [] as number[])
      .then((liste) => Promise.all(liste.map((k) => charger(p.debut + k - 1))));
  return Promise.all([une(PALETTES.B), une(PALETTES.C)]).then(() => undefined);
}

/** Une matière fabriquée à la volée (l'atelier du mélange), au numéro choisi. */
export function poserMatiere(n: number, image: HTMLImageElement | HTMLCanvasElement): void {
  taches.set(n, image);
}

/** Sans choix, la matière d'une personne est tirée de son identifiant : au hasard, mais fixe. */
export function matiereFor(seed: number): number {
  // l'aquarelle cousue (0) fait partie du tirage, comme chacune des taches
  return seed % (NB_TACHES + 1);
}

/**
 * La tache d'aquarelle d'une matière. Si elle n'est pas (encore) chargée —
 * téléphone, connexion lente —, la plus proche dans le catalogue la remplace.
 */
export function tacheFor(n: number): HTMLImageElement | HTMLCanvasElement | null {
  if (!taches.size) return null;
  const hit = taches.get(n);
  if (hit) return hit;
  // une matière des palettes B et C n'est jamais remplacée par une voisine : elle est faite, ou absente
  if (n > NB_TACHES) return null;
  for (let d = 1; d < NB_TACHES; d++) {
    const a = taches.get(n - d) ?? taches.get(n + d);
    if (a) return a;
  }
  return null;
}
