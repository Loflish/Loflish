#!/usr/bin/env node
/**
 * Tout vérifier d'un coup, dans l'ordre : types du site, types du serveur, lint, tests du site,
 * tests du serveur, build. Chaque étape affiche ✓ ou ✗ et sa durée ; le résumé vient à la fin.
 *
 *   npm run verifier            toutes les étapes
 *   npm run verifier -- --vite  sans les tests du serveur (plus rapide)
 */
import { spawnSync } from 'node:child_process';

const rapide = process.argv.includes('--vite');
const etapes = [
  ['Types du site', 'npm', ['run', 'typecheck']],
  ['Types du serveur', 'npm', ['--prefix', 'server', 'run', 'typecheck']],
  ['Lint', 'npm', ['run', 'lint']],
  ['Tests du site', 'npm', ['run', 'test:site']],
  ...(rapide ? [] : [['Tests du serveur', 'npm', ['run', 'serveur:test']]]),
  ['Build', 'npm', ['run', 'build']],
];

const resultats = [];
for (const [nom, cmd, args] of etapes) {
  const debut = Date.now();
  process.stdout.write(`\n— ${nom}…\n`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  const ok = r.status === 0;
  resultats.push({ nom, ok, secondes: ((Date.now() - debut) / 1000).toFixed(1) });
  if (!ok) break;
}

console.log('\n' + '─'.repeat(44));
for (const r of resultats) console.log(`${r.ok ? '✓' : '✗'} ${r.nom.padEnd(20)} ${r.secondes.padStart(6)} s`);
const echec = resultats.find((r) => !r.ok);
const manquees = etapes.length - resultats.length;
if (echec) console.log(`\nArrêt sur « ${echec.nom} »${manquees ? ` (${manquees} étape${manquees > 1 ? 's' : ''} non lancée${manquees > 1 ? 's' : ''})` : ''}.`);
else console.log('\nTout est vérifié.');
process.exit(echec ? 1 : 0);
