import { describe, expect, it } from 'vitest';
import { lirePlage } from '../src/routes/public';

/** L'en-tête Range des lecteurs vidéo et audio : c'est lui qui permet d'avancer dans un enregistrement. */
describe('lirePlage', () => {
  it('sans en-tête, ou vide : tout le fichier', () => {
    expect(lirePlage(undefined, 1000)).toBeUndefined();
    expect(lirePlage('bytes=-', 1000)).toBeUndefined();
    expect(lirePlage('octets=0-10', 1000)).toBeUndefined();
  });

  it('une plage ordinaire, bornée à la fin du fichier', () => {
    expect(lirePlage('bytes=0-99', 1000)).toEqual({ debut: 0, fin: 99 });
    expect(lirePlage('bytes=500-', 1000)).toEqual({ debut: 500, fin: 999 });
    expect(lirePlage('bytes=900-5000', 1000)).toEqual({ debut: 900, fin: 999 });
    expect(lirePlage(' bytes=10-20 ', 1000)).toEqual({ debut: 10, fin: 20 });
  });

  it('les derniers octets', () => {
    expect(lirePlage('bytes=-100', 1000)).toEqual({ debut: 900, fin: 999 });
    expect(lirePlage('bytes=-5000', 1000)).toEqual({ debut: 0, fin: 999 });
  });

  it('hors du fichier, ou à l’envers : impossible (réponse 416)', () => {
    expect(lirePlage('bytes=1000-', 1000)).toBe('impossible');
    expect(lirePlage('bytes=50-10', 1000)).toBe('impossible');
  });
});
