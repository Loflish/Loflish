import type { FastifyReply, FastifyRequest } from 'fastify';
import { chargerCompte } from './auth';
import { requete } from './db';
import { empreinteIp } from './securite';

/**
 * Les adresses IP bannies par le fondateur : leur venue sur le musée s'arrête là.
 * Seule l'empreinte signée de chaque adresse est gardée (jamais l'adresse en clair).
 * La liste vit en mémoire : elle est relue à chaque bannissement, et toutes les cinq minutes.
 */
let bannies = new Set<string>();
let luLe = 0;

export async function relireBannissements(): Promise<void> {
  const lignes = await requete<{ ip: string }>('select ip from bannissements');
  bannies = new Set(lignes.map((l) => l.ip));
  luLe = Date.now();
}

export async function refuserBannis(req: FastifyRequest, rep: FastifyReply) {
  if (Date.now() - luLe > 5 * 60 * 1000) await relireBannissements().catch(() => undefined);
  if (!bannies.size || !bannies.has(empreinteIp(req.ip))) return;
  // l'équipe du musée n'est jamais fermée dehors : une adresse est partagée (foyer, école, réseau mobile),
  // et bannir une personne a déjà fermé le musée au fondateur lui-même (essai du 6 novembre 2026)
  if (!req.compte) await chargerCompte(req, true);
  if (req.compte && req.compte.role !== 'membre') return;
  rep.header('cache-control', 'no-store');
  if (req.url.startsWith('/api/'))
    return rep.status(403).send({ erreur: 'L’accès au musée t’a été fermé.', code: 'banni' });
  return rep
    .status(403)
    .type('text/html; charset=utf-8')
    .send('<!doctype html><meta charset="utf-8"><title>Nos Mots Mémoriaux</title><p style="font:1.1rem Georgia,serif;margin:20vh auto;max-width:30rem;text-align:center;color:#2f2c33">L’accès au musée t’a été fermé.</p>');
}
