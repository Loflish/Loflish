import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db';

/**
 * Applique, dans l'ordre, les migrations qui ne l'ont pas encore été
 * (migrations/NNN_nom.sql). Chacune est appliquée dans une transaction.
 */
export async function migrer(dossier = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations')): Promise<string[]> {
  await pool.query('create table if not exists migrations (nom text primary key, appliquee_le timestamptz not null default now())');
  const faites = new Set((await pool.query<{ nom: string }>('select nom from migrations')).rows.map((r) => r.nom));
  const fichiers = (await readdir(dossier)).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
  const appliquees: string[] = [];
  for (const f of fichiers) {
    if (faites.has(f)) continue;
    const sql = await readFile(join(dossier, f), 'utf8');
    const c = await pool.connect();
    try {
      await c.query('begin');
      await c.query(sql);
      await c.query('insert into migrations (nom) values ($1)', [f]);
      await c.query('commit');
      appliquees.push(f);
    } catch (e) {
      await c.query('rollback');
      throw new Error(`Migration ${f} : ${(e as Error).message}`);
    } finally {
      c.release();
    }
  }
  return appliquees;
}

// lancé directement : npm run migrer
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  migrer()
    .then((a) => {
      console.log(a.length ? `Migrations appliquées : ${a.join(', ')}` : 'La base est à jour.');
      return pool.end();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
