/**
 * Le musée en ligne sur une base jetable, sans PostgreSQL installé (Windows) : PGlite, le même moteur en WebAssembly,
 * servi sur un port local, puis le serveur Fastify dessus. Pour regarder le vrai parcours (compte, Après moi, dépôt de
 * médias, retrait) avec `npm run dev:en-ligne` à côté. Les données disparaissent à l'arrêt.
 *
 *   cd server && npx tsx scripts/dev-pglite.ts        (port 8787, base sur 55433)
 *
 * Sans SMTP, les codes de connexion sont écrits dans ce terminal (et renvoyés par l'API hors production).
 */
import { PGlite } from '@electric-sql/pglite';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const PORT_BASE = Number(process.env.PGLITE_PORT ?? 55433);
const db = await PGlite.create({ extensions: { unaccent, pg_trgm } });
const base = new PGLiteSocketServer({ db, port: PORT_BASE, host: '127.0.0.1', maxConnections: 20 });
await base.start();
process.env.DATABASE_URL = `postgres://postgres@127.0.0.1:${PORT_BASE}/postgres`;
process.env.PG_CONNEXIONS ??= '1';
process.env.SITE_URL ??= 'http://127.0.0.1:5175';
process.env.STOCKAGE_DOSSIER ??= './donnees/fichiers-essai';

const { migrer } = await import('../src/migrer');
const { creerApp, menage } = await import('../src/app');
const { config } = await import('../src/config');
await migrer();
const app = await creerApp();
await app.listen({ port: config.port, host: '127.0.0.1' });
console.log(`Musée d’essai prêt : API sur le port ${config.port}, base PGlite sur ${PORT_BASE}. Ctrl+C pour tout effacer.`);
setInterval(() => void menage().catch(() => undefined), 6 * 3600 * 1000);
for (const s of ['SIGINT', 'SIGTERM'] as const)
  process.on(s, () => void app.close().then(() => base.stop()).then(() => db.close()).then(() => process.exit(0)));
