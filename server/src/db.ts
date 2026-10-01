import pg from 'pg';
import { config } from './config';

/**
 * La base PostgreSQL : un seul pool pour tout le serveur.
 * - une requête ne peut pas durer plus de 15 secondes (une requête bloquée ne bloque pas le musée) ;
 * - une transaction oubliée ouverte est fermée au bout de 30 secondes ;
 * - si la base ne répond pas, on abandonne au bout de 10 secondes au lieu d'attendre indéfiniment.
 */
export const pool = new pg.Pool({
  connectionString: config.baseDeDonnees,
  max: Number(process.env.PG_CONNEXIONS ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 15_000,
  idle_in_transaction_session_timeout: 30_000,
  application_name: 'nos-mots-memoriaux',
});

// une connexion inactive qui tombe (redémarrage de la base, réseau) ne doit pas arrêter le serveur :
// le pool en ouvrira une autre à la prochaine requête
pool.on('error', (e) => console.error('[base] connexion perdue :', e.message));

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
