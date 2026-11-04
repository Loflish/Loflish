#!/usr/bin/env node
/**
 * Captures de la constellation dans un vrai Chrome (carte graphique), pour comparer deux adresses côte à côte :
 *   node scripts/capturer.mjs <dossier> <nom> <adresse> [<nom> <adresse> ...]
 * Chaque capture : 1920 × 1080 après 12 s (bulles peintes), plus un zoom ×3 du centre (ce que voit l'œil de près).
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';

const [dossier, ...paires] = process.argv.slice(2);
mkdirSync(dossier, { recursive: true });
const chrome = await launch({ chromeFlags: ['--no-sandbox', '--window-size=1920,1080'] });
const navigateur = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}`, defaultViewport: null });
try {
  const page = await navigateur.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  for (let i = 0; i + 1 < paires.length; i += 2) {
    const [nom, adresse] = [paires[i], paires[i + 1]];
    await page.goto(adresse, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 12000));
    const pretes = await page.evaluate(() => {
      const eng = window.__nmmDebug?.engine;
      return eng ? `${eng['bubbles'].filter((b) => b.sprite).length}/${eng['bubbles'].length}` : '?';
    });
    await page.screenshot({ path: join(dossier, `${nom}.png`) });
    await page.evaluate(() => {
      const e = window.__nmmDebug?.engine;
      if (e) e.cam.zoom = Math.min(3, e.maxZoom ?? 3);
    });
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: join(dossier, `${nom}-zoom.png`) });
    console.log(nom, 'bulles peintes', pretes);
  }
} finally {
  await navigateur.disconnect();
  await chrome.kill();
}
