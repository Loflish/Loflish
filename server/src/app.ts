import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { ZodError } from 'zod';
import { chargerCompte, Refus, routesAuth } from './auth';
import { changement } from './cache';
import { config } from './config';
import { pool, requete } from './db';
import { routesAdmin } from './routes/admin';
import { routesAuteur } from './routes/auteur';
import { routesPubliques } from './routes/public';

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
    if (req.method !== 'GET' && req.method !== 'HEAD' && rep.statusCode < 400) changement();
    rep.header('x-content-type-options', 'nosniff');
    rep.header('referrer-policy', 'strict-origin-when-cross-origin');
    rep.header('x-frame-options', 'SAMEORIGIN');
    rep.header('permissions-policy', 'camera=(), geolocation=(), payment=(), usb=()');
    if (config.production) rep.header('strict-transport-security', 'max-age=31536000; includeSubDomains');
  });

  // les refus du musée et les données mal formées reçoivent une réponse claire, en français
  app.setErrorHandler((e, req, rep) => {
    if (e instanceof Refus) return rep.status(e.statut).send({ erreur: e.message, code: e.code });
    if (e instanceof ZodError) return rep.status(400).send({ erreur: 'Certaines informations ne conviennent pas.', code: 'invalide', details: e.issues.map((i) => ({ champ: i.path.join('.'), message: i.message })) });
    if ((e as { statusCode?: number }).statusCode === 429) return rep.status(429).send({ erreur: 'Doucement : trop de demandes. Réessaie dans quelques minutes.', code: 'trop' });
    if ((e as { statusCode?: number }).statusCode && (e as { statusCode: number }).statusCode < 500) return rep.status((e as { statusCode: number }).statusCode).send({ erreur: (e as Error).message, code: 'requete' });
    req.log.error(e);
    return rep.status(500).send({ erreur: 'Une erreur est survenue de notre côté. Réessaie un peu plus tard.', code: 'serveur' });
  });

  app.get('/api/sante', async () => {
    await requete('select 1');
    return { ok: true };
  });

  app.decorateRequest('compte', null);
  app.addHook('onRequest', chargerCompte);
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
export async function menage() {
  await requete('delete from sessions where expire_le < now()');
  await requete(`delete from liens_connexion where expire_le < now() - interval '1 day'`);
}
