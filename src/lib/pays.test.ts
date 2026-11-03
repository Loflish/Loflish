import { describe, expect, it } from 'vitest';
import { listePays, PAYS_AUTRE } from './pays';

describe('la liste des pays', () => {
  const pays = listePays();

  it('nomme les pays en français, sans doublon, triés', () => {
    expect(pays.length).toBeGreaterThan(200);
    expect(new Set(pays).size).toBe(pays.length);
    expect(pays).toContain('France');
    expect(pays).toContain('Sénégal');
    expect(pays).toContain('Viêt Nam');
    const trie = [...pays].sort((a, b) => a.localeCompare(b, 'fr'));
    expect(pays).toEqual(trie);
  });

  it('ne garde jamais un code brut, et laisse « Autre » à part', () => {
    expect(pays.some((p) => /^[A-Z]{2}$/.test(p))).toBe(false);
    expect(pays).not.toContain(PAYS_AUTRE);
    expect(listePays()).toBe(pays);
  });
});
