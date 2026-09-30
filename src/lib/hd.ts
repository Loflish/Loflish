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

export const HD_FILES = {
  fondLarge: `${base}fond-16x9.webp`,
  fondHaut: `${base}fond-9x16.webp`,
  lin: `${base}lin.webp`,
  taches: Array.from({ length: 18 }, (_, i) => `${base}taches/tache-${String(i + 1).padStart(2, '0')}.webp`),
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
