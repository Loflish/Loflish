import { chargerMatiere, MATIERE_ENCRE } from '../lib/hd';

/**
 * Les planches 2, 3 et 4, pour les ateliers (local seulement). public/hd/taches-melange vient de design/hd/taches_melange.py ;
 * public/hd/taches-claude, ce sont les 100 bulles de research_notes/Goût constellation/bulles-claude, réduites à 512 px ;
 * public/hd/taches-gothique vient de design/hd/taches_gothique.py.
 */

/** numéros des matières fabriquées ici, loin du catalogue */
export const MELANGE = 3000;
export const CLAUDE = 4000;
export const GOTHIQUE = MATIERE_ENCRE;

export interface DetailMelange {
  n: number;
  tache: number;
  fr: string;
  famille: string;
}

export interface BulleClaude {
  n: number;
  nom: string;
  f: string;
  groupe: string;
}

export interface BulleGothique {
  n: number;
  nom: string;
  famille: string;
}

export async function chargerPlanches(): Promise<{ melange: DetailMelange[]; claude: BulleClaude[]; gothique: BulleGothique[] }> {
  const [melange, claude, gothique] = (await Promise.all([
    fetch('/hd/taches-melange/index.json').then((r) => r.json()),
    fetch('/hd/taches-claude/index.json').then((r) => r.json()),
    fetch('/hd/taches-gothique/index.json').then((r) => r.json()),
  ])) as [DetailMelange[], BulleClaude[], BulleGothique[]];
  await Promise.all([
    ...melange.map((d) => chargerMatiere(MELANGE + d.n, `/hd/taches-melange/melange-${String(d.n).padStart(3, '0')}.webp`)),
    ...claude.map((d) => chargerMatiere(CLAUDE + d.n, `/hd/taches-claude/${d.f}`)),
    ...gothique.map((d) => chargerMatiere(GOTHIQUE + d.n, `/hd/taches-gothique/gothique-${String(d.n).padStart(3, '0')}.webp`)),
  ]);
  return { melange, claude, gothique };
}
