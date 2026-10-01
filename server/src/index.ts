import { creerApp, menage } from './app';
import { config } from './config';
import { migrer } from './migrer';

const appliquees = await migrer();
if (appliquees.length) console.log(`Migrations appliquées : ${appliquees.join(', ')}`);
const app = await creerApp();
await app.listen({ port: config.port, host: '0.0.0.0' });
console.log(`Nos Mots Mémoriaux : serveur prêt sur ${config.siteUrl} (port ${config.port})`);
setInterval(() => void menage().catch(() => undefined), 6 * 3600 * 1000);
for (const s of ['SIGINT', 'SIGTERM'] as const) process.on(s, () => void app.close().then(() => process.exit(0)));
