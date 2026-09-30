/**
 * Matières HD — générées avec Higgsfield (Nano Banana, 4K) puis préparées
 * par design/hd/preparer.py : fonds peints, lin, taches d'aquarelle,
 * aplats de gouache, motifs textiles et papiers faits main.
 *
 * Interrupteur unique : HD = false rend exactement le rendu précédent
 * (fond et bulles entièrement procéduraux). Si un fichier manque, le site
 * revient aussi au rendu procédural.
 */
export const HD = true;

const base = `${import.meta.env.BASE_URL}hd/`;

/** Nombre de taches d'aquarelle préparées (public/hd/taches) : le catalogue complet des matières. */
export const NB_MATIERES = 77;
const NB_TACHES = NB_MATIERES;

/** Un fond peint par espace, en format ordinateur (large) et téléphone (haut). */
export type Fond = 'explorer' | 'profil' | 'creer' | 'texte';
export const FONDS: Record<Fond, { large: string; haut: string }> = {
  explorer: { large: `${base}fond-16x9.webp`, haut: `${base}fond-9x16.webp` },
  profil: { large: `${base}fond-profil-16x9.webp`, haut: `${base}fond-profil-9x16.webp` },
  creer: { large: `${base}fond-creer-16x9.webp`, haut: `${base}fond-creer-9x16.webp` },
  texte: { large: `${base}fond-texte-16x9.webp`, haut: `${base}fond-texte-9x16.webp` },
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

export const HD_FILES = {
  /** Diffusion d'encre filmée, recolorée dans la couleur de la bulle (transition vers une mémoire). */
  encre: [`${base}encre.webm`, `${base}encre.mp4`],
  /** Le fond d'Explorer qui vit : boucle vidéo partant et revenant au fond peint. */
  fondVideo: [`${base}fond-explorer.webm`, `${base}fond-explorer.mp4`],
  lin: `${base}lin.webp`,
  eau: `${base}carte-eau.webp`,
};

const tacheUrl = (n: number) => `${base}taches/tache-${String(n).padStart(2, '0')}.webp`;

/** Aplats de gouache (masques : on les remplit de n'importe quelle couleur). */
export type FormeAplat = 'rectangle' | 'arche' | 'bande' | 'ovale';
export const APLATS: Record<FormeAplat, string> = {
  rectangle: `${base}aplats/rectangle.webp`,
  arche: `${base}aplats/arche.webp`,
  bande: `${base}aplats/bande.webp`,
  ovale: `${base}aplats/ovale.webp`,
};

/** Motifs textiles nabis, raccordables (masques, comme les aplats). */
export type Motif = 'fleurs' | 'carreaux' | 'feuillages';
export const MOTIFS: Record<Motif, string> = {
  fleurs: `${base}motifs/fleurs.webp`,
  carreaux: `${base}motifs/carreaux.webp`,
  feuillages: `${base}motifs/feuillages.webp`,
};

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

const taches = new Map<number, HTMLImageElement>();
const enCours = new Map<number, Promise<void>>();
let loading: Promise<void> | null = null;

function charger(n: number): Promise<void> {
  if (!HD || n < 1 || n > NB_TACHES) return Promise.resolve();
  let p = enCours.get(n);
  if (!p) {
    p = new Promise<void>((res) => {
      const img = new Image();
      img.onload = () => {
        taches.set(n, img);
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
  return Promise.all([loadTaches(), ...list.filter((n): n is number => !!n).map(charger)]).then(() => undefined);
}

/** Le catalogue complet, pour choisir sa matière. */
export function loadCatalogue(): Promise<void> {
  return loadMatieres(Array.from({ length: NB_TACHES }, (_, i) => i + 1));
}

/** Sans choix, la matière d'une personne est tirée de son identifiant : au hasard, mais fixe. */
export function matiereFor(seed: number): number {
  return (seed % NB_TACHES) + 1;
}

/**
 * La tache d'aquarelle d'une matière. Si elle n'est pas (encore) chargée —
 * téléphone, connexion lente —, la plus proche dans le catalogue la remplace.
 */
export function tacheFor(n: number): HTMLImageElement | null {
  if (!taches.size) return null;
  const hit = taches.get(n);
  if (hit) return hit;
  for (let d = 1; d < NB_TACHES; d++) {
    const a = taches.get(n - d) ?? taches.get(n + d);
    if (a) return a;
  }
  return null;
}
