#!/usr/bin/env node
/**
 * Mesures dans un vrai Chrome avec la carte graphique (fenêtre visible) :
 *   - images par seconde de la constellation, à 1920 × 1080 et à 390 × 844, sur le site construit (port 4174) ;
 *   - latence d'un clic sur une bulle (du clic au dessin suivant) ;
 *   - axe-core sur quatre pages (accessibilité, juge extérieur).
 *
 *   node scripts/mesures.mjs <dossier de sortie> [étiquette]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';

const [dossier = 'mesures', etiquette = 'mesure'] = process.argv.slice(2);
const BASE = process.env.BASE ?? 'http://127.0.0.1:4174';
mkdirSync(dossier, { recursive: true });
const axeSource = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

const chrome = await launch({ chromeFlags: ['--no-sandbox', '--window-size=1920,1080'] });
const navigateur = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}`, defaultViewport: null });
const sortie = [
  `# Mesures — ${etiquette} (${new Date().toISOString().slice(0, 16).replace('T', ' ')})`,
  '',
  `Chrome avec carte graphique, site construit sur ${BASE}.`,
  '',
];
try {
  const page = await navigateur.newPage();
  // ——— images par seconde et latence, dans la constellation
  for (const [nom, w, h] of [
    ['ordinateur 1920 × 1080', 1920, 1080],
    ['téléphone 390 × 844', 390, 844],
  ]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: w < 700 ? 3 : 1, isMobile: w < 700, hasTouch: w < 700 });
    await page.goto(`${BASE}/?entree=0#/`, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 9000));
    const r = await page.evaluate(async () => {
      const eng = window.__nmmDebug?.engine;
      const bulles = eng ? eng['bubbles'].length : 0;
      const mesure = (ms) =>
        new Promise((fin) => {
          let f = 0;
          const t0 = performance.now();
          const tick = () => {
            f++;
            if (performance.now() - t0 < ms) requestAnimationFrame(tick);
            else fin(Math.round((f / ((performance.now() - t0) / 1000)) * 10) / 10);
          };
          requestAnimationFrame(tick);
        });
      const repos = await mesure(4000);
      // en se promenant : la caméra glisse pendant la mesure
      let t = 0;
      const glisse = setInterval(() => {
        if (eng) {
          eng.cam.x += 3;
          eng.cam.y += Math.sin((t += 0.1)) * 2;
        }
      }, 16);
      const promenade = await mesure(4000);
      clearInterval(glisse);
      // latence d'un clic sur une bulle : du clic jusqu'à l'image suivante peinte avec la fiche ouverte
      let latence = null;
      if (eng && bulles) {
        const id = eng['bubbles'][0].p.id;
        const pos = eng.screenPos(id);
        const t0 = performance.now();
        const c = document.querySelector('.backdrop-constellation');
        const ev = (type) =>
          c.dispatchEvent(new PointerEvent(type, { clientX: pos.x, clientY: pos.y, pointerId: 1, pointerType: 'mouse', bubbles: true, isPrimary: true }));
        ev('pointerdown');
        window.dispatchEvent(
          new PointerEvent('pointerup', { clientX: pos.x, clientY: pos.y, pointerId: 1, pointerType: 'mouse', bubbles: true, isPrimary: true }),
        );
        await new Promise((fin) => {
          const attendre = () => (document.querySelector('.apercu') ? requestAnimationFrame(() => fin()) : requestAnimationFrame(attendre));
          attendre();
          setTimeout(fin, 2000);
        });
        latence = Math.round(performance.now() - t0);
        eng.select(null);
      }
      const marques = performance.getEntriesByType('measure').map((e) => `${e.name} ${Math.round(e.duration)} ms`);
      return { bulles, repos, promenade, latence, marques, dpr: devicePixelRatio };
    });
    sortie.push(
      `## Constellation, ${nom}`,
      '',
      `- bulles à l'écran : ${r.bulles}`,
      `- images par seconde au repos : ${r.repos}`,
      `- images par seconde en se promenant : ${r.promenade}`,
      `- clic sur une bulle → fiche à l'écran : ${r.latence ?? '–'} ms`,
      `- démarrage : ${r.marques.slice(0, 3).join(', ')}`,
      '',
    );
    console.log(nom, JSON.stringify(r));
  }
  // ——— axe-core
  await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });
  sortie.push('## axe-core (règles WCAG 2.2 A et AA, et bonnes pratiques)', '', '| Page | Violations | Détail |', '| --- | --- | --- |');
  for (const [nom, chemin] of [
    ['accueil', '/?entree=0#/'],
    ['trace', '/?entree=0#/trace/sakinah'],
    ['créer', '/?entree=0#/creer'],
    ['se perdre', '/?entree=0#/se-perdre'],
  ]) {
    await page.goto(`${BASE}${chemin}`, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 2500));
    await page.evaluate(axeSource);
    const res = await page.evaluate(() =>
      window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }),
    );
    const v = res.violations;
    writeFileSync(join(dossier, `${etiquette}-axe-${nom.replace(/\s/g, '-')}.json`), JSON.stringify(v, null, 1));
    sortie.push(`| ${nom} | ${v.length} | ${v.map((x) => `${x.id} (${x.impact}, ${x.nodes.length})`).join(', ') || '–'} |`);
    console.log('axe', nom, v.length, v.map((x) => x.id).join(','));
  }
} finally {
  await navigateur.disconnect();
  await chrome.kill();
}
writeFileSync(join(dossier, `${etiquette}.md`), sortie.join('\n') + '\n');
console.log(`\nRésumé : ${join(dossier, `${etiquette}.md`)}`);
