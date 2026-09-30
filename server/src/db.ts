import pg from 'pg';
import { config } from './config';

/** La base PostgreSQL : un seul pool pour tout le serveur. */
export const pool = new pg.Pool({ connectionString: config.baseDeDonnees, max: 10 });

export type Client = pg.PoolClient | pg.Pool;

export async function requete<T extends pg.QueryResultRow = Record<string, unknown>>(
  sql: string,
  valeurs: unknown[] = [],
  client: Client = pool,
): Promise<T[]> {
  const r = await client.query<T>(sql, valeurs);
  return r.rows;
}

export async function une<T extends pg.QueryResultRow = Record<string, unknown>>(sql: string, valeurs: unknown[] = [], client: Client = pool): Promise<T | undefined> {
  return (await requete<T>(sql, valeurs, client))[0];
}

/** Plusieurs écritures qui réussissent ou échouent ensemble. */
export async function transaction<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('begin');
    const r = await fn(c);
    await c.query('commit');
    return r;
  } catch (e) {
    await c.query('rollback');
    throw e;
  } finally {
    c.release();
  }
}

/** Écrit une ligne dans le journal : qui a fait quoi, quand. */
export async function journaliser(compteId: string | null, action: string, cible: string | null, details: Record<string, unknown> = {}, client: Client = pool) {
  await requete('insert into journal (compte_id, action, cible, details) values ($1, $2, $3, $4)', [compteId, action, cible, details], client);
}
