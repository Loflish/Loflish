// Mesure chaque transition du site : durée jusqu'à l'écran prêt, images perdues (> 33 ms) pendant la transition,
// plus longue image. Vrai Chrome, écran dense (DPR 2) pour juger la netteté sur les captures.
// Usage : node scripts/transitions.mjs [dossier de sortie] [url]
import { mkdirSync, writeFileSync } from 'node:fs';
import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';

const D = process.argv[2] ?? 'C:/Users/tombl/Desktop/Claude Code/reports/Revue 2026-11-06/transitions';
const URL = process.argv[3] ?? 'http://127.0.0.1:5174';
const Q = process.env.Q ?? '';
const DPR = Number(process.env.DPR ?? 2);
const W = Number(process.env.W ?? 1920);
const H = Number(process.env.H ?? 1080);
mkdirSync(D, { recursive: true });
const chrome = await launch({ chromeFlags: ['--no-sandbox', `--window-size=${W},${H}`] });
const nav = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}`, defaultViewport: null });
const dors = (ms) => new Promise((r) => setTimeout(r, ms));
const lignes = [];

try {
  const page = await nav.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: DPR });
  // un relevé des images rendues, dès le chargement
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

  /** Lance une action, attend la condition « prêt », relève la durée et les images perdues. */
  async function mesure(nom, action, pret, { timeout = 15000, capture = true, fenetre = 1200, trace = false } = {}) {
    if (trace) await page.tracing.start({ path: `${D}/trace-${nom.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.json`, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink.user_timing'] });
    const t0 = await page.evaluate(() => performance.now());
    await action();
    const debut = Date.now();
    let ok = false;
    let tPret = 0;
    while (Date.now() - debut < timeout) {
      if (await page.evaluate(pret)) {
        ok = true;
        tPret = await page.evaluate(() => performance.now());
        break;
      }
      await dors(40);
    }
    // on observe au moins « fenetre » ms : les images perdues d'une animation qui continue après l'écran prêt comptent aussi
    while (Date.now() - debut < fenetre) await dors(40);
    const t1 = await page.evaluate(() => performance.now());
    if (trace) await page.tracing.stop();
    const stats = await page.evaluate(
      ([a, b]) => {
        const ft = window.__ft.filter((t) => t >= a && t <= b);
        const gaps = [];
        for (let i = 1; i < ft.length; i++) gaps.push(ft[i] - ft[i - 1]);
        const longues = gaps.filter((g) => g > 33).length;
        const max = gaps.length ? Math.max(...gaps) : 0;
        return { images: gaps.length, perdues: longues, max: Math.round(max) };
      },
      [t0, t1],
    );
    const ligne = { transition: nom, prete: ok, duree_ms: Math.round((tPret || t1) - t0), observe_ms: Math.round(t1 - t0), ...stats };
    lignes.push(ligne);
    console.log(`${nom.padEnd(44)} ${ok ? '' : 'PAS PRÊT '}prêt à ${ligne.duree_ms} ms ; sur ${ligne.observe_ms} ms : ${stats.perdues} images > 33 ms sur ${stats.images} (max ${stats.max} ms)`);
    if (capture) await page.screenshot({ path: `${D}/${lignes.length.toString().padStart(2, '0')}-${nom.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.png` });
    return ligne;
  }

  // 0. chargement à froid, sans l'entrée
  await page.goto(`${URL}/?entree=0${Q}#/`, { waitUntil: 'load' });
  await dors(6000);
  await page.evaluate(() => (window.__ft = []));

  // 1. clic sur une bulle → fiche
  await mesure(
    'constellation → fiche (clic sur une bulle)',
    () => page.evaluate(() => { const e = window.__nmmDebug.engine; const b = e.bubbles.find((x) => { const p = e.screenPos(x.p.id); return p && p.x > 400 && p.x < 1500 && p.y > 200 && p.y < 900; }) ?? e.bubbles[0]; e.select(b.p.id); }),
    `!!${texte('Entrer dans sa mémoire')}`,
  );
  await dors(800);
  // 2. fiche → page de la trace (encre)
  await mesure('fiche → trace (encre)', () => page.evaluate(`${texte('Entrer dans sa mémoire')}.click()`), `${visible('.trace-nav')} && (() => { const c = document.querySelector('canvas.encre'); return !c || c.hidden || Number(getComputedStyle(c).opacity) < 0.05; })()`, { timeout: 12000, fenetre: 6500, trace: true });
  await dors(600);
  // 3. trace → constellation (Sa bulle)
  await mesure('trace → constellation (Sa bulle)', () => page.evaluate(`${texte('Sa bulle')}.click()`), `location.hash === '#/' && ${visible('.explorer-actions, .dock')}`, { fenetre: 1600, trace: true });
  await dors(1500);
  // 4. constellation → Se perdre (dock)
  await mesure('constellation → Se perdre (dock)', () => page.evaluate(`${texte('Se perdre')}.click()`), visible('.perdre-carte'));
  await dors(600);
  // 5. Se perdre : suivant
  await mesure('Se perdre : bulle suivante', () => page.keyboard.press('ArrowRight'), 'true', { timeout: 200 });
  await dors(1200);
  // 6. Se perdre → Le projet (menu)
  await mesure('menu : ouverture', () => page.evaluate(`${texte('Menu')}.click()`), `!!${texte('Le projet')}`);
  await mesure('menu → Le projet', () => page.evaluate(`${texte('Le projet')}.click()`), visible('.page-titre'));
  await dors(600);
  // 7. Le projet → Créer (dock)
  await mesure('Le projet → Créer (adresse)', () => page.evaluate(() => { location.hash = '#/creer'; }), visible('.etape-titre, .creer'));
  await dors(600);
  // 8. Créer : étape 1 → 2
  await mesure('Créer : choisir → étape suivante', async () => { await page.evaluate(() => { const e = [...document.querySelectorAll('button, label, [role=radio]')].find((x) => /Ma propre trace/.test(x.textContent)); e?.click(); }); await dors(150); await page.evaluate(`${texte('Continuer')}.click()`); }, `!!document.querySelector('input[type=email]')`);
  await dors(400);
  // 9. Créer → retour au musée
  await mesure('Créer → constellation (Retour au musée)', () => page.evaluate(`${texte('Retour au musée')}.click()`), `location.hash === '#/' && ${visible('.dock')}`);
  await dors(1500);
  // 10. recherche : ouverture et fermeture
  await mesure('recherche : ouverture (/)', () => page.keyboard.press('/'), visible('.search-panel'));
  await mesure('recherche : fermeture (Échap)', () => page.keyboard.press('Escape'), `!document.querySelector('.search-panel')`);
  // 11. œuvre commune
  await mesure('constellation → œuvre commune (dock)', () => page.evaluate(`${texte('L’œuvre commune')}.click()`), visible('.oeuvre'));
  await dors(600);
  await mesure('œuvre commune → constellation', () => page.evaluate(() => { const e = [...document.querySelectorAll('a')].find((x) => /Explorer|Retour au musée|constellation/i.test(x.textContent)); if (e) e.click(); else location.hash = '#/'; }), `location.hash === '#/' && ${visible('.dock')}`, { fenetre: 1600 });
  await dors(1200);
  // 12. une bulle au hasard
  await mesure('une bulle au hasard', () => page.evaluate(`${texte('Une bulle au hasard')}.click()`), `!!${texte('Entrer dans sa mémoire')}`);
  await page.keyboard.press('Escape');
  await dors(500);
  // 13. zoom molette
  await mesure('zoom molette (5 crans)', async () => { await page.mouse.move(W / 2, H / 2); for (let i = 0; i < 5; i++) { await page.mouse.wheel({ deltaY: -120 }); await dors(60); } }, 'true', { timeout: 900 });
  await dors(800);
  await page.screenshot({ path: `${D}/zoom-dpr${DPR}.png` });
  // gros plan sur une bulle au zoom, pour la netteté
  const clip = await page.evaluate(() => { const e = window.__nmmDebug.engine; const b = e.bubbles.map((x) => ({ id: x.p.id, p: e.screenPos(x.p.id) })).filter((x) => x.p && x.p.x > 300 && x.p.x < 1600 && x.p.y > 200 && x.p.y < 900).sort((a, b) => b.p.r - a.p.r)[0]; return b ? { x: b.p.x - b.p.r * 1.3, y: b.p.y - b.p.r * 1.3, width: b.p.r * 2.6, height: b.p.r * 2.6 } : null; });
  if (clip) await page.screenshot({ path: `${D}/zoom-bulle-dpr${DPR}.png`, clip });

  // 14. l'écran d'entrée complet, à froid (nouvel onglet)
  const p2 = await nav.newPage();
  await p2.setViewport({ width: W, height: H, deviceScaleFactor: DPR });
  await p2.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch {} });
  const t0 = Date.now();
  await p2.goto(`${URL}/#/`, { waitUntil: 'load' });
  let pret = false;
  while (Date.now() - t0 < 40000) {
    if (await p2.evaluate(() => !document.documentElement.classList.contains('entree-en-cours') && !!document.querySelector('.dock'))) { pret = true; break; }
    await dors(100);
  }
  const entree = { transition: 'entrée complète (à froid)', prete: pret, duree_ms: Date.now() - t0 };
  lignes.push(entree);
  console.log(`${entree.transition.padEnd(44)} ${entree.duree_ms} ms`);
  await p2.screenshot({ path: `${D}/entree-finie.png` });
  await p2.close();

  writeFileSync(`${D}/mesures-dpr${DPR}.json`, JSON.stringify(lignes, null, 2));
  // les tâches longues de la transition d'encre, par nature
  try {
    const { readFileSync } = await import('node:fs');
    const { readdirSync } = await import('node:fs');
    for (const fichier of readdirSync(D).filter((f) => f.startsWith('trace-') && f.endsWith('.json'))) {
    console.log('— ' + fichier);
    const ev = JSON.parse(readFileSync(`${D}/${fichier}`, 'utf8')).traceEvents;
    const longues = ev.filter((e) => e.ph === 'X' && e.dur > 20000 && /RunTask|FunctionCall|EvaluateScript|Decode|Layout|Paint|UpdateLayoutTree|GC|v8\.compile|Parse/.test(e.name));
    const parNom = {};
    for (const e of longues) {
      const cle = e.name + (e.args?.data?.url ? ' ' + e.args.data.url.replace(/.*\//, '') : '') + (e.args?.data?.functionName ? ' ' + e.args.data.functionName : '');
      (parNom[cle] ??= { n: 0, ms: 0, max: 0 }).n++;
      parNom[cle].ms += e.dur / 1000;
      parNom[cle].max = Math.max(parNom[cle].max, e.dur / 1000);
    }
    for (const [k, v] of Object.entries(parNom).sort((a, b) => b[1].ms - a[1].ms).slice(0, 10)) console.log(`   ${k.padEnd(60)} ${v.n} × , ${Math.round(v.ms)} ms au total, max ${Math.round(v.max)} ms`);
    const pires = longues.sort((a, b) => b.dur - a.dur).slice(0, 5).map((e) => `${Math.round(e.dur / 1000)} ms ${e.name} ${e.args?.data?.url?.replace(/.*\//, '') ?? ''} ${e.args?.data?.functionName ?? ''}`);
    console.log('   pires : ' + pires.join(' | '));
    }
  } catch (e) {
    console.log('analyse de la trace impossible :', String(e).slice(0, 120));
  }
} finally {
  await nav.disconnect();
  await chrome.kill();
}
