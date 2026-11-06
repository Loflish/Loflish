import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { ZodError } from 'zod';
import { chargerCompte, Refus, routesAuth } from './auth';
import { refuserBannis } from './bannis';
import { empreinteIp } from './securite';
import { changement } from './cache';
import { config } from './config';
import { pool, requete } from './db';
import { routesAdmin } from './routes/admin';
import { routesAuteur } from './routes/auteur';
import { routesPubliques } from './routes/public';

/** Seuls les scripts du site s'exécutent ; les médias peuvent venir du stockage S3 (https), les vidéos liées de YouTube et Vimeo (lecteurIntegre). */
const POLITIQUE =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; font-src 'self' data:; connect-src 'self'; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";

/** La version du serveur (server/package.json ; dans l'image Docker, /app/package.json), montrée par /api/sante. */
const VERSION: string = (createRequire(import.meta.url)('../package.json') as { version: string }).version;

/** Le serveur du musée, assemblé (utilisé par index.ts, et par les tests). */
export async function creerApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.production ? { level: 'info' } : false,
    // on ne croit l'adresse transmise par un relais (Caddy) que s'il est sur la même machine ou le
    // même réseau privé : sinon, n'importe qui pourrait se faire passer pour une autre adresse et
    // contourner les limites de débit
    trustProxy: process.env.PROXY_DE_CONFIANCE ?? 'loopback, linklocal, uniquelocal',
    bodyLimit: 1024 * 1024,
  });

  await app.register(cookie);
  if (config.origines.length) await app.register(cors, { origin: config.origines, credentials: true });
  await app.register(multipart, { limits: { fileSize: 200 * 1024 * 1024, files: 1 } });
  // protection contre les abus (désactivable pour les tests automatiques : LIMITES_DEBIT=non)
  if (process.env.LIMITES_DEBIT !== 'non') await app.register(rateLimit, { global: true, max: 600, timeWindow: '1 minute' });

  // en-têtes de sécurité, sur toutes les réponses ; et toute écriture réussie renouvelle les
  // réponses gardées en mémoire (constellation, œuvre commune), avant même d'être envoyée
  app.addHook('onSend', async (req, rep) => {
    if (req.method !== 'GET' && req.method !== 'HEAD' && rep.statusCode < 400) {
      changement();
      // l'adresse (son empreinte) de qui écrit dans le musée : c'est elle que le fondateur peut bannir
      if (req.compte)
        void requete('update comptes set derniere_ip = $2 where id = $1 and derniere_ip is distinct from $2', [req.compte.id, empreinteIp(req.ip)]).catch(
          () => undefined,
        );
    }
    rep.header('content-security-policy', POLITIQUE);
    rep.header('x-content-type-options', 'nosniff');
    rep.header('referrer-policy', 'strict-origin-when-cross-origin');
    rep.header('x-frame-options', 'SAMEORIGIN');
    rep.header('permissions-policy', 'camera=(), geolocation=(), payment=(), usb=()');
    if (config.production) rep.header('strict-transport-security', 'max-age=31536000; includeSubDomains');
  });

  // les refus du musée et les données mal formées reçoivent une réponse claire, en français
  app.setErrorHandler((e, req, rep) => {
    if (e instanceof Refus) return rep.status(e.statut).send({ erreur: e.message, code: e.code });
    if (e instanceof ZodError)
      return rep
        .status(400)
        .send({
          erreur: 'Certaines informations ne conviennent pas.',
          code: 'invalide',
          details: e.issues.map((i) => ({ champ: i.path.join('.'), message: i.message })),
        });
    if ((e as { statusCode?: number }).statusCode === 429)
      return rep.status(429).send({ erreur: 'Doucement : trop de demandes. Réessaie dans quelques minutes.', code: 'trop' });
    if ((e as { statusCode?: number }).statusCode && (e as { statusCode: number }).statusCode < 500)
      return rep.status((e as { statusCode: number }).statusCode).send({ erreur: (e as Error).message, code: 'requete' });
    req.log.error(e);
    return rep.status(500).send({ erreur: 'Une erreur est survenue de notre côté. Réessaie un peu plus tard.', code: 'serveur' });
  });

  // la santé du musée : la base répond, et depuis combien de temps le serveur tourne (lu par Docker et par la supervision)
  app.get('/api/sante', async (req, rep) => {
    rep.header('cache-control', 'no-store');
    await requete('select 1');
    return { ok: true, version: VERSION, depuis: Math.round(process.uptime()) };
  });

  app.decorateRequest('compte', null);
  // une adresse bannie ne va pas plus loin (sauf l'équipe du musée, reconnue par sa session)
  app.addHook('onRequest', (req) => chargerCompte(req));
  app.addHook('onRequest', refuserBannis);
  await app.register(routesAuth);
  await app.register(routesPubliques);
  await app.register(routesAuteur);
  await app.register(routesAdmin);

  // le site lui-même (npm run build à la racine), servi par le même serveur : une seule adresse
  const site = resolve(config.siteDossier);
  if (existsSync(resolve(site, 'index.html'))) {
    // - assets/ : noms qui changent à chaque version (empreinte dans le nom) → gardés un an ;
    // - index.html : toujours revérifié → une mise à jour du site est vue tout de suite, sans page cassée ;
    // - le reste (images HD, polices, démonstrations) : un jour, puis revérifié.
    await app.register(fastifyStatic, {
      root: site,
      wildcard: false,
      cacheControl: false,
      setHeaders(res, chemin) {
        const nom = chemin.replace(/\\/g, '/');
        if (nom.includes('/assets/')) res.header('cache-control', 'public, max-age=31536000, immutable');
        else if (nom.endsWith('.html')) res.header('cache-control', 'no-cache');
        else res.header('cache-control', 'public, max-age=86400');
      },
    });
    app.setNotFoundHandler((req, rep) =>
      req.url.startsWith('/api/')
        ? rep.status(404).send({ erreur: 'Adresse inconnue.', code: 'introuvable' })
        : rep.header('cache-control', 'no-cache').sendFile('index.html'),
    );
  }

  app.addHook('onClose', async () => {
    await pool.end();
  });
  return app;
}

/** Ménage régulier : sessions et liens expirés. */
/** Les durées annoncées dans « Juridique & confidentialité » et docs/registre-des-traitements.md, appliquées toutes les six heures. */
export async function menage() {
  await requete('delete from sessions where expire_le < now()');
  await requete(`delete from liens_connexion where expire_le < now() - interval '1 day'`);
  await requete(`delete from journal where cree_le < now() - interval '1 year'`);
  await requete(`delete from signalements where statut <> 'ouvert' and traite_le < now() - interval '1 year'`);
  await requete(`delete from bannissements where cree_le < now() - interval '1 year'`);
  await requete(`delete from demandes_deces where statut in ('traitee', 'refusee') and traitee_le < now() - interval '3 years'`);
  // un compte sans trace, sans directive « Après moi », inactif depuis trois ans
  await requete(`delete from comptes c where role = 'membre'
    and coalesce(derniere_connexion, cree_le) < now() - interval '3 years'
    and not exists (select 1 from traces where compte_id = c.id)
    and not exists (select 1 from directives_post_mortem where compte_id = c.id)`);
}
