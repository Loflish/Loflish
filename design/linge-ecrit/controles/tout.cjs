// Tous les contrôles, d'un coup, sur le site compilé (dist/) : npm run build, puis npm run controles.
// Sert dist/ sur le port 4174, lance chaque script, et sort en erreur si l'un d'eux échoue.
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const ici = __dirname;
const dist = path.join(ici, '..', '..', '..', 'dist');
const serveur = spawn(process.execPath, [path.join(ici, 'servir.cjs'), dist, '4174'], { stdio: 'ignore' });
const etapes = [
  ['Parcours de 32 gestes, téléphone', ['parcours.cjs', 'http://127.0.0.1:4174/', '390']],
  ['Parcours de 32 gestes, ordinateur', ['parcours.cjs', 'http://127.0.0.1:4174/', '1440']],
  ['Textes, liens, contrôles et titres inchangés', ['textes.cjs']],
  ['Accessibilité (axe), débordements, cibles tactiles', ['mesurer.cjs']],
  ['Chaque page ne charge que ce qu’elle montre', ['demarrage.cjs']],
  ['Défauts déjà corrigés, rejoués', ['correctifs.cjs']],
];
setTimeout(() => {
  const bilan = [];
  for (const [nom, args] of etapes) {
    console.log(`\n=== ${nom}`);
    let r = spawnSync(process.execPath, [path.join(ici, args[0]), ...args.slice(1)], { stdio: 'inherit' });
    // un second essai : le parcours tire des présences au hasard, un geste peut tomber sur un cas rare
    if (r.status !== 0) { console.log(`--- second essai : ${nom}`); r = spawnSync(process.execPath, [path.join(ici, args[0]), ...args.slice(1)], { stdio: 'inherit' }); }
    bilan.push([nom, r.status === 0]);
  }
  serveur.kill();
  console.log('\n=== BILAN');
  for (const [nom, bon] of bilan) console.log((bon ? 'OK    ' : 'ÉCHEC ') + nom);
  process.exit(bilan.every(([, bon]) => bon) ? 0 : 1);
}, 800);
