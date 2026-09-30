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
  return traces.filter((t) => anneeDe(t) <= e.annee);
}
