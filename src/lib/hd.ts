/**
 * Matières HD — générées avec Higgsfield (Nano Banana, 4K) puis préparées
 * par design/hd/preparer.py : fond peint, lin, taches d'aquarelle.
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

// Sur téléphone, 30 taches réparties entre toutes les techniques suffisent (site plus léger).
const petitEcran = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches;
const indices = petitEcran
  ? Array.from({ length: 30 }, (_, i) => Math.floor((i * NB_TACHES) / 30) + 1)
  : Array.from({ length: NB_TACHES }, (_, i) => i + 1);

export const HD_FILES = {
  lin: `${base}lin.webp`,
  eau: `${base}carte-eau.webp`,
  taches: indices.map((n) => `${base}taches/tache-${String(n).padStart(2, '0')}.webp`),
};

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

export function tacheFor(seed: number): HTMLImageElement | null {
  return taches.length ? taches[seed % taches.length] : null;
}
