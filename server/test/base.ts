import { execSync } from 'node:child_process';
import { mkdtempSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Une vraie base PostgreSQL, jetable, pour les tests : créée dans un dossier
 * temporaire, démarrée sur un port à part, effacée à la fin.
 */
const BIN = process.env.PG_BIN ?? '/usr/lib/postgresql/16/bin';
const PORT = 55432;

export default function () {
  const dossier = mkdtempSync(join(tmpdir(), 'nmm-pg-'));
  chmodSync(dossier, 0o777);
  const donnees = join(dossier, 'donnees');
  const enPostgres = (cmd: string) => {
    const root = process.getuid?.() === 0;
    execSync(root ? `su postgres -c "${cmd}"` : cmd, { stdio: 'pipe' });
  };
  enPostgres(`${BIN}/initdb -D ${donnees} -A trust -U postgres --locale=C.UTF-8 -E UTF8`);
  enPostgres(`${BIN}/pg_ctl -D ${donnees} -o '-p ${PORT} -k ${dossier}' -l ${dossier}/log -w start`);
  enPostgres(`${BIN}/createdb -h ${dossier} -p ${PORT} -U postgres nmm_test`);
  process.env.DATABASE_URL = `postgres://postgres@localhost:${PORT}/nmm_test`;
  return () => {
    enPostgres(`${BIN}/pg_ctl -D ${donnees} -m immediate stop`);
    execSync(`rm -rf ${dossier}`);
  };
}
