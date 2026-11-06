// La transition « Entrer dans sa mémoire » image par image : captures à des instants fixes après le clic,
// pour juger le départ, la montée de l'encre et l'arrivée de la page. Vrai Chrome.
// Usage : node scripts/encre-sequence.mjs [dossier] [url]
import { mkdirSync } from 'node:fs';
import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';

const D = process.argv[2] ?? 'C:/Users/tombl/Desktop/Claude Code/reports/Revue 2026-11-06/encre';
const URL = process.argv[3] ?? 'http://127.0.0.1:5174';
const INSTANTS = [40, 250, 500, 800, 1100, 1500, 2000, 2800];
mkdirSync(D, { recursive: true });
const chrome = await launch({ chromeFlags: ['--no-sandbox', '--window-size=1600,900'] });
const nav = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}`, defaultViewport: null });
const dors = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const page = await nav.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${URL}/?entree=0#/`, { waitUntil: 'load' });
  await dors(6000);
  for (const passage of [1, 2]) {
    await page.evaluate(() => {
      const e = window.__nmmDebug.engine;
      const b = e.bubbles.find((x) => { const p = e.screenPos(x.p.id); return p && p.x > 500 && p.x < 1100 && p.y > 250 && p.y < 650; }) ?? e.bubbles[0];
      e.select(b.p.id);
    });
    await dors(1200);
    const t0 = Date.now();
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith('Entrer dans sa mémoire')).click());
    for (const t of INSTANTS) {
      const reste = t - (Date.now() - t0);
      if (reste > 0) await dors(reste);
      const reel = Date.now() - t0;
      await page.screenshot({ path: `${D}/passage${passage}-${String(reel).padStart(4, '0')}ms.jpg`, type: 'jpeg', quality: 70 });
    }
    await dors(1200);
    // retour pour le second passage : la toile de l'encre a déjà servi
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith('Sa bulle'))?.click());
    await dors(2500);
    await page.keyboard.press('Escape');
    await dors(800);
  }
  console.log('captures dans', D);
} finally {
  await nav.disconnect();
  await chrome.kill();
}
