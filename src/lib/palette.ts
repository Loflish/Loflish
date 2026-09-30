/**
 * Palette des présences — GRIS.
 *
 * Règle non négociable de la direction artistique : GRIS est la seule
 * référence chromatique directe des bulles. Chaque teinte ci-dessous est
 * reprise telle quelle du dépôt de référence donné dans le brief,
 * https://github.com/scpederzani/GRIScolors (fichier palettes_and_functions.R) :
 * des palettes relevées par une fan dans les tableaux du jeu GRIS
 * (Nomada Studio), nommées d'après ses scènes. Ce ne sont pas des valeurs
 * officielles du studio.
 *
 * 30 couleurs, 5 familles × 6. Les noirs, blancs, gris neutres et les
 * bordeaux profonds de GRIS sont volontairement écartés :
 *  - les extrêmes disparaissent sur le fond lin ;
 *  - le bordeaux est réservé au logo brodé.
 */

export type GrisFamily = 'bleus' | 'verts' | 'roses' | 'violets' | 'ocres';

export interface GrisColor {
  id: string;
  hex: string;
  /** Nom de la palette GRIS d'origine. */
  source: string;
  family: GrisFamily;
  /** Nom poétique affiché lors du choix de la couleur. */
  label: string;
}

export const GRIS_FAMILIES: Record<GrisFamily, string> = {
  bleus: 'Bleus & bleus brumeux',
  verts: 'Verts & verts d’eau',
  roses: 'Roses & rouges adoucis',
  violets: 'Violets & mauves',
  ocres: 'Jaunes doux & minéraux',
};

export const GRIS_PALETTE: GrisColor[] = [
  // Bleus
  { id: 'b1', hex: '#4B6097', source: 'Gris', family: 'bleus', label: 'Bleu de l’aube' },
  { id: 'b2', hex: '#3C75AA', source: 'BlueRain', family: 'bleus', label: 'Pluie bleue' },
  { id: 'b3', hex: '#84BAE3', source: 'BlueRain', family: 'bleus', label: 'Ciel lavé' },
  { id: 'b4', hex: '#8892C9', source: 'BlueRain', family: 'bleus', label: 'Bleu pervenche' },
  { id: 'b5', hex: '#7F9FAC', source: 'TheFall', family: 'bleus', label: 'Bleu de brume' },
  { id: 'b6', hex: '#74AFCF', source: 'BirdFlight', family: 'bleus', label: 'Vol d’oiseau' },
  // Verts
  { id: 'v1', hex: '#59A6AB', source: 'Gris', family: 'verts', label: 'Eau calme' },
  { id: 'v2', hex: '#7EA5A3', source: 'ForestPath', family: 'verts', label: 'Sentier' },
  { id: 'v3', hex: '#52AE9A', source: 'Healing', family: 'verts', label: 'Guérison' },
  { id: 'v4', hex: '#8DBEB2', source: 'GiantTree', family: 'verts', label: 'Grand arbre' },
  { id: 'v5', hex: '#648560', source: 'ForestFriend', family: 'verts', label: 'Mousse' },
  { id: 'v6', hex: '#7B867E', source: 'Growth', family: 'verts', label: 'Lichen' },
  // Roses & rouges adoucis
  { id: 'r1', hex: '#D17067', source: 'Gris', family: 'roses', label: 'Corail' },
  { id: 'r2', hex: '#B0676E', source: 'TheFall', family: 'roses', label: 'Rose ancien' },
  { id: 'r3', hex: '#EB8D8D', source: 'RedDesert', family: 'roses', label: 'Désert rose' },
  { id: 'r4', hex: '#DFABA4', source: 'ForestPath', family: 'roses', label: 'Pétale' },
  { id: 'r5', hex: '#D9647A', source: 'FlowerBridge', family: 'roses', label: 'Pont fleuri' },
  { id: 'r6', hex: '#C4878A', source: 'Windswept', family: 'roses', label: 'Vent tiède' },
  // Violets & mauves
  { id: 'm1', hex: '#9C62A3', source: 'RaysOfGrief', family: 'violets', label: 'Violet doux' },
  { id: 'm2', hex: '#827A9C', source: 'Moonbeam', family: 'violets', label: 'Rayon de lune' },
  { id: 'm3', hex: '#63577C', source: 'Starlight', family: 'violets', label: 'Lueur d’étoile' },
  { id: 'm4', hex: '#AFA4E2', source: 'CloudPath', family: 'violets', label: 'Nuage lilas' },
  { id: 'm5', hex: '#7483B8', source: 'TurtleLight', family: 'violets', label: 'Lumière de tortue' },
  { id: 'm6', hex: '#954B7F', source: 'Underground', family: 'violets', label: 'Prune' },
  // Jaunes doux & minéraux
  { id: 'o1', hex: '#F6C761', source: 'Gris', family: 'ocres', label: 'Soleil doux' },
  { id: 'o2', hex: '#E4B476', source: 'Starlight', family: 'ocres', label: 'Miel' },
  { id: 'o3', hex: '#DB8F50', source: 'Healing', family: 'ocres', label: 'Ocre' },
  { id: 'o4', hex: '#E2E288', source: 'ShiningTree', family: 'ocres', label: 'Tilleul' },
  { id: 'o5', hex: '#B6B3A0', source: 'TheFlight', family: 'ocres', label: 'Pierre' },
  { id: 'o6', hex: '#9AACAE', source: 'Starlight', family: 'ocres', label: 'Galet' },
];

export const colorById = (id: string): GrisColor =>
  GRIS_PALETTE.find((c) => c.id === id) ?? GRIS_PALETTE[0];

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hsl(h: number, s: number, l: number, a = 1): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.max(0, Math.min(1, s)) * 100;
  const ll = Math.max(0, Math.min(1, l)) * 100;
  return `hsla(${hh.toFixed(1)}, ${ss.toFixed(1)}%, ${ll.toFixed(1)}%, ${a})`;
}
