import { appel, EN_LIGNE } from '../lib/api';
import type { Trace } from './types';

/**
 * Les éditions des archives : chacune est un instantané daté du musée, qui
 * s'ouvre sur sa propre constellation (/archives/<id>), avec les présences
 * déposées jusqu'à la fin de son année.
 *
 * Pour renommer une édition (« 2028 », « Printemps 2028 »…), il suffit de
 * changer son titre ; l'identifiant sert d'adresse et peut changer aussi.
 */
export interface Edition {
  id: string;
  titre: string;
  /** les traces créées jusqu'à la fin de cette année en font partie */
  annee: number;
  note: string;
  /** une édition figée garde la liste exacte de ses présences */
  ids?: string[];
}

export const EDITIONS: Edition[] = [{ id: '2026', titre: '2026', annee: 2026, note: 'Ouverture du musée' }];

export function editionParId(id: string | undefined): Edition | undefined {
  return id ? EDITIONS.find((e) => e.id === id) : undefined;
}

/** L'année de création d'une trace (les dates sont écrites en toutes lettres : « 12 juin 2024 »). */
function anneeDe(t: Trace): number {
  const m = /(\d{4})/.exec(t.creeLe);
  return m ? Number(m[1]) : new Date().getFullYear();
}

export function tracesDeLEdition(traces: Trace[], e: Edition): Trace[] {
  if (e.ids) {
    const garde = new Set(e.ids);
    return traces.filter((t) => garde.has(t.id));
  }
  return traces.filter((t) => anneeDe(t) <= e.annee);
}

/** En ligne : les éditions sont gérées depuis l'espace de l'équipe du musée. */
export async function chargerEditions(): Promise<void> {
  if (!EN_LIGNE) return;
  const r = await appel<{ editions: { id: string; titre: string; annee: number; note: string; figee: boolean }[] }>('GET', '/api/editions');
  const liste: Edition[] = await Promise.all(
    r.editions.map(async (e) => ({
      id: e.id,
      titre: e.titre,
      annee: e.annee,
      note: e.note,
      ids: e.figee ? (await appel<{ ids: string[] }>('GET', `/api/editions/${e.id}/presences`)).ids : undefined,
    })),
  );
  EDITIONS.splice(0, EDITIONS.length, ...liste);
}
