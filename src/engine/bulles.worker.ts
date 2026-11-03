/**
 * Le travailleur qui peint les bulles (chantier 6, 3 novembre 2026) : la même peinture que bubbleSprite.ts, mais hors du
 * fil principal. La page ne s'arrête plus pendant que les 380 bulles prennent leur matière ; chaque sprite arrive en
 * ImageBitmap, prêt à être dessiné.
 *
 * Messages reçus :
 *   { type: 'matieres', liste: [{ n, image }] }   les taches déjà chargées (ImageBitmap)
 *   { type: 'peindre', id, hex, size, matiere, eclat }   une bulle à peindre
 *   { type: 'vider' }   les matières ont changé : la mémoire des sprites est vidée
 * Messages envoyés :
 *   { type: 'sprite', id, size, matiere, image }
 */
import { bubbleSprite, clearSpriteCache } from './bubbleSprite';
import { poserMatiere } from '../lib/hd';

type Commande =
  | { type: 'matieres'; liste: { n: number; image: ImageBitmap }[] }
  | { type: 'peindre'; id: string; hex: string; size: number; matiere?: number; eclat: boolean }
  | { type: 'vider' };

/** Les couleurs mises en beauté, comme dans constellation.ts (embellir) : +12 % de couleur, +6 % de clarté. */
function embellir(toile: OffscreenCanvas): OffscreenCanvas {
  const c = new OffscreenCanvas(toile.width, toile.height);
  const x = c.getContext('2d');
  if (!x || !('filter' in x)) return toile;
  x.filter = 'saturate(1.12) brightness(1.06) contrast(1.02)';
  x.drawImage(toile, 0, 0);
  return c;
}

self.onmessage = (e: MessageEvent<Commande>) => {
  const m = e.data;
  if (m.type === 'matieres') {
    for (const { n, image } of m.liste) poserMatiere(n, image);
    clearSpriteCache();
    return;
  }
  if (m.type === 'vider') return clearSpriteCache();
  const toile = bubbleSprite(m.id, m.hex, { matiere: m.matiere, size: m.size }) as OffscreenCanvas;
  const image = (m.eclat ? embellir(toile) : toile).transferToImageBitmap();
  // le sprite part sans copie (transfert) ; la mémoire du travailleur ne garde que la toile d'origine
  (self as unknown as Worker).postMessage({ type: 'sprite', id: m.id, size: m.size, matiere: m.matiere, image }, [image]);
};
