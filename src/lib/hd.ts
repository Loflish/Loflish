/**
 * Matières HD — générées avec Higgsfield (Nano Banana, 4K) puis préparées
 * par design/hd/preparer.py : fonds peints, lin, taches d'aquarelle,
 * et papiers faits main.
 *
 * Interrupteur unique : HD = false rend exactement le rendu précédent
 * (fond et bulles entièrement procéduraux). Si un fichier manque, le site
 * revient aussi au rendu procédural.
 */
import selection from '../../design/selection-bulles.json';

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
/** à partir de ce numéro, la matière est une encre (design/hd/taches_gothique.py) : son gris vaut pleinement, et elle garde son sens */
export const MATIERE_ENCRE = 5000;
/** numéros des matières des ateliers (planches 2 et 3), loin du catalogue */
/** taille du catalogue M (design/hd/catalogue.py écrit public/hd/taches-catalogue/index.json ; ce nombre suit son dernier numéro) */
export const NB_CATALOGUE = 183;
export const MELANGE = 3000;
export const CLAUDE = 4000;
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
  // la même peinture refaite en feutre de laine (photos de feutres envoyées par Tom le 26 octobre) ; depuis le 5 novembre,
  // ses poils clairs sont retenus dans l'image même (traits blancs que le courant étirait) ; ?fond=feutre-poils rend l'original
  feutre: 'essais/fond-feutre-lisse',
  'feutre-poils': 'essais/fond-feutre',
};
/** le fond de la constellation à l'essai (chemin sans le format), ou null pour le fond actuel */
export const FOND_ESSAI: string | null = ESSAIS_FOND[fondDemande] ?? null;
/** le fond feutré porte sa propre matière (la laine) : le lin fin ne s'y pose pas */
export const FOND_FEUTRE = fondDemande === 'feutre' || fondDemande === 'feutre-poils';
const PAGES_MARBRE = parametres?.get('pages') === 'marbre';
/**
 * Le fond des pages depuis le 5 novembre : le coton ivoire « aura-37 » fait dans Google Flow (design/fond-tissu-aura-37.jpg),
 * choisi par Tom après six séries (aura-31, plus coloré, reste derrière ?tissu=aura-31). `?tissu=coton` rend le coton ivoire d'avant ; `?tissu=<nom>` un essai de public/hd/essais.
 */
const TISSU_ESSAI = parametres?.get('tissu');
/**
 * Les pages gardent la mousseline nue du linge écrit (Tom, 11 novembre, devant Compte, Juridique et Projet :
 * « j'adore, conserve »). Le tissu « aura-37 » du 5 novembre reste un essai derrière `?tissu=aura-37`
 * (ou `?tissu=coton`, `?tissu=<nom>`) : la toile écrue s'allège alors pour le laisser voir (classe `tissu-visible`).
 */
export const FOND_DES_PAGES = !!TISSU_ESSAI && TISSU_ESSAI !== 'aucun';
if (FOND_DES_PAGES && typeof document !== 'undefined') document.documentElement.classList.add('tissu-visible');
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
export const FONDS: Record<Fond, { large: string; haut: string; largeHD?: string }> = {
  explorer: FOND_ESSAI
    ? {
        large: `${base}${FOND_ESSAI}-16x9.webp`,
        haut: `${base}${FOND_ESSAI}-9x16.webp`,
        // le fond feutré existe aussi en 5 120 px (chantier 1) : chargé après coup sur grand écran, par l'eau
        largeHD: FOND_FEUTRE ? `${base}${FOND_ESSAI}-16x9-5120.webp` : undefined,
      }
    : { large: `${base}fond-16x9.webp`, haut: `${base}fond-9x16.webp` },
  /** Toutes les pages sauf la constellation : un tissu de coton ivoire, plis doux, fibres visibles. */
  tissu:
    TISSU_ESSAI === 'coton'
      ? { large: `${base}fond-tissu-coton-16x9.webp`, haut: `${base}fond-tissu-coton-9x16.webp` }
      : TISSU_ESSAI && TISSU_ESSAI !== 'aura-37' && TISSU_ESSAI !== 'aucun'
        ? { large: `${base}essais/tissu-${TISSU_ESSAI}-16x9.webp`, haut: `${base}essais/tissu-${TISSU_ESSAI}-9x16.webp` }
        : PAGES_MARBRE
          ? { large: `${base}palerme/page-marbre-16x9.webp`, haut: `${base}palerme/page-marbre-9x16.webp` }
          : { large: `${base}fond-tissu-16x9.webp`, haut: `${base}fond-tissu-9x16.webp` },
};

/** Téléphone ou connexion économe : on garde les images fixes, plus légères. */
export const LEGER =
  typeof window !== 'undefined' &&
  (window.matchMedia('(max-width: 700px)').matches || (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true);

const petitEcran = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches;

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
  /** L = la planche 5 « filaments de lumière » (4 novembre, design/planche-5-lumiere.md), peinte par design/hd/lumiere.py ; des encres */
  L: { debut: MATIERE_ENCRE + 501, fin: MATIERE_ENCRE + 600, dossier: 'taches-lumiere', prefixe: 'lumiere' },
  /** M = le catalogue choisi par Tom le 5 novembre : ses bulles aimées des planches 2 et 3, moins les doublons (design/hd/catalogue.py) ; des aquarelles */
  M: { debut: 1001, fin: 1000 + NB_CATALOGUE, dossier: 'taches-catalogue', prefixe: 'cat' },
} as const;
/**
 * Le catalogue du site depuis le 5 novembre 2026 : les bulles que Tom aime dans les planches 2 et 3, moins les doublons
 * (palette M). `?bulles=lumiere` rend la planche 5, `?bulles=anciennes` les 100 taches d'aquarelle (A). Les matières
 * déjà choisies par des personnes (numéros A ou L) restent servies telles quelles.
 */
export const CATALOGUE = parametres?.get('bulles') === 'anciennes' ? PALETTES.A : parametres?.get('bulles') === 'lumiere' ? PALETTES.L : PALETTES.M;
export const CATALOGUE_LISTE = Array.from({ length: CATALOGUE.fin - CATALOGUE.debut + 1 }, (_, i) => CATALOGUE.debut + i);
// Sur téléphone, 30 matières réparties dans le catalogue suffisent (site plus léger).
const indices = petitEcran ? Array.from({ length: 30 }, (_, i) => CATALOGUE_LISTE[Math.floor((i * CATALOGUE_LISTE.length) / 30)]!) : CATALOGUE_LISTE;
const NB_TOUTES = PALETTES.C.fin;
/** le numéro affiché dans sa palette (B 14 pour la matière 114) */
export function numeroDansPalette(n: number): { palette: 'A' | 'B' | 'C' | 'L' | 'M'; numero: number } {
  if (n >= PALETTES.L.debut && n <= PALETTES.L.fin) return { palette: 'L', numero: n - PALETTES.L.debut + 1 };
  if (n >= PALETTES.M.debut && n <= PALETTES.M.fin) return { palette: 'M', numero: n - PALETTES.M.debut + 1 };
  if (n >= PALETTES.C.debut) return { palette: 'C', numero: n - PALETTES.C.debut + 1 };
  if (n >= PALETTES.B.debut) return { palette: 'B', numero: n - PALETTES.B.debut + 1 };
  return { palette: 'A', numero: n };
}
const tacheUrl = (n: number) => {
  const { palette, numero } = numeroDansPalette(n);
  const p = PALETTES[palette];
  // les six matières sans perte sont servies en WebP sans perte (pixels identiques au PNG approuvé, deux fois plus léger :
  // 1,8 Mo de moins au premier chargement) ; les PNG restent dans public/hd/taches pour l'atelier
  const suffixe = palette === 'A' && matieresSansPerte.has(n) ? '-sans-perte.webp' : '.webp';
  // le catalogue (M) : la constellation peint ses bulles en 208 px au plus, les 256 px suffisent (38 Ko au lieu de
  // 142 : 19,6 Mo de moins au premier chargement sur ordinateur) ; les 512 px restent pour les grandes bulles d'une page
  if (palette === 'M') return `${base}${p.dossier}/256/${p.prefixe}-${String(numero).padStart(2, '0')}.webp`;
  return `${base}${p.dossier}/${p.prefixe}-${String(numero).padStart(2, '0')}${suffixe}`;
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
  // le lavis des pages : une vraie tache d'aquarelle (fleur d'eau), teintée dans la couleur GRIS de la page
  r.style.setProperty('--tache-lavis', abs('taches/tache-41.webp'));
}
// adresse absolue : une url() relative dans une variable se résoudrait depuis la feuille de style
const abs = (f: string) => `url("${new URL(`${base}${f}`, location.href).href}")`;

/**
 * La trame de la mousseline et les fibres du papier : posées après le premier rendu, une fois les polices arrivées
 * (2,5 s d'attente au plus), pour ne pas leur disputer la connexion sur un téléphone.
 * Elles apparaissent en fondu (classe `surfaces`, museum.css), jamais d'un coup.
 */
export function poserMatieresDesPages(): void {
  if (!HD || typeof document === 'undefined') return;
  const r = document.documentElement;
  const polices = (document.fonts?.ready ?? Promise.resolve()).catch(() => undefined);
  const delai = new Promise((fini) => window.setTimeout(fini, 2500));
  void Promise.race([polices, delai]).then(() => {
    const charger = (f: string) =>
      new Promise<void>((fini) => {
        const image = new Image();
        image.onload = image.onerror = () => fini();
        image.src = new URL(`${base}${f}`, location.href).href;
      });
    void Promise.all([charger('lin.webp'), charger('papier-chiffon.webp')]).then(() => {
      r.style.setProperty('--papier-chiffon', abs('papier-chiffon.webp'));
      r.style.setProperty('--papier-washi', abs('papier-washi.webp'));
      // la trame de la mousseline, pour la toile des pages et les morceaux de tissu du linge écrit
      r.style.setProperty('--lin-tissu', abs('lin.webp'));
      r.classList.add('surfaces');
    });
  });
}

/** Essai, en développement seulement : ?gothique=1 donne à toutes les bulles une matière de la planche 4. */
const GOTHIQUE = import.meta.env.DEV && parametres?.get('gothique') === '1';
const planche4 = Array.from({ length: 100 }, (_, i) => i + 1);
/** Essai, en développement seulement : ?melange=1 donne aux bulles les 100 du mélange des trois planches (design/selection-bulles.json). */
const MELANGE_SEL = import.meta.env.DEV && parametres?.get('melange') === '1';
const DOSSIERS = {
  2: [MELANGE, (n: number) => `taches-melange/melange-${String(n).padStart(3, '0')}.webp`],
  3: [CLAUDE, (n: number) => `taches-claude/${String(n).padStart(3, '0')}.webp`],
  4: [MATIERE_ENCRE, (n: number) => `taches-gothique/gothique-${String(n).padStart(3, '0')}.webp`],
} as const;
const melange = MELANGE_SEL
  ? selection.bulles.map((b) => ({ n: DOSSIERS[b.planche as 2 | 3 | 4][0] + b.n, src: DOSSIERS[b.planche as 2 | 3 | 4][1](b.n) }))
  : [];

const taches = new Map<number, HTMLImageElement | HTMLCanvasElement | ImageBitmap>();
/** chantier 2 : les mêmes taches en 1 024 px (public/hd/taches/1024), pour les grandes bulles (trace, Créer) seulement */
const tachesGrandes = new Map<number, HTMLImageElement>();
const grandesEnCours = new Map<number, Promise<void>>();
function tacheGrandeUrl(n: number): string | null {
  const { palette, numero } = numeroDansPalette(n);
  if (palette === 'L') return `${base}taches-lumiere/1024/lumiere-${String(numero).padStart(2, '0')}.webp`;
  if (palette === 'M') return `${base}taches-catalogue/cat-${String(numero).padStart(2, '0')}.webp`;
  if (palette !== 'A' || n < 1 || matieresSansPerte.has(n)) return null;
  return `${base}taches/1024/tache-${String(n).padStart(2, '0')}.webp`;
}
function chargerGrande(n: number): Promise<void> {
  const url = tacheGrandeUrl(n);
  if (!HD || !url) return Promise.resolve();
  let p = grandesEnCours.get(n);
  if (!p) {
    p = new Promise<void>((res) => {
      const img = new Image();
      img.onload = () => {
        tachesGrandes.set(n, img);
        res();
      };
      img.onerror = () => res();
      img.src = url;
    });
    grandesEnCours.set(n, p);
  }
  return p;
}
const enCours = new Map<number, Promise<void>>();
let loading: Promise<void> | null = null;

function charger(n: number): Promise<void> {
  if (!HD || n < 1 || (n > NB_TOUTES && !['L', 'M'].includes(numeroDansPalette(n).palette))) return Promise.resolve();
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
      // derrière la peinture du fond et les polices : les bulles provisoires font patienter
      img.fetchPriority = 'low';
      img.src = tacheUrl(n);
    });
    enCours.set(n, p);
  }
  return p;
}

/** Charge une seule fois les taches d'aquarelle de base (toutes sur ordinateur, 30 sur téléphone). */
export function loadTaches(): Promise<void> {
  if (!HD) return Promise.resolve();
  loading ??= Promise.all([
    ...indices.map(charger),
    ...(GOTHIQUE ? planche4 : []).map((n) => chargerMatiere(MATIERE_ENCRE + n, `${base}taches-gothique/gothique-${String(n).padStart(3, '0')}.webp`)),
    ...melange.map((m) => chargerMatiere(m.n, `${base}${m.src}`)),
  ]).then(() => undefined);
  return loading;
}

/**
 * Charge des matières précises (celles que des personnes ont choisies), et seulement elles : la grande bulle d'une trace
 * n'attend plus les 30 ou 100 taches de la constellation (mesuré le 3 novembre : 14 s de retard sur téléphone).
 */
export function loadMatieres(list: (number | undefined)[], grande = false): Promise<void> {
  const nums = list.filter((n): n is number => !!n && n > 0);
  return Promise.all([...nums.map(charger), ...(grande ? nums.map(chargerGrande) : [])]).then(() => undefined);
}

/** Le catalogue complet, pour choisir sa matière. */
export function loadCatalogue(): Promise<void> {
  return loadMatieres(CATALOGUE_LISTE);
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
export function poserMatiere(n: number, image: HTMLImageElement | HTMLCanvasElement | ImageBitmap): void {
  taches.set(n, image);
}

/** Une matière d'un atelier, lue dans son fichier, au numéro choisi. */
export function chargerMatiere(n: number, src: string): Promise<void> {
  return new Promise((fini) => {
    const image = new Image();
    image.onload = () => {
      poserMatiere(n, image);
      fini();
    };
    image.onerror = () => fini();
    image.src = src;
  });
}

/** Sans choix, la matière d'une personne est tirée de son identifiant : au hasard, mais fixe. */
export function matiereFor(seed: number): number {
  if (GOTHIQUE) return MATIERE_ENCRE + planche4[seed % planche4.length]!;
  if (melange.length) return melange[seed % melange.length]!.n;
  // avec les anciennes taches, l'aquarelle cousue (0) fait partie du tirage ; la planche 5 se tire seule
  if (CATALOGUE === PALETTES.A) return seed % (NB_TACHES + 1);
  // Sur téléphone, seules 30 matières du catalogue sont téléchargées (`indices`) : la matière se tire parmi elles.
  // Sans cela, cinq bulles sur six restaient un disque uni (leur matière n'arrivait jamais), et la bulle d'un
  // profil ne ressemblait pas à celle de la constellation. Une matière choisie dans Créer reste servie telle quelle.
  const liste = petitEcran ? indices : CATALOGUE_LISTE;
  return liste[seed % liste.length]!;
}

/**
 * La tache d'aquarelle d'une matière. Si elle n'est pas (encore) chargée —
 * téléphone, connexion lente —, la plus proche dans le catalogue la remplace.
 */
export function tacheFor(n: number, grande = false): HTMLImageElement | HTMLCanvasElement | ImageBitmap | null {
  if (grande) {
    const g = tachesGrandes.get(n);
    if (g) return g;
  }
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

/** Les matières déjà chargées, en images transférables à un travailleur (chantier 6 : les bulles peintes à côté). */
export async function matieresTransferables(): Promise<{ n: number; image: ImageBitmap }[]> {
  if (typeof createImageBitmap === 'undefined') return [];
  const out: { n: number; image: ImageBitmap }[] = [];
  for (const [n, image] of taches) {
    if (image instanceof ImageBitmap) continue;
    try {
      out.push({ n, image: await createImageBitmap(image) });
    } catch {
      /* une image indisponible : la bulle gardera son rendu procédural dans le travailleur */
    }
  }
  return out;
}
