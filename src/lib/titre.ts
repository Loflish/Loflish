import { useEffect } from 'react';

const MUSEE = 'Nos Mots Mémoriaux';

/**
 * Le titre de l'onglet : le nom de la page d'abord, puis celui du musée.
 * C'est ce que lit un lecteur d'écran en arrivant, et ce qu'affiche l'historique.
 */
export function useTitre(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} — ${MUSEE}` : MUSEE;
  }, [page]);
}
