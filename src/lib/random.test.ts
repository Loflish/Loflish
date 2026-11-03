import { describe, expect, it } from 'vitest';
import { drift, gaussian, hashString, noise1, pick, rng, shuffle } from './random';

describe('hasard reproductible', () => {
  it('la même personne garde toujours la même graine', () => {
    expect(hashString('sakinah')).toBe(hashString('sakinah'));
    expect(hashString('sakinah')).not.toBe(hashString('jeannot'));
    expect(hashString('')).toBeGreaterThanOrEqual(0);
  });

  it('rng : des nombres dans [0, 1[, toujours les mêmes pour une graine', () => {
    const a = rng(42);
    const b = rng(42);
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      expect(b()).toBe(x);
    }
  });

  it('gaussian : centrée, et jamais infinie', () => {
    const r = rng(7);
    let somme = 0;
    for (let i = 0; i < 5000; i++) {
      const g = gaussian(r);
      expect(Number.isFinite(g)).toBe(true);
      somme += g;
    }
    expect(Math.abs(somme / 5000)).toBeLessThan(0.1);
  });

  it('shuffle garde tous les éléments, sans toucher à la liste d’origine', () => {
    const liste = [1, 2, 3, 4, 5, 6, 7, 8];
    const m = shuffle(rng(3), liste);
    expect(m).toHaveLength(8);
    expect([...m].sort()).toEqual([...liste].sort());
    expect(liste).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('pick choisit toujours dans la liste', () => {
    const r = rng(11);
    for (let i = 0; i < 200; i++) expect(['a', 'b', 'c']).toContain(pick(r, ['a', 'b', 'c']));
  });

  it('noise1 et drift restent dans [-1, 1] et sont continus', () => {
    let avant = drift(0);
    for (let x = 0.01; x < 50; x += 0.01) {
      const n = noise1(x);
      const d = drift(x);
      expect(Math.abs(n)).toBeLessThanOrEqual(1);
      expect(Math.abs(d)).toBeLessThanOrEqual(1);
      expect(Math.abs(d - avant)).toBeLessThan(0.2);
      avant = d;
    }
  });
});
