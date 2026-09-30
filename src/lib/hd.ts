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

/** Nombre de taches d'aquarelle préparées (public/hd/taches). */
const NB_TACHES = 77;

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
  taches: indices.map((n) => `${base}taches/tache-${String(n).padStart(2, '0')}.webp`),
};

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

let taches: HTMLImageElement[] = [];
let loading: Promise<HTMLImageElement[]> | null = null;

/** Charge les taches d'aquarelle une seule fois ; résout avec celles qui existent. */
export function loadTaches(): Promise<HTMLImageElement[]> {
  if (!HD) return Promise.resolve([]);
  if (loading) return loading;
  loading = Promise.all(
    HD_FILES.taches.map(
      (src) =>
        new Promise<HTMLImageElement | null>((res) => {
          const img = new Image();
          img.onload = () => res(img);
          img.onerror = () => res(null);
          img.src = src;
        }),
    ),
  ).then((list) => (taches = list.filter(Boolean) as HTMLImageElement[]));
  return loading;
}

/**
 * La matière d'une bulle est tirée au hasard pour chaque personne (jamais
 * choisie) et reste la sienne : une aquarelle sèche ne change plus de forme.
 */
export function tacheFor(seed: number): HTMLImageElement | null {
  return taches.length ? taches[seed % taches.length] : null;
}
