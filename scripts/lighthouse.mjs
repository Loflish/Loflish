#!/usr/bin/env node
/**
 * Lighthouse sur les pages du musée, téléphone et ordinateur, à partir du site construit (npm run preview, port 4174).
 *
 *   node scripts/lighthouse.mjs <dossier de sortie> [étiquette]
 *
 * Écrit un JSON par page et par appareil, et un résumé `<étiquette>.md` (les quatre scores, LCP, TBT, CLS, INP).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const [dossier = 'lighthouse', etiquette = 'mesure'] = process.argv.slice(2);
const BASE = process.env.BASE ?? 'http://127.0.0.1:4174';
const PAGES = [
  ['accueil', '/'],
  ['trace', '/#/trace/sakinah'],
  ['creer', '/#/creer'],
  ['se-perdre', '/#/se-perdre'],
];
mkdirSync(dossier, { recursive: true });

// HEADLESS=0 : une vraie fenêtre Chrome, avec la carte graphique (le site vit en WebGL ; sans carte, Lighthouse mesure
// un rendu logiciel que personne ne voit) ; sinon, Chrome sans fenêtre, plus simple en intégration continue
const chrome = await launch({ chromeFlags: process.env.HEADLESS === '0' ? ['--no-sandbox', '--window-size=1920,1080'] : ['--headless=new', '--no-sandbox'] });
const lignes = [];
try {
  for (const appareil of ['mobile', 'desktop']) {
    for (const [nom, chemin] of PAGES) {
      const r = await lighthouse(`${BASE}${chemin}`, {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: appareil,
        screenEmulation:
          appareil === 'mobile'
            ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false }
            : { mobile: false, width: 1920, height: 1080, deviceScaleFactor: 1, disabled: false },
        throttling: appareil === 'mobile' ? undefined : { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
      });
      const lhr = r.lhr;
      writeFileSync(join(dossier, `${etiquette}-${appareil}-${nom}.json`), r.report);
      const c = lhr.categories;
      const a = lhr.audits;
      const score = (k) => Math.round((c[k]?.score ?? 0) * 100);
      const ms = (k) => (a[k]?.numericValue != null ? Math.round(a[k].numericValue) : '–');
      lignes.push(
        `| ${appareil} | ${nom} | ${score('performance')} | ${score('accessibility')} | ${score('best-practices')} | ${score('seo')} | ${ms('largest-contentful-paint')} | ${ms('total-blocking-time')} | ${(a['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)} | ${ms('interactive')} |`,
      );
      console.log(lignes[lignes.length - 1]);
    }
  }
} finally {
  await chrome.kill();
}
const md = `# Lighthouse — ${etiquette} (${new Date().toISOString().slice(0, 16).replace('T', ' ')})\n\nSite construit servi sur ${BASE}. Téléphone : 390 × 844, réseau et processeur ralentis (réglage par défaut de Lighthouse). Ordinateur : 1920 × 1080, réseau rapide.\n\n| Appareil | Page | Perf | Accès. | Bonnes pratiques | SEO | LCP (ms) | TBT (ms) | CLS | Interactif (ms) |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${lignes.join('\n')}\n`;
writeFileSync(join(dossier, `${etiquette}.md`), md);
console.log(`\nRésumé : ${join(dossier, `${etiquette}.md`)}`);
