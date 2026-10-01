/**
 * Les règles de l'œuvre commune, partagées par le site et le serveur (sans
 * aucune dépendance) : une toile immense, et des fils tous de la même longueur.
 */
export const MONDE = { x0: -7.2, y0: -4.5, x1: 8.8, y1: 5.5 };
/** Le cœur de l'œuvre (là où la vue s'ouvre) : un rectangle de 1,6 × 1. */
export const COEUR = { x: 0, y: 0, l: 1.6, h: 1 };
/** La longueur de chaque fil, la même pour tout le monde. */
export const LONGUEUR = 0.16;

export const dansLOeuvre = (x: number, y: number) => x >= MONDE.x0 && x <= MONDE.x1 && y >= MONDE.y0 && y <= MONDE.y1;

/** L'arrivée du fil : dans la direction choisie, toujours à la même distance du départ. */
export function arrivee(x1: number, y1: number, versX: number, versY: number): [number, number] {
  const dx = versX - x1;
  const dy = versY - y1;
  const l = Math.hypot(dx, dy) || 1;
  return [x1 + (dx / l) * LONGUEUR, y1 + (dy / l) * LONGUEUR];
}

