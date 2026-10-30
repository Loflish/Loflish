import { useEffect, useState } from 'react';
import { BubbleImage } from '../components/Chrome';
import { loadMatieres, loadPalettes, numeroDansPalette, PALETTES, poserMatiere, tacheFor } from '../lib/hd';
import { GRIS_PALETTE } from '../lib/palette';
import { NOMS_B, NOMS_C } from '../lib/palettesNoms';
import { Page } from './Pages';

/**
 * L'atelier du mélange (local seulement, jamais publié) : un détail de vie glissé dans une tache d'aquarelle, à comparer
 * avec la tache seule, à la taille de la constellation et de près. Les matières viennent des choix de la coupe des bulles.
 * shortcut: le détail est superposé à la tache, pas repeint avec elle ; passer par un modèle d'image si l'idée plaît.
 */

const TAILLE = 512;
/** numéros des matières fabriquées ici, loin du catalogue */
const PREMIERE = 2000;
const FORCES = [
  { nom: 'discret', force: 0.6 },
  { nom: 'visible de près', force: 1 },
];
const NB_ESSAIS = 12;

interface Essai {
  tache: number;
  detail: number;
  nom: string;
  couleur: string;
  melanges: number[];
}

function toile(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = TAILLE;
  return [c, c.getContext('2d')!];
}

/** Le détail entre dans le pigment : il n'existe que là où la tache existe, et l'assombrit sans la recouvrir. */
function melanger(tache: CanvasImageSource, detail: CanvasImageSource, force: number): HTMLCanvasElement {
  const [fond, f] = toile();
  f.drawImage(tache, 0, 0, TAILLE, TAILLE);
  const [dans, d] = toile();
  d.filter = 'blur(0.8px)';
  d.drawImage(detail, TAILLE * 0.1, TAILLE * 0.1, TAILLE * 0.8, TAILLE * 0.8);
  d.filter = 'none';
  d.globalCompositeOperation = 'destination-in';
  d.drawImage(tache, 0, 0, TAILLE, TAILLE);
  f.globalCompositeOperation = 'multiply';
  f.globalAlpha = force;
  f.drawImage(dans, 0, 0);
  return fond;
}

function nomDe(n: number): string {
  const { palette, numero } = numeroDansPalette(n);
  return (palette === 'B' ? NOMS_B : NOMS_C)[numero - 1] ?? '';
}

export default function AtelierMelange() {
  const [essais, setEssais] = useState<Essai[]>([]);

  useEffect(() => {
    void (async () => {
      const f = (await (await fetch('/__coupe-bulles')).json()) as { finale?: number[] };
      const gardees = f.finale ?? [];
      const taches = gardees.filter((n) => n > 0 && n <= PALETTES.A.fin);
      const details = gardees.filter((n) => n > PALETTES.A.fin).slice(0, NB_ESSAIS);
      await loadPalettes();
      await loadMatieres(gardees);
      setEssais(
        details.flatMap((detail, i) => {
          const tache = taches[(i * 7) % taches.length]!;
          const image = tacheFor(tache);
          const dessin = tacheFor(detail);
          if (!image || !dessin) return [];
          const melanges = FORCES.map(({ force }, j) => {
            const n = PREMIERE + i * FORCES.length + j;
            poserMatiere(n, melanger(image, dessin, force));
            return n;
          });
          return [{ tache, detail, nom: nomDe(detail), couleur: GRIS_PALETTE[(i * 7) % GRIS_PALETTE.length]!.id, melanges }];
        }),
      );
    })();
  }, []);

  return (
    <Page className="melange" titre="L’atelier du mélange">
      <h1 className="page-titre">L’atelier du mélange</h1>
      <p className="lead">À gauche, ta tache seule. À droite, la même tache avec un détail caché dedans. La petite bulle montre la taille dans la constellation.</p>
      {essais.map((e) => (
        <section key={e.detail} className="melange-ligne" aria-label={e.nom}>
          <h2 className="melange-nom">{e.nom}</h2>
          <div className="melange-bulles">
            {[{ nom: 'tache seule', matiere: e.tache }, ...FORCES.map(({ nom }, j) => ({ nom, matiere: e.melanges[j]! }))].map((v) => (
              <figure key={v.nom}>
                <BubbleImage id={`melange-${e.detail}`} couleur={e.couleur} matiere={v.matiere} size={230} />
                <BubbleImage id={`melange-${e.detail}`} couleur={e.couleur} matiere={v.matiere} size={48} />
                <figcaption>{v.nom}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </Page>
  );
}
