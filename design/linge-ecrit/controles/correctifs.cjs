// Les constats de la relecture, rejoués sur le vrai site. node correctifs.cjs <base>
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:4174/';
let echecs = 0;
const journal = console.log;
console.log = (...a) => { if (String(a[0]).startsWith('ÉCHEC')) echecs++; journal(...a); };
const init = () => { try { localStorage.setItem('nmm:vu', '1'); localStorage.setItem('nmm:visites', '5'); sessionStorage.setItem('nmm:entree-vue', '1'); } catch {} };
(async () => {
  const b = await chromium.launch();
  const ouvrir = async (w, h, r, mobile = true) => { const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile }); await c.addInitScript(init); const p = await c.newPage(); await p.goto(base + '?entree=0#/' + r); await p.waitForTimeout(r === '' ? 3500 : 2200); return p; };
  // 1. petit écran : « Ouvrir la trace » reste au-dessus du ruban, sur 12 cartes
  let p = await ouvrir(375, 553, 'se-perdre'); let pire = 1e9;
  for (let i = 0; i < 12; i++) { const m = await p.evaluate(() => { const l = document.querySelector('.perdre-carte .lien-entrer').getBoundingClientRect(); const a = document.querySelector('.perdre-actions').getBoundingClientRect(); return a.top - l.bottom; }); pire = Math.min(pire, m); await p.getByRole('button', { name: 'Suivant' }).click(); await p.waitForTimeout(250); }
  console.log((pire >= 0 ? 'OK    ' : 'ÉCHEC ') + `1. 375×553 : « Ouvrir la trace » au-dessus des boutons (marge la plus faible ${Math.round(pire)} px)`);
  // 2. la carte suit le doigt
  p = await ouvrir(390, 844, 'se-perdre'); await p.waitForTimeout(900);
  const bx = await p.locator('.perdre-carte').boundingBox(); const x = bx.x + bx.width * 0.7, y = bx.y + bx.height * 0.45;
  await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x - 50, y, { steps: 5 }); await p.waitForTimeout(700);
  const dep = await p.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.perdre-carte')).transform).m41); await p.mouse.up();
  console.log((dep < -10 ? 'OK    ' : 'ÉCHEC ') + `2. la carte suit le doigt pendant le glisser (déplacement ${Math.round(dep)} px)`);
  // 3. aperçu ouvert puis menu : les 6 liens se touchent
  p = await ouvrir(375, 700, '');
  for (let i = 0; i < 60 && !(await p.locator('.apercu').count()); i++) { await p.mouse.click(30 + ((i * 97) % 315), 130 + ((i * 53) % 380)); await p.waitForTimeout(220); }
  const ap = await p.locator('.apercu').count(); await p.locator('.dock-menu').click(); await p.waitForTimeout(500);
  const libres = await p.evaluate(() => [...document.querySelectorAll('.menu-panel a')].filter((a) => { const r = a.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return a.contains(e); }).length);
  console.log((ap && libres === 5 ? 'OK    ' : 'ÉCHEC ') + `3. aperçu ouvert puis menu : ${libres} liens sur 5 accessibles au toucher (aperçu ouvert : ${ap})`);
  // 4. très grand écran : le voile de la salle couvre tout
  p = await ouvrir(1920, 1000, 'trace/sakinah', false); await p.locator('.fragments-grid:not(.fragments-sens) .fragment').first().click(); await p.waitForTimeout(900);
  const v = await p.evaluate(() => { const r = document.querySelector('.salle-scrim').getBoundingClientRect(); const s = document.querySelector('.salle').getBoundingClientRect(); return [r.left, r.width, innerWidth - s.right]; });
  console.log((v[0] === 0 && v[1] === 1920 && Math.abs(v[2]) < 1 ? 'OK    ' : 'ÉCHEC ') + `4. 1920 px : le voile couvre ${v[1]} px, le pan touche le bord (écart ${v[2]} px)`);
  // 7. focus clavier d'un bouton survolé
  p = await ouvrir(1280, 800, 'creer', false); await p.locator('.choix-item').first().click(); const bt = p.locator('.etape-actions .bouton'); await bt.hover(); await p.keyboard.press('Tab'); await bt.focus(); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(500);
  const o = await bt.evaluate((e) => [e.matches(':focus-visible'), getComputedStyle(e).outlineColor, getComputedStyle(e).outlineOffset]);
  console.log((o[0] && !/244, 239, 230/.test(o[1]) ? 'OK    ' : 'ÉCHEC ') + `7. bouton survolé et au focus clavier : anneau ${o[1]}, décalage ${o[2]}`);
  // 12. archives à 320 px : la ligne d'édition ne passe pas sous les boutons
  p = await ouvrir(320, 640, 'archives/2026');
  const e = await p.evaluate(() => { const l = document.querySelector('.explorer-edition').getBoundingClientRect(); const a = document.querySelector('.explorer-actions').getBoundingClientRect(); return [Math.round(l.right), Math.round(a.left)]; });
  console.log((e[0] <= e[1] ? 'OK    ' : 'ÉCHEC ') + `12. 320 px, édition archivée : la ligne finit à ${e[0]} px, les boutons commencent à ${e[1]} px`);
  await b.close();
  process.exit(echecs ? 1 : 0);
})();
