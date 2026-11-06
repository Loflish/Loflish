#!/usr/bin/env node
/**
 * Balayage de toute la constellation : la caméra visite une grille de positions sur le monde (un tore), à deux zooms,
 * bulles et interface cachées ; chaque vue est mesurée (traits clairs : énergie du passe-haut clair) et la pire est
 * gardée. Une mosaïque et un tableau. Sert à vérifier un réglage de l'eau partout, pas seulement au centre.
 *
 *   node scripts/balayage.mjs <dossier> <adresse> [colonnes=6] [lignes=4]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';

const [dossier, adresse, colonnes = '6', lignes = '4'] = process.argv.slice(2);
mkdirSync(dossier, { recursive: true });
const chrome = await launch({ chromeFlags: ['--no-sandbox', '--window-size=1920,1080'] });
const nav = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}`, defaultViewport: null });
const dors = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const page = await nav.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(adresse, { waitUntil: 'load' });
  await dors(9000);
  await page.addStyleTag({ content: '.backdrop-constellation, .backdrop-ornements, main, header, nav, .dock, .chrome, .entree-ecran { visibility: hidden !important; }' });
  const monde = await page.evaluate(() => ({ w: window.__nmmDebug.engine.worldW, h: window.__nmmDebug.engine.worldH }));
  const lignesOut = [];
  for (const zoom of [1, 2.2]) {
    for (let j = 0; j < Number(lignes); j++) {
      for (let i = 0; i < Number(colonnes); i++) {
        const x = ((i + 0.5) / Number(colonnes)) * monde.w;
        const y = ((j + 0.5) / Number(lignes)) * monde.h;
        await page.evaluate((x, y, z) => { const e = window.__nmmDebug.engine; e.cam.x = x; e.cam.y = y; e.cam.zoom = z; }, x, y, zoom);
        await dors(1400);
        const f = join(dossier, `z${zoom}-${j}-${i}.png`);
        await page.screenshot({ path: f });
        lignesOut.push(`${zoom}\t${j}\t${i}\t${f}`);
      }
    }
  }
  writeFileSync(join(dossier, 'vues.tsv'), lignesOut.join('\n'));
  console.log(execFileSync('python', ['scripts/balayage.py', dossier], { encoding: 'utf8' }));
} finally {
  await nav.disconnect();
  await chrome.kill();
}
