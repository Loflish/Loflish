import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { Readable } from 'node:stream';
import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config';

/**
 * Le stockage des fichiers déposés (photos, vidéos, enregistrements,
 * documents). Deux possibilités, au choix dans les réglages :
 * - « disque » : un dossier sur le serveur (simple, pour commencer) ;
 * - « s3 » : n'importe quel stockage compatible S3 (Scaleway, OVH, Cloudflare R2,
 *   AWS…), pour grandir sans limite.
 * Le reste du serveur ne voit que ces quatre fonctions.
 */
export interface Stockage {
  deposer(cle: string, fichierLocal: string, mime: string): Promise<void>;
  /** un flux à renvoyer, ou une adresse temporaire vers laquelle rediriger */
  lire(cle: string): Promise<{ flux: Readable; taille: number } | { redirection: string } | null>;
  supprimer(cle: string): Promise<void>;
  type: 'disque' | 's3';
}

function disque(dossier: string): Stockage {
  const racine = resolve(dossier);
  const chemin = (cle: string) => {
    const p = resolve(join(racine, cle));
    if (!p.startsWith(racine + '/')) throw new Error('clé invalide');
    return p;
  };
  return {
    type: 'disque',
    async deposer(cle, fichierLocal) {
      const p = chemin(cle);
      await mkdir(dirname(p), { recursive: true });
      await copyFile(fichierLocal, p);
    },
    async lire(cle) {
      try {
        const p = chemin(cle);
        const s = await stat(p);
        return { flux: createReadStream(p), taille: s.size };
      } catch {
        return null;
      }
    },
    async supprimer(cle) {
      await rm(chemin(cle), { force: true });
    },
  };
}

function s3(): Stockage {
  const { bucket, region, endpoint, cle, secret } = config.stockage.s3;
  const client = new S3Client({ region, endpoint, forcePathStyle: !!endpoint, credentials: { accessKeyId: cle, secretAccessKey: secret } });
  return {
    type: 's3',
    async deposer(k, fichierLocal, mime) {
      await new Upload({ client, params: { Bucket: bucket, Key: k, Body: createReadStream(fichierLocal), ContentType: mime } }).done();
    },
    async lire(k) {
      // le navigateur lit directement dans le stockage, par une adresse valable une heure
      const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: k }), { expiresIn: 3600 });
      return { redirection: url };
    },
    async supprimer(k) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: k }));
    },
  };
}

export const stockage: Stockage = config.stockage.type === 's3' ? s3() : disque(config.stockage.dossier);
