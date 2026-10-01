/**
 * Réglages du serveur, lus dans l'environnement (voir .env.exemple).
 * Rien de secret n'est écrit dans le code.
 */

function lire(nom: string, defaut?: string): string {
  const v = process.env[nom] ?? defaut;
  if (v === undefined) throw new Error(`Réglage manquant : ${nom} (voir server/.env.exemple)`);
  return v;
}

const production = process.env.NODE_ENV === 'production';

export const config = {
  production,
  port: Number(lire('PORT', '8787')),
  /** adresse publique du site (liens envoyés par e-mail, cookies) */
  siteUrl: lire('SITE_URL', 'http://localhost:8787').replace(/\/$/, ''),
  /** connexion PostgreSQL */
  baseDeDonnees: lire('DATABASE_URL', 'postgres://postgres@localhost:5432/nmm'),
  /** origines autorisées à appeler l'API depuis un autre domaine (séparées par des virgules) */
  origines: (process.env.CORS_ORIGINES ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  /** comptes qui reçoivent le rôle d'administration à leur connexion */
  admins: (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
  /** secret pour signer les empreintes (jetons, sessions, appareils) */
  secret: lire('SECRET', production ? undefined : 'secret-de-developpement-a-changer'),
  /** stockage des fichiers : « disque » (un dossier) ou « s3 » (tout service compatible S3) */
  stockage: {
    type: lire('STOCKAGE', 'disque') as 'disque' | 's3',
    dossier: lire('STOCKAGE_DOSSIER', './donnees/fichiers'),
    s3: {
      bucket: process.env.S3_BUCKET ?? '',
      region: process.env.S3_REGION ?? 'fr-par',
      endpoint: process.env.S3_ENDPOINT || undefined,
      cle: process.env.S3_ACCESS_KEY ?? '',
      secret: process.env.S3_SECRET_KEY ?? '',
    },
  },
  /** envoi des e-mails (lien de connexion) ; sans SMTP, le lien est écrit dans le journal du serveur */
  smtp: {
    url: process.env.SMTP_URL ?? '',
    expediteur: lire('MAIL_FROM', 'Nos Mots Mémoriaux <nosmots@memoriaux.org>'),
  },
  /** dossier du site construit (npm run build à la racine), servi par ce même serveur */
  siteDossier: lire('SITE_DOSSIER', '../dist'),
  /** montre les traces de démonstration (jamais en production : aucune fausse bulle) */
  demo: process.env.DEMO === '1',
};
