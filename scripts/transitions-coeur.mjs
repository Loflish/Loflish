// Les transitions de la constellation, répétées N fois : médiane des images perdues (> 33 ms), pour juger
// un réglage malgré le bruit d'une mesure unique. Vrai Chrome. Usage : DPR=2 N=3 node scripts/transitions-coeur.mjs [url]
import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';

const URL = process.argv[2] ?? 'http://127.0.0.1:4174';
const DPR = Number(process.env.DPR ?? 2);
const N = Number(process.env.N ?? 3);
const W = 1920;
const H = 1080;
const chrome = await launch({ chromeFlags: ['--no-sandbox', `--window-size=${W},${H}`] });
const nav = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}`, defaultViewport: null });
const dors = (ms) => new Promise((r) => setTimeout(r, ms));
const resultats = {};

try {
  const page = await nav.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: DPR });
  await page.evaluateOnNewDocument(() => {
    window.__ft = [];
    const loop = (t) => {
      window.__ft.push(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  const texte = (t) => `[...document.querySelectorAll('a, button')].find((e) => e.textContent.trim().startsWith(${JSON.stringify(t)}))`;
  const visible = (sel) => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).opacity > 0.9; })()`;

  async function mesure(nom, action, pret, fenetre = 1400, timeout = 12000) {
    const t0 = await page.evaluate(() => performance.now());
    await action();
    const debut = Date.now();
    while (Date.now() - debut < timeout && !(await page.evaluate(pret))) await dors(40);
    while (Date.now() - debut < fenetre) await dors(40);
    const t1 = await page.evaluate(() => performance.now());
    const s = await page.evaluate(
      ([a, b]) => {
        const ft = window.__ft.filter((t) => t >= a && t <= b);
        const gaps = [];
        for (let i = 1; i < ft.length; i++) gaps.push(ft[i] - ft[i - 1]);
        return { images: gaps.length, perdues: gaps.filter((g) => g > 33).length, max: Math.round(Math.max(0, ...gaps)) };
      },
      [t0, t1],
    );
    (resultats[nom] ??= []).push(s);
  }

  await page.goto(`${URL}/?entree=0#/`, { waitUntil: 'load' });
  await dors(7000);
  for (let i = 0; i < N; i++) {
    await mesure(
      'ouvrir une fiche',
      () => page.evaluate(() => { const e = window.__nmmDebug.engine; const b = e.bubbles.find((x) => { const p = e.screenPos(x.p.id); return p && p.x > 400 && p.x < 1500 && p.y > 200 && p.y < 900; }) ?? e.bubbles[0]; e.select(b.p.id); }),
      `!!${texte('Entrer dans sa mémoire')}`,
    );
    await mesure('fiche → trace (encre)', () => page.evaluate(`${texte('Entrer dans sa mémoire')}.click()`), `${visible('.trace-nav')} && (() => { const c = document.querySelector('canvas.encre'); return !c || c.hidden || Number(getComputedStyle(c).opacity) < 0.05; })()`, 4500);
    await dors(500);
    await mesure('trace → constellation', () => page.evaluate(`${texte('Sa bulle')}.click()`), `location.hash === '#/' && ${visible('.dock')}`, 1800);
    await page.keyboard.press('Escape');
    await dors(900);
    await mesure('recherche : ouverture', () => page.keyboard.press('/'), visible('.search-panel'), 1300);
    await mesure('recherche : fermeture', () => page.keyboard.press('Escape'), `!document.querySelector('.search-panel')`, 1300);
    await mesure('une bulle au hasard', () => page.evaluate(`${texte('Une bulle au hasard')}.click()`), `!!${texte('Entrer dans sa mémoire')}`, 1500);
    await page.keyboard.press('Escape');
    await dors(700);
    await mesure('zoom molette', async () => { await page.mouse.move(W / 2, H / 2); for (let k = 0; k < 5; k++) { await page.mouse.wheel({ deltaY: -120 }); await dors(60); } }, 'true', 1800);
    await mesure('dézoom molette', async () => { for (let k = 0; k < 5; k++) { await page.mouse.wheel({ deltaY: 120 }); await dors(60); } }, 'true', 1800);
    await mesure('page texte → constellation', async () => { await page.evaluate(() => { location.hash = '#/projet'; }); await dors(1800); await page.evaluate(() => { location.hash = '#/'; }); }, `location.hash === '#/' && ${visible('.dock')}`, 1800);
    await dors(800);
  }
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  console.log(`DPR ${DPR}, ${N} répétitions, médianes (images perdues > 33 ms / images ; pire image)`);
  for (const [nom, l] of Object.entries(resultats)) {
    console.log(`${nom.padEnd(30)} ${String(med(l.map((s) => s.perdues))).padStart(3)} / ${String(med(l.map((s) => s.images))).padStart(3)}   max ${med(l.map((s) => s.max))} ms   (${l.map((s) => s.perdues).join(', ')})`);
  }
} finally {
  await nav.disconnect();
  await chrome.kill();
}
