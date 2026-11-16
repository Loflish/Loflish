import { useEffect } from 'react';

/**
 * Le code d'une page est demandé dès que le doigt ou la souris approche de son lien : au moment du clic, il est déjà
 * là, la page s'ouvre sans attendre le réseau (16 novembre 2026, chantier « fluidité »). Les règles de spéculation
 * du navigateur ne servent pas à une application à page unique : on précharge soi-même.
 * En mode « économiseur de données », rien n'est demandé au survol : seulement à l'appui.
 */
const PAGES: [RegExp, () => Promise<unknown>][] = [
  [/^#\/trace\//, () => import('../pages/TracePage')],
  [/^#\/creer/, () => import('../pages/Creer')],
  [/^#\/se-perdre/, () => import('../pages/SePerdre')],
  [/^#\/oeuvre-commune/, () => import('../pages/OeuvreCommune')],
  [/^#\/(projet|ressources|soutenir|juridique|archives$|compte)/, () => import('../pages/Pages')],
];

export function usePrechargement(): void {
  useEffect(() => {
    const demandes = new Set<RegExp>();
    const econome = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const approche = (e: Event) => {
      if (econome && e.type === 'pointerover') return;
      const lien = (e.target as Element | null)?.closest?.('a[href^="#/"]');
      const adresse = lien?.getAttribute('href');
      if (!adresse) return;
      for (const [motif, charger] of PAGES) {
        if (!motif.test(adresse) || demandes.has(motif)) continue;
        demandes.add(motif);
        // un échec de réseau n'empêche rien : la page se chargera au clic, comme avant
        void charger().catch(() => demandes.delete(motif));
      }
    };
    document.addEventListener('pointerover', approche, { passive: true });
    document.addEventListener('pointerdown', approche, { passive: true });
    document.addEventListener('focusin', approche);
    return () => {
      document.removeEventListener('pointerover', approche);
      document.removeEventListener('pointerdown', approche);
      document.removeEventListener('focusin', approche);
    };
  }, []);
}
