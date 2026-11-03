import { describe, expect, it } from 'vitest';
import { colorById, GRIS_FAMILIES, GRIS_PALETTE, hexToRgb, hsl, rgbToHsl } from './palette';

describe('palette GRIS', () => {
  it('30 couleurs, 5 familles de 6, identifiants uniques', () => {
    expect(GRIS_PALETTE).toHaveLength(30);
    expect(new Set(GRIS_PALETTE.map((c) => c.id)).size).toBe(30);
    for (const famille of Object.keys(GRIS_FAMILIES)) expect(GRIS_PALETTE.filter((c) => c.family === famille)).toHaveLength(6);
  });

  it('chaque teinte est un hex valide, ni noir ni blanc (ils disparaîtraient sur le lin)', () => {
    for (const c of GRIS_PALETTE) {
      expect(c.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      const [, , l] = rgbToHsl(...hexToRgb(c.hex));
      expect(l).toBeGreaterThan(0.2);
      expect(l).toBeLessThan(0.9);
    }
  });

  it('le bordeaux reste réservé au logo : aucune teinte très sombre et rouge', () => {
    for (const c of GRIS_PALETTE) {
      const [h, s, l] = rgbToHsl(...hexToRgb(c.hex));
      const bordeaux = (h < 15 || h > 340) && s > 0.4 && l < 0.3;
      expect(bordeaux, `${c.id} ${c.hex}`).toBe(false);
    }
  });

  it('colorById retrouve une couleur, et revient à la première pour un identifiant inconnu', () => {
    expect(colorById('v3').label).toBe('Guérison');
    expect(colorById('zz9')).toBe(GRIS_PALETTE[0]);
  });

  it('hex → rgb → hsl → hsl() sans sortir des bornes', () => {
    expect(hexToRgb('#4B6097')).toEqual([75, 96, 151]);
    const [h, s, l] = rgbToHsl(75, 96, 151);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(l).toBeLessThanOrEqual(1);
    expect(hsl(-30, 2, -1, 0.5)).toBe('hsla(330.0, 100.0%, 0.0%, 0.5)');
    expect(rgbToHsl(128, 128, 128)).toEqual([0, 0, 128 / 255]);
  });
});
