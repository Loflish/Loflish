/**
 * Le peintre des bulles : confie la peinture des sprites au travailleur (bulles.worker.ts) quand le navigateur le
 * permet (OffscreenCanvas, ImageBitmap, filtre 2D), sinon rend la main à la constellation, qui peint elle-même par
 * petits budgets de temps, comme avant. `?travailleur=0` force l'ancien chemin, pour comparer.
 */
import { matieresTransferables } from '../lib/hd';

export type SpriteRecu = { id: string; size: number; matiere?: number; image: ImageBitmap };

export class Peintre {
  private worker: Worker | null = null;
  /** les bulles demandées et pas encore livrées */
  private enVol = new Set<string>();
  private matieresEnvoyees = false;

  constructor(private surSprite: (s: SpriteRecu) => void) {
    const refuse = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('travailleur') === '0';
    if (refuse || typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') return;
    try {
      const o = new OffscreenCanvas(1, 1).getContext('2d');
      if (!o || !('filter' in o)) return;
      this.worker = new Worker(new URL('./bulles.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e: MessageEvent<{ type: 'sprite' } & SpriteRecu>) => {
        if (e.data.type !== 'sprite') return;
        this.enVol.delete(e.data.id);
        this.surSprite(e.data);
      };
      this.worker.onerror = () => {
        // le travailleur ne démarre pas (ancien navigateur, politique de sécurité) : la constellation reprend la main
        this.worker?.terminate();
        this.worker = null;
        this.enVol.clear();
      };
    } catch {
      this.worker = null;
    }
  }

  /** Vrai quand les bulles se peignent à côté ; faux : l'ancien chemin, dans la page. */
  get actif(): boolean {
    return this.worker !== null;
  }

  /** Les matières chargées partent vers le travailleur (une fois par jeu de matières) ; sa mémoire de sprites est vidée. */
  async envoyerMatieres(): Promise<void> {
    if (!this.worker) return;
    const liste = await matieresTransferables();
    if (!this.worker) return;
    this.worker.postMessage(
      { type: 'matieres', liste },
      liste.map((m) => m.image),
    );
    this.matieresEnvoyees = true;
    this.enVol.clear();
  }

  get pret(): boolean {
    return this.matieresEnvoyees;
  }

  /** Demande une bulle ; rend faux si elle est déjà en route. */
  peindre(id: string, hex: string, size: number, matiere: number | undefined, eclat: boolean): boolean {
    if (!this.worker || this.enVol.has(id)) return false;
    this.enVol.add(id);
    this.worker.postMessage({ type: 'peindre', id, hex, size, matiere, eclat });
    return true;
  }

  get enAttente(): number {
    return this.enVol.size;
  }

  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.enVol.clear();
  }
}
