import { defineConfig } from 'vitest/config';

/** Les tests du site (src/**\/*.test.ts) : des fonctions pures, sans navigateur. Lancer : npm run test:site */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
