import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { config } from './config';
import { randomInt, timingSafeEqual } from 'node:crypto';
import { envoyerCodeChangement, envoyerCodeConnexion } from './courriel';
import { journaliser, requete, transaction, une } from './db';
import { empreinteIp } from './bannis';
import { empreinte, jeton } from './securite';

/**
 * Entrer dans le musée : sans mot de passe. La personne donne son e-mail et
 * reçoit un code à six chiffres, valable 15 minutes, qui ne sert qu'une fois
 * (cinq essais au plus). Le code ouvre une session de 90 jours dans un cookie
 * protégé (inaccessible au JavaScript de la page) : sur cet appareil, la
 * personne reste connectée.
 */

export interface Compte {
  id: string;
  email: string;
  role: 'membre' | 'moderation' | 'admin';
  majeur_le: Date | null;
  suspendu: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    compte: Compte | null;
  }
}

export const COOKIE = 'nmm_session';
const DUREE_SESSION_JOURS = 90;
const DUREE_CODE_MIN = 15;
const ESSAIS_MAX = 5;

export class Refus extends Error {
  constructor(
    public statut: number,
    message: string,
    public code = 'refus',
  ) {
    super(message);
  }
}

export function exigerCompte(req: FastifyRequest): Compte {
  if (!req.compte) throw new Refus(401, 'Connecte-toi pour continuer.', 'connexion');
  if (req.compte.suspendu) throw new Refus(403, 'Ce compte est suspendu. Écris au fondateur si tu penses que c’est une erreur.', 'suspendu');
  return req.compte;
}

export function exigerRole(req: FastifyRequest, ...roles: Compte['role'][]): Compte {
  const c = exigerCompte(req);
  if (!roles.includes(c.role)) throw new Refus(403, 'Cette partie est réservée au fondateur du musée.', 'role');
  return c;
}

const optionsCookie = () => ({
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.production,
  maxAge: DUREE_SESSION_JOURS * 24 * 3600,
});

/** À chaque requête : qui est là ? (branché au niveau du serveur entier, dans app.ts) */
export async function chargerCompte(req: FastifyRequest) {
  {
    req.compte = null;
    const brut = req.cookies[COOKIE];
    if (!brut) return;
    const c = await une<Compte & { expire_le: Date }>(
      `select c.id, c.email, c.role, c.majeur_le, c.suspendu, s.expire_le
         from sessions s join comptes c on c.id = s.compte_id
        where s.empreinte = $1 and s.expire_le > now()`,
      [empreinte(brut)],
    );
    if (c) req.compte = { id: c.id, email: c.email, role: c.role, majeur_le: c.majeur_le, suspendu: c.suspendu };
  }
}

/** Un code à six chiffres, et son empreinte (liée à l'adresse : un code ne vaut que pour elle). */
function nouveauCode(email: string): { code: string; empreinte: string } {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  return { code, empreinte: empreinte(`code:${email}:${code}`) };
}

/** Garde un code en attente pour cette adresse (et, pour un changement d'adresse, pour ce compte). */
async function garderCode(email: string, compteId: string | null): Promise<string> {
  const { code, empreinte: e } = nouveauCode(email);
  // un nouveau code remplace les précédents
  await requete('update liens_connexion set utilise_le = now() where email = $1 and utilise_le is null and compte_id is not distinct from $2', [email, compteId]);
  await requete(
    `insert into liens_connexion (empreinte, email, code_empreinte, compte_id, expire_le) values ($1, $2, $3, $4, now() + interval '${DUREE_CODE_MIN} minutes')`,
    [empreinte(jeton()), email, e, compteId],
  );
  return code;
}

/**
 * Vérifie le code de cette adresse ; il ne sert qu'une fois, et cinq erreurs l'annulent.
 * Hors transaction : un essai manqué est compté même si la suite échoue.
 */
async function verifierCode(email: string, code: string, compteId: string | null): Promise<void> {
  const ligne = await une<{ empreinte: string; code_empreinte: string; essais: number }>(
    `select empreinte, code_empreinte, essais from liens_connexion
      where email = $1 and compte_id is not distinct from $2 and code_empreinte is not null
        and utilise_le is null and expire_le > now()
      order by cree_le desc limit 1`,
    [email, compteId],
  );
  if (!ligne) throw new Refus(400, 'Ce code a expiré. Demande-en un nouveau.', 'code-expire');
  const attendu = Buffer.from(ligne.code_empreinte);
  const donne = Buffer.from(empreinte(`code:${email}:${code}`));
  if (attendu.length !== donne.length || !timingSafeEqual(attendu, donne)) {
    const r = await une<{ essais: number }>(
      `update liens_connexion set essais = essais + 1,
              utilise_le = case when essais + 1 >= ${ESSAIS_MAX} then now() else utilise_le end
        where empreinte = $1 returning essais`,
      [ligne.empreinte],
    );
    if ((r?.essais ?? ESSAIS_MAX) >= ESSAIS_MAX) throw new Refus(400, 'Trop d’essais. Demande un nouveau code.', 'code-essais');
    throw new Refus(400, 'Ce code ne correspond pas. Vérifie les six chiffres reçus.', 'code-faux');
  }
  const utilise = await une('update liens_connexion set utilise_le = now() where empreinte = $1 and utilise_le is null returning empreinte', [ligne.empreinte]);
  if (!utilise) throw new Refus(400, 'Ce code a déjà servi. Demande-en un nouveau.', 'code-expire');
}

const schemaEmail = z.string().trim().toLowerCase().email().max(200);
const schemaCode = z.string().trim().regex(/^\d{6}$/, 'six chiffres');

export async function routesAuth(app: FastifyInstance) {

  // 1. recevoir un code par e-mail
  app.post('/api/auth/code', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (req) => {
    const { email } = z.object({ email: schemaEmail }).parse(req.body);
    const code = await garderCode(email, null);
    await envoyerCodeConnexion(email, code);
    // en développement, le code est aussi renvoyé (pour essayer sans boîte mail)
    return config.production ? { envoye: true } : { envoye: true, code };
  });

  // 2. entrer avec le code reçu : la session s'ouvre sur cet appareil
  app.post('/api/auth/verifier', { config: { rateLimit: { max: 20, timeWindow: '15 minutes' } } }, async (req, rep) => {
    const { email, code } = z.object({ email: schemaEmail, code: schemaCode }).parse(req.body);
    const ip = empreinteIp(req.ip);
    await verifierCode(email, code, null);
    const r = await transaction(async (c) => {
      const role = config.admins.includes(email) ? 'admin' : null;
      const compte = (await une<Compte>(
        `insert into comptes (email, role, derniere_connexion, derniere_ip) values ($1, coalesce($2, 'membre'), now(), $3)
         on conflict (email) do update set derniere_connexion = now(), derniere_ip = $3,
           role = case when $2::text is not null then $2::text else comptes.role end
         returning id, email, role, majeur_le, suspendu`,
        [email, role, ip],
        c,
      ))!;
      if (compte.suspendu) throw new Refus(403, 'Ce compte est suspendu.', 'suspendu');
      const s = jeton();
      await requete(`insert into sessions (empreinte, compte_id, expire_le, ip) values ($1, $2, now() + interval '${DUREE_SESSION_JOURS} days', $3)`, [empreinte(s), compte.id, ip], c);
      await journaliser(compte.id, 'connexion', null, {}, c);
      return { compte, s };
    });
    rep.setCookie(COOKIE, r.s, optionsCookie());
    return { compte: publicCompte(r.compte) };
  });

  app.post('/api/auth/deconnexion', async (req, rep) => {
    const brut = req.cookies[COOKIE];
    if (brut) await requete('delete from sessions where empreinte = $1', [empreinte(brut)]);
    rep.clearCookie(COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/api/moi', async (req) => ({ compte: req.compte ? publicCompte(req.compte) : null }));

  // changer d'adresse e-mail : un code part vers la nouvelle adresse ; rien ne change avant qu'il soit donné
  app.post('/api/moi/email', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (req) => {
    const c = exigerCompte(req);
    const { email } = z.object({ email: schemaEmail }).parse(req.body);
    if (email === c.email) throw new Refus(400, 'C’est déjà ton adresse.', 'meme');
    if (await une('select 1 from comptes where email = $1', [email])) throw new Refus(409, 'Cette adresse est déjà utilisée par un autre compte.', 'pris');
    const code = await garderCode(email, c.id);
    await envoyerCodeChangement(email, code);
    return config.production ? { envoye: true } : { envoye: true, code };
  });

  app.post('/api/moi/email/confirmer', { config: { rateLimit: { max: 20, timeWindow: '15 minutes' } } }, async (req) => {
    const c = exigerCompte(req);
    const { email, code } = z.object({ email: schemaEmail, code: schemaCode }).parse(req.body);
    await verifierCode(email, code, c.id);
    await transaction(async (tx) => {
      if (await une('select 1 from comptes where email = $1 and id <> $2', [email, c.id], tx))
        throw new Refus(409, 'Cette adresse est déjà utilisée par un autre compte.', 'pris');
      await requete('update comptes set email = $2 where id = $1', [c.id, email], tx);
      await journaliser(c.id, 'compte.email_change', c.id, {}, tx);
    });
    return { compte: publicCompte({ ...c, email }) };
  });

  // déclarer avoir 18 ans ou plus (demandé avant de créer une trace)
  app.post('/api/moi/majeur', async (req) => {
    const c = exigerCompte(req);
    const { majeur } = z.object({ majeur: z.literal(true) }).parse(req.body);
    if (majeur) await requete('update comptes set majeur_le = coalesce(majeur_le, now()) where id = $1', [c.id]);
    return { ok: true };
  });
}

export const publicCompte = (c: Compte) => ({ id: c.id, email: c.email, role: c.role, majeur: !!c.majeur_le });

export function envoyerRefus(e: unknown, rep: FastifyReply) {
  if (e instanceof Refus) return rep.status(e.statut).send({ erreur: e.message, code: e.code });
  return null;
}
