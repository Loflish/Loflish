import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./test/base.ts'],
    env: {
      DATABASE_URL: 'postgres://postgres@127.0.0.1:55432/nmm_test',
      STOCKAGE_DOSSIER: join(tmpdir(), 'nmm-test-fichiers'),
      SITE_DOSSIER: '/nulle-part',
      ADMIN_EMAILS: 'admin@musee.test',
      SECRET: 'secret-de-test',
      LIMITES_DEBIT: 'non',
    },
    fileParallelism: false,
    testTimeout: 20000,
  },
});
