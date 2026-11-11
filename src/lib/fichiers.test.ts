import { describe, expect, it } from 'vitest';
import { lecteurIntegre, lienValide, natureDe, TAILLES_MAX, tailleLisible } from './fichiers';

describe('liens', () => {
  it('accepte http et https, complète une adresse sans protocole, refuse le reste', () => {
    expect(lienValide('https://exemple.org/page')?.href).toBe('https://exemple.org/page');
    expect(lienValide('exemple.org')?.href).toBe('https://exemple.org/');
    expect(lienValide('  http://a.b/c  ')?.href).toBe('http://a.b/c');
    expect(lienValide('javascript:alert(1)')).toBeNull();
    expect(lienValide('ftp://x.y')).toBeNull();
    expect(lienValide('')).toBeNull();
  });

  it('lecteur intégré : YouTube (sans cookies) et Vimeo seulement', () => {
    expect(lecteurIntegre('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(lecteurIntegre('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(lecteurIntegre('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(lecteurIntegre('https://vimeo.com/123456')).toBe('https://player.vimeo.com/video/123456');
    expect(lecteurIntegre('https://exemple.org/video')).toBeNull();
    expect(lecteurIntegre('https://www.youtube.com/watch?v=<script>')).toBeNull();
  });
});

describe('fichiers', () => {
  it('la nature vient du type MIME', () => {
    const f = (type: string) => ({ type }) as File;
    expect(natureDe(f('image/png'))).toBe('image');
    expect(natureDe(f('video/mp4'))).toBe('video');
    expect(natureDe(f('audio/mpeg'))).toBe('audio');
    expect(natureDe(f('application/pdf'))).toBe('document');
    expect(natureDe(f(''))).toBe('document');
  });

  it('les tailles lisibles, à la française', () => {
    expect(tailleLisible(undefined)).toBe('');
    expect(tailleLisible(500)).toBe('1 Ko');
    expect(tailleLisible(2048)).toBe('2 Ko');
    expect(tailleLisible(1.5 * 1024 * 1024)).toBe('1,5 Mo');
    expect(TAILLES_MAX.video).toBeGreaterThan(TAILLES_MAX.image);
  });
});
