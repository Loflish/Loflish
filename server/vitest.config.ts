import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./test/base.ts'],
    env: {
      DATABASE_URL: 'postgres://postgres@localhost:55432/nmm_test',
      STOCKAGE_DOSSIER: '/tmp/nmm-test-fichiers',
      SITE_DOSSIER: '/nulle-part',
      ADMIN_EMAILS: 'admin@musee.test',
      SECRET: 'secret-de-test',
      LIMITES_DEBIT: 'non',
    },
    fileParallelism: false,
    testTimeout: 20000,
  },
});
