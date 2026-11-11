import { describe, expect, it } from 'vitest';
import { arrivee, COEUR, dansLOeuvre, LONGUEUR, MONDE } from './oeuvre-regles';

describe('l’œuvre commune', () => {
  it('chaque fil a exactement la même longueur, quelle que soit la direction', () => {
    for (const [vx, vy] of [
      [1, 0],
      [0, 1],
      [-3, 2],
      [0.001, 0.0005],
      [100, -100],
    ]) {
      const [x2, y2] = arrivee(0.5, 0.5, 0.5 + vx, 0.5 + vy);
      expect(Math.hypot(x2 - 0.5, y2 - 0.5)).toBeCloseTo(LONGUEUR, 10);
    }
  });

  it('un clic sur le point de départ lui-même donne quand même un fil (vers la droite)', () => {
    const [x2, y2] = arrivee(0.2, 0.3, 0.2, 0.3);
    expect(x2).toBeCloseTo(0.2, 10);
    expect(y2).toBeCloseTo(0.3, 10);
  });

  it('le cœur de l’œuvre est dans la toile, et la toile a des bords', () => {
    expect(dansLOeuvre(COEUR.x, COEUR.y)).toBe(true);
    expect(dansLOeuvre(COEUR.x + COEUR.l, COEUR.y + COEUR.h)).toBe(true);
    expect(dansLOeuvre(MONDE.x0 - 0.01, 0)).toBe(false);
    expect(dansLOeuvre(0, MONDE.y1 + 0.01)).toBe(false);
  });
});
