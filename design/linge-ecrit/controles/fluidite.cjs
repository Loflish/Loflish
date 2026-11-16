// Fluidité : pour chaque geste, le délai entre l'action et l'image suivante (ce que mesure l'INP), et les tâches
// longues du fil principal. Processeur ralenti quatre fois, pour imiter un téléphone moyen.
// La peinture animée et les fils sont coupés (?eau=0&fils=0) : sans carte graphique, leur dessin fausserait la
// mesure ; on mesure ici le code du site, pas la carte graphique.
//   node design/linge-ecrit/controles/fluidite.cjs [base] [--json sortie.json]
const { chromium } = require('playwright');
const base = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://127.0.0.1:4174/';
const sortie = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;
const SEUIL = 200; // « bon » selon web.dev/articles/inp

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('nmm:vu', '1'); localStorage.setItem('nmm:visites', '5'); sessionStorage.setItem('nmm:entree-vue', '1'); } catch {}
    window.__mesure = { gestes: [], longues: [] };
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__mesure.gestes.push({ type: e.name, duree: e.duration }); }).observe({ type: 'event', durationThreshold: 16, buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__mesure.longues.push(e.duration); }).observe({ type: 'longtask', buffered: true });
    } catch {}
  });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const va = async (r, t = 2500) => { await p.goto('about:blank'); await p.goto(base + '?entree=0&eau=0&fils=0#/' + r); await p.waitForTimeout(t); };
  const resultats = [];
  const geste = async (nom, f) => {
    await p.evaluate(() => { window.__mesure.gestes.length = 0; window.__mesure.longues.length = 0; });
    try { await f(); } catch (e) { resultats.push({ nom, erreur: String(e).split('\n')[0].slice(0, 90) }); return; }
    await p.waitForTimeout(900);
    const m = await p.evaluate(() => window.__mesure);
    const reponse = Math.round(Math.max(0, ...m.gestes.map((g) => g.duree)));
    const longue = Math.round(Math.max(0, ...m.longues));
    resultats.push({ nom, reponse, longue, nLongues: m.longues.length });
    console.log((reponse > SEUIL ? 'LENT  ' : 'OK    ') + nom.padEnd(52) + String(reponse).padStart(5) + ' ms' + (longue ? `   (tâche la plus longue ${longue} ms, ${m.longues.length} tâches longues)` : ''));
  };

  await va('', 4500);
  await geste('constellation : ouvrir le menu', () => p.locator('.dock-menu').click());
  await geste('constellation : fermer le menu (Échap)', () => p.keyboard.press('Escape'));
  await geste('constellation : ouvrir la recherche', () => p.getByRole('button', { name: 'Rechercher' }).click());
  await geste('recherche : taper une lettre', () => p.locator('.search-panel input[type=search]').pressSequentially('m'));
  await geste('recherche : taper deux lettres de plus', () => p.locator('.search-panel input[type=search]').pressSequentially('er', { delay: 120 }));
  await geste('recherche : choisir un filtre', () => p.locator('.search-panel .chip', { hasText: 'Mémoires' }).click());
  await geste('recherche : fermer (Échap)', () => p.keyboard.press('Escape'));
  await geste('constellation : mettre en pause', () => p.getByRole('button', { name: /pause/i }).click());
  await geste('constellation → Se perdre', () => p.locator('.dock a', { hasText: 'Se perdre' }).click());
  await geste('se perdre : carte suivante', () => p.getByRole('button', { name: /Suivant/ }).click());
  await geste('se perdre : carte suivante (2)', () => p.getByRole('button', { name: /Suivant/ }).click());
  await geste('se perdre → ouvrir la trace', () => p.locator('.perdre-carte .lien-entrer').click());
  await va('trace/sakinah');
  await geste('profil : ouvrir une rubrique', () => p.locator('.fragment').first().click());
  await geste('profil : fermer la rubrique (Échap)', () => p.keyboard.press('Escape'));
  await geste('profil : mode lecture', () => p.getByRole('button', { name: /Lecture/ }).click());
  await geste('profil : tout voir', () => p.getByRole('button', { name: /Tout voir/ }).click());
  await geste('profil : ouvrir une photo', () => p.locator('.medias-rang .media-ouvrir').first().click());
  await geste('profil : fermer la photo (Échap)', () => p.keyboard.press('Escape'));
  await geste('profil → retour au musée', () => p.locator('.trace-nav a, .trace-nav button').first().click());
  await va('creer');
  await geste('créer : choisir « Ma propre trace »', () => p.locator('.choix-item').first().click());
  await geste('créer : continuer', () => p.locator('.etape-actions .bouton').click());
  await geste('créer : taper son adresse', () => p.locator('input[type=email]').pressSequentially('essai@exemple.fr', { delay: 40 }));
  await va('projet');
  await geste('projet → juridique (pied de page)', () => p.locator('.site-footer a', { hasText: 'Juridique' }).click());
  await geste('juridique → compte (menu absent : lien direct)', () => p.evaluate(() => { location.hash = '#/compte'; }));
  await va('oeuvre-commune', 3000);
  await geste('œuvre commune : poser un point', () => p.mouse.click(195, 420));

  const lents = resultats.filter((r) => r.reponse > SEUIL);
  const mesures = resultats.filter((r) => r.reponse !== undefined);
  const tri = mesures.map((r) => r.reponse).sort((a, b) => a - b);
  console.log(`\n${mesures.length} gestes mesurés, ${lents.length} au-dessus de ${SEUIL} ms ; médiane ${tri[tri.length >> 1]} ms, le plus lent ${tri[tri.length - 1]} ms.`);
  for (const r of resultats.filter((x) => x.erreur)) console.log('NON MESURÉ ' + r.nom + ' — ' + r.erreur);
  if (sortie) require('fs').writeFileSync(sortie, JSON.stringify(resultats, null, 1));
  await b.close();
})();
