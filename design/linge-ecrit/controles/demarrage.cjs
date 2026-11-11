// Démarrage : ce que chaque page télécharge, et le moteur créé seulement quand la constellation est montrée.
// Usage : node demarrage.cjs <base>   (par défaut http://127.0.0.1:4174/)
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:4174/';
let ok = 0, total = 0;
const note = (nom, bon, detail = '') => { total++; if (bon) ok++; console.log((bon ? 'OK    ' : 'ÉCHEC ') + nom + (detail ? ' — ' + detail : '')); };
(async () => {
  const b = await chromium.launch();
  const ouvrir = async (r) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await c.addInitScript(() => { try { localStorage.setItem('nmm:vu', '1'); localStorage.setItem('nmm:visites', '5'); sessionStorage.setItem('nmm:entree-vue', '1'); } catch {} });
    const p = await c.newPage(); const req = []; const err = [];
    p.on('request', (q) => req.push(q.url())); p.on('pageerror', (e) => err.push(String(e)));
    await p.goto(base + '?entree=0#/' + r); await p.waitForTimeout(3500);
    return { p, req, err };
  };
  const compte = (req, motif) => req.filter((u) => motif.test(u)).length;
  for (const r of ['projet', 'trace/sakinah', 'creer', 'compte']) {
    const { p, req, err } = await ouvrir(r);
    const moteur = await p.evaluate(() => !!(window.__nmmDebug && window.__nmmDebug.engine));
    const t = compte(req, /hd\/taches\//), f = compte(req, /fond-feutre|fond-(16x9|9x16)\.webp/), e = compte(req, /hd\/encre\./);
    note(`${r} : ni moteur, ni peinture de la constellation, ni encre`, !moteur && f === 0 && e === 0 && t <= 2 && err.length === 0, `taches ${t}, peinture ${f}, encre ${e}, moteur ${moteur}`);
    await p.context().close();
  }
  // arriver par un profil, puis aller à la constellation : le moteur se crée et tout répond
  {
    const { p, req, err } = await ouvrir('trace/sakinah');
    await p.locator('.trace-nav a', { hasText: 'Retour au musée' }).click(); await p.waitForTimeout(4000);
    const etat = await p.evaluate(() => ({ moteur: !!(window.__nmmDebug && window.__nmmDebug.engine), mode: document.querySelector('.backdrop').className, eau: !!document.querySelector('.fond-eau') }));
    const vp = p.viewportSize();
    for (let i = 0; i < 60 && !(await p.locator('.apercu').count()); i++) { await p.mouse.click(30 + ((i * 97) % (vp.width - 60)), 130 + ((i * 53) % (vp.height - 330))); await p.waitForTimeout(220); }
    const apercu = await p.locator('.apercu').count();
    await p.getByRole('button', { name: 'Rechercher' }).click(); await p.locator('.search-panel input[type=search]').fill('mer'); await p.waitForTimeout(600);
    const res = await p.locator('.search-results .result').count();
    note('profil → constellation : moteur créé, bulles cliquables, recherche', etat.moteur && /mode-explore/.test(etat.mode) && apercu === 1 && res > 0 && compte(req, /hd\/taches\//) >= 20 && err.length === 0, `aperçu ${apercu}, ${res} résultats, ${compte(req, /hd\/taches\//)} taches chargées alors`);
    await p.context().close();
  }
  // arriver par la constellation : rien ne change
  {
    const { p, req, err } = await ouvrir('');
    const moteur = await p.evaluate(() => !!(window.__nmmDebug && window.__nmmDebug.engine));
    note('constellation : moteur, peinture préchargée, taches', moteur && compte(req, /fond-feutre/) >= 1 && compte(req, /hd\/taches\//) >= 20 && err.length === 0, `peinture ${compte(req, /fond-feutre/)}, taches ${compte(req, /hd\/taches\//)}`);
    // puis un profil, puis retour : la constellation revient au même endroit, sans se recréer
    await p.evaluate(() => (window.__nmmDebug.engine.__temoin = 1));
    await p.locator('.dock a', { hasText: 'Se perdre' }).click(); await p.waitForTimeout(900);
    await p.locator('.dock a', { hasText: 'Explorer' }).click(); await p.waitForTimeout(1500);
    note('constellation → Se perdre → constellation : le même moteur, jamais recréé', await p.evaluate(() => window.__nmmDebug.engine.__temoin === 1));
    await p.context().close();
  }
  // créer une trace en partant d'une page de texte : la bulle rejoint la constellation créée ensuite
  await b.close();
  console.log(`\nTOTAL démarrage : ${ok} / ${total}`);
  process.exit(ok === total ? 0 : 1);
})();
