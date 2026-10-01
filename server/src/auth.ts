import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { config } from './config';
import { envoyerLienChangement, envoyerLienConnexion } from './courriel';
import { journaliser, requete, transaction, une } from './db';
import { empreinte, jeton } from './securite';

/**
 * Entrer dans le musée : sans mot de passe. La personne donne son e-mail, reçoit
 * un lien valable 20 minutes et à usage unique ; le lien ouvre une session de
 * 90 jours dans un cookie protégé (inaccessible au JavaScript de la page).
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
const DUREE_LIEN_MIN = 20;

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
  if (req.compte.suspendu) throw new Refus(403, 'Ce compte est suspendu. Écris-nous si tu penses que c’est une erreur.', 'suspendu');
  return req.compte;
}

export function exigerRole(req: FastifyRequest, ...roles: Compte['role'][]): Compte {
  const c = exigerCompte(req);
  if (!roles.includes(c.role)) throw new Refus(403, 'Cette partie est réservée à l’équipe du musée.', 'role');
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

export async function routesAuth(app: FastifyInstance) {

  // 1. demander un lien
  app.post('/api/auth/lien', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (req) => {
    const { email } = z.object({ email: z.string().trim().toLowerCase().email().max(200) }).parse(req.body);
    const j = jeton();
    await requete(`insert into liens_connexion (empreinte, email, expire_le) values ($1, $2, now() + interval '${DUREE_LIEN_MIN} minutes')`, [empreinte(j), email]);
    const lien = `${config.siteUrl}/#/connexion?jeton=${j}`;
    await envoyerLienConnexion(email, lien);
    // en développement, le lien est aussi renvoyé (pour tester sans boîte mail)
    return config.production ? { envoye: true } : { envoye: true, lien };
  });

  // 2. ouvrir la session avec le lien reçu
  app.post('/api/auth/verifier', { config: { rateLimit: { max: 20, timeWindow: '15 minutes' } } }, async (req, rep) => {
    const { jeton: j } = z.object({ jeton: z.string().min(20).max(200) }).parse(req.body);
    const compte = await transaction(async (c) => {
      const lien = await une<{ email: string; compte_id: string | null }>(
        `update liens_connexion set utilise_le = now()
          where empreinte = $1 and utilise_le is null and expire_le > now()
          returning email, compte_id`,
        [empreinte(j)],
        c,
      );
      if (!lien) throw new Refus(400, 'Ce lien a expiré ou a déjà servi. Demande-en un nouveau.', 'lien');
      // un lien de changement d'adresse : le compte prend la nouvelle adresse
      if (lien.compte_id) {
        const deja = await une('select 1 from comptes where email = $1 and id <> $2', [lien.email, lien.compte_id], c);
        if (deja) throw new Refus(409, 'Cette adresse est déjà utilisée par un autre compte.', 'pris');
        const ancien = await une<{ email: string }>('select email from comptes where id = $1', [lien.compte_id], c);
        if (!ancien) throw new Refus(400, 'Ce compte n’existe plus.', 'lien');
        await requete('update comptes set email = $2 where id = $1', [lien.compte_id, lien.email], c);
        await journaliser(lien.compte_id, 'compte.email_change', lien.compte_id, {}, c);
      }
      const role = config.admins.includes(lien.email) ? 'admin' : null;
      const compte = (await une<Compte>(
        `insert into comptes (email, role) values ($1, coalesce($2, 'membre'))
         on conflict (email) do update set derniere_connexion = now(),
           role = case when $2::text is not null then $2::text else comptes.role end
         returning id, email, role, majeur_le, suspendu`,
        [lien.email, role],
        c,
      ))!;
      const s = jeton();
      await requete(`insert into sessions (empreinte, compte_id, expire_le) values ($1, $2, now() + interval '${DUREE_SESSION_JOURS} days')`, [empreinte(s), compte.id], c);
      await journaliser(compte.id, 'connexion', null, {}, c);
      return { compte, s, changement: !!lien.compte_id };
    });
    rep.setCookie(COOKIE, compte.s, optionsCookie());
    return { compte: publicCompte(compte.compte), changement: compte.changement };
  });

  app.post('/api/auth/deconnexion', async (req, rep) => {
    const brut = req.cookies[COOKIE];
    if (brut) await requete('delete from sessions where empreinte = $1', [empreinte(brut)]);
    rep.clearCookie(COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/api/moi', async (req) => ({ compte: req.compte ? publicCompte(req.compte) : null }));

  // changer d'adresse e-mail : rien ne change tant que le lien envoyé à la nouvelle adresse n'est pas ouvert
  app.post('/api/moi/email', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (req) => {
    const c = exigerCompte(req);
    const { email } = z.object({ email: z.string().trim().toLowerCase().email().max(200) }).parse(req.body);
    if (email === c.email) throw new Refus(400, 'C’est déjà ton adresse.', 'meme');
    if (await une('select 1 from comptes where email = $1', [email])) throw new Refus(409, 'Cette adresse est déjà utilisée par un autre compte.', 'pris');
    const j = jeton();
    await requete(
      `insert into liens_connexion (empreinte, email, expire_le, compte_id) values ($1, $2, now() + interval '${DUREE_LIEN_MIN} minutes', $3)`,
      [empreinte(j), email, c.id],
    );
    const lien = `${config.siteUrl}/#/connexion?jeton=${j}`;
    await envoyerLienChangement(email, lien);
    return config.production ? { envoye: true } : { envoye: true, lien };
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
