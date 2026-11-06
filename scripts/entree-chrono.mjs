// Chronomètre l'écran d'entrée, à froid : chaque changement de classe de <html> et l'arrivée du dock, en millisecondes.
// Usage : DPR=1 node scripts/entree-chrono.mjs [url]
import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';

const URL = process.argv[2] ?? 'http://127.0.0.1:5174';
const DPR = Number(process.env.DPR ?? 1);
const chrome = await launch({ chromeFlags: ['--no-sandbox', '--window-size=1920,1080'] });
const nav = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}`, defaultViewport: null });
try {
  const page = await nav.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: DPR });
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.clear();
    } catch {
      /* rien */
    }
    window.__chrono = [];
    const note = (quoi) => window.__chrono.push([Math.round(performance.now()), quoi]);
    new MutationObserver(() => note('html.class = ' + document.documentElement.className)).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const voirDock = () => {
      if (document.querySelector('.dock')) note('dock présent');
      else requestAnimationFrame(voirDock);
    };
    requestAnimationFrame(voirDock);
  });
  const t0 = Date.now();
  await page.goto(`${URL}/#/`, { waitUntil: 'load' });
  while (Date.now() - t0 < 45000) {
    const fini = await page.evaluate(() => !document.documentElement.classList.contains('entree-en-cours') && !!document.querySelector('.dock'));
    if (fini) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  const chrono = await page.evaluate(() => window.__chrono);
  for (const [t, q] of chrono) console.log(String(t).padStart(6), 'ms ', q);
  console.log('fin :', Date.now() - t0, 'ms depuis le goto');
} finally {
  await nav.disconnect();
  await chrome.kill();
}
