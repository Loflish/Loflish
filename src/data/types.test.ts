import { describe, expect, it } from 'vitest';
import { limiteDe, MAX_EN_AVANT, placesRestantes, questionRubrique, RUBRIQUES, SENS, titreRubrique, type Element } from './types';

describe('les rubriques', () => {
  it('18 rubriques, identifiants uniques, les 5 sens en tête avec leur titre court', () => {
    expect(RUBRIQUES).toHaveLength(18);
    expect(new Set(RUBRIQUES.map((r) => r.id)).size).toBe(18);
    for (const s of SENS) {
      const r = RUBRIQUES.find((x) => x.id === s)!;
      expect(r.famille).toBe('sens');
      expect(r.court).toBeTruthy();
    }
  });

  it('les limites : 7 pour les textes longs, 15 pour les personnes et les lieux, 10 sinon', () => {
    expect(limiteDe('souvenirs')).toBe(7);
    expect(limiteDe('jamaisDit')).toBe(7);
    expect(limiteDe('personnes')).toBe(15);
    expect(limiteDe('lieux')).toBe(15);
    expect(limiteDe('voir')).toBe(10);
    expect(MAX_EN_AVANT).toBe(3);
  });

  it('placesRestantes ne descend jamais sous zéro', () => {
    const items = Array.from({ length: 9 }, (_, i) => ({ id: String(i), texte: 'x' }) as Element);
    expect(placesRestantes(items, 'souvenirs')).toBe(0);
    expect(placesRestantes(items, 'voir')).toBe(1);
    expect(placesRestantes([], 'lieux')).toBe(15);
  });

  it('pour une mémoire, les rubriques se disent à propos de la personne', () => {
    const chapitres = RUBRIQUES.find((r) => r.id === 'chapitres')!;
    expect(titreRubrique(chapitres)).toBe('Chapitres de vie');
    expect(titreRubrique(chapitres, 'memoire')).toBe('Chapitres de sa vie');
    const voir = RUBRIQUES.find((r) => r.id === 'voir')!;
    expect(questionRubrique(voir, 'memoire')).toMatch(/^Qu’aimait-elle voir/);
    const souvenirs = RUBRIQUES.find((r) => r.id === 'souvenirs')!;
    expect(titreRubrique(souvenirs, 'memoire')).toBe('Souvenirs');
    expect(questionRubrique(souvenirs)).toBeUndefined();
  });
});
