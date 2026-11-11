// Parcours de non-régression : les mêmes gestes, sur n'importe quelle version du site.
// Usage : node parcours.cjs <base> <largeur>   → une ligne par contrôle, puis le total.
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:4174/';
const W = +(process.argv[3] || 390);
const res = [];
const note = (nom, ok, detail = '') => { res.push({ nom, ok: !!ok }); console.log((ok ? 'OK    ' : 'ÉCHEC ') + nom + (detail ? ' — ' + detail : '')); };
(async () => {
  const b = await chromium.launch();
  const mobile = W < 900;
  const ctx = await b.newContext({ viewport: { width: W, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(() => { try { if (!sessionStorage.getItem('t')) { localStorage.setItem('nmm:vu', '1'); localStorage.setItem('nmm:visites', '5'); sessionStorage.setItem('nmm:entree-vue', '1'); sessionStorage.setItem('t', '1'); } } catch {} });
  const p = await ctx.newPage();
  const erreurs = [];
  p.on('pageerror', (e) => erreurs.push(String(e)));
  const va = async (r, t = 1800) => { await p.goto('about:blank'); await p.goto(base + '?entree=0#/' + r); await p.waitForTimeout(t); };
  const essai = async (nom, f) => { try { const r = await f(); note(nom, r !== false, typeof r === 'string' ? r : ''); } catch (e) { note(nom, false, String(e).split('\n')[0].slice(0, 110)); } };
  const txt = (sel) => p.locator(sel).first().textContent();

  // ——— Explorer
  await va('', 3500);
  await essai('explorer : logo, titre caché, dock', async () => (await p.locator('.explorer-logo .logo img').isVisible()) && (await p.locator('h1.sr-only').count()) === 1 && (await p.locator('.dock').isVisible()));
  await essai('explorer : pause puis reprise (mémorisée)', async () => {
    const bt = p.getByRole('button', { name: 'Mettre en pause' }); await bt.click();
    const m = await p.evaluate(() => localStorage.getItem('nmm:pause'));
    await p.getByRole('button', { name: 'Reprendre le mouvement' }).click();
    return m !== null;
  });
  await essai('explorer : recherche, filtres type / rubrique / années / pays, résultats', async () => {
    await p.getByRole('button', { name: 'Rechercher' }).click();
    await p.locator('.search-panel input[type=search]').fill('mer');
    await p.waitForTimeout(500);
    const n1 = await p.locator('.search-results .result').count();
    await p.locator('.search-panel .chip', { hasText: 'Mémoires' }).click();
    await p.locator('.search-panel .chip', { hasText: 'Souvenirs' }).click();
    const nChips = await p.locator('.search-panel .chip').count();
    const nPays = await p.locator('.search-panel select option').count();
    const live = await txt('.search-results .muted');
    await p.locator('.search-panel .chip').filter({ hasText: /^Toutes$/ }).click();
    await p.locator('.search-panel .chip', { hasText: 'Souvenirs' }).click();
    return n1 > 0 && nChips === 25 && nPays > 3 && /présence|trace|Aucune/.test(live) ? `${n1} résultats, ${nChips} pastilles, ${nPays - 1} pays` : false;
  });
  await essai('explorer : un résultat mène à la bulle (aperçu) ou au profil', async () => {
    await p.locator('.search-results .result').first().click();
    await Promise.race([p.waitForSelector('.apercu', { timeout: 7000 }), p.waitForURL(/#\/trace\//, { timeout: 7000 })]);
    return (await p.locator('.apercu').count()) ? 'aperçu' : 'profil (bulle absente de la constellation réduite)';
  });
  await va('', 3000);
  await essai('explorer : Échap ferme la recherche', async () => { await p.getByRole('button', { name: 'Rechercher' }).click(); await p.locator('.search-panel input[type=search]').press('Escape'); await p.waitForTimeout(300); return (await p.locator('.search-panel').count()) === 0; });
  await essai('explorer : toucher une bulle ouvre son aperçu, « Entrer dans sa mémoire » ouvre le profil', async () => {
    const vp = p.viewportSize();
    for (let i = 0; i < 60 && !(await p.locator('.apercu').count()); i++) { await p.mouse.click(30 + ((i * 97) % (vp.width - 60)), 130 + ((i * 53) % (vp.height - 330))); await p.waitForTimeout(220); }
    if (!(await p.locator('.apercu').count())) return false;
    const nom = await txt('.apercu-nom'); const ferme = await p.locator('.apercu-close').count();
    await p.locator('.apercu .lien-entrer').click(); await p.waitForURL(/#\/trace\//, { timeout: 6000 }); await p.waitForTimeout(600);
    return ferme === 1 && (await txt('h1.trace-nom')) === nom ? `« ${nom} »` : false;
  });
  await va('', 3000);
  await essai('dock : 3 destinations + menu de 5 liens, Échap rend le focus', async () => {
    const n = await p.locator('.dock a.dock-item').count();
    await p.locator('.dock-menu').click();
    const liens = await p.locator('.menu-panel a').allTextContents();
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    const focus = await p.evaluate(() => document.activeElement?.className || '');
    return n === 3 && liens.length === 5 && /dock-menu/.test(focus) ? liens.join(' · ') : false;
  });
  await va('bulle/sakinah', 4500);
  await essai('lien partagé #/bulle/sakinah : aperçu ou profil de Sakinah', async () => ((await p.locator('.apercu-nom').count()) ? /Sakinah/.test(await txt('.apercu-nom')) : /trace\/sakinah/.test(p.url())));
  await va('archives/2026', 3000);
  await essai('archives/2026 : la constellation de l’édition', async () => /édition 2026/.test(await txt('.explorer-edition')));

  // ——— Se perdre
  await va('se-perdre');
  await essai('se perdre : suivant, précédent, flèches du clavier', async () => {
    const a = await txt('.perdre-nom'); const dis = await p.getByRole('button', { name: 'Précédent' }).isDisabled();
    await p.getByRole('button', { name: 'Suivant' }).click(); await p.waitForTimeout(400);
    const c = await txt('.perdre-nom');
    await p.getByRole('button', { name: 'Précédent' }).click(); await p.waitForTimeout(400);
    const d = await txt('.perdre-nom');
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400);
    const e = await txt('.perdre-nom');
    return dis && d === a && e === c;
  });
  await essai('se perdre : glisser la carte passe à la suivante', async () => {
    const a = await txt('.perdre-nom'); const bx = await p.locator('.perdre-carte').boundingBox();
    const y = bx.y + bx.height * 0.45, x = bx.x + bx.width * 0.7;
    await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x - 60, y, { steps: 4 }); await p.mouse.move(x - 150, y, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(500);
    return (await txt('.perdre-nom')) !== a || 'même nom tiré (rare)';
  });
  await essai('se perdre : signaler (4 motifs), partager, ouvrir la trace', async () => {
    await p.locator('.perdre-signaler').click(); await p.waitForSelector('.salle');
    const motifs = await p.locator('.salle input[type=radio]').count();
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const part = await p.locator('.perdre-actions .partager button, .perdre-actions button', { hasText: 'Partager' }).count();
    await p.locator('.perdre-carte .lien-entrer').click(); await p.waitForTimeout(900);
    return motifs === 4 && part >= 1 && /#\/trace\//.test(p.url());
  });

  // ——— Profil
  await va('trace/sakinah', 2500);
  await essai('profil : nom, cartel (3), 4 questions, 18 rubriques, médias', async () => {
    const q = await p.locator('.question').count(); const f = await p.locator('.fragment').count(); const dl = await p.locator('.trace-meta > div').count();
    const m = await p.locator('.medias-rang .media').count();
    return (await txt('h1.trace-nom')) === 'Sakinah' && q === 4 && f === 18 && dl === 3 && m > 0 ? `${m} médias montrés` : `q${q} f${f} dl${dl} m${m}`.length && false;
  });
  await essai('profil : vue visiteur / vue auteur', async () => {
    const v = p.getByRole('radio', { name: 'Vue visiteur' }); const au = p.getByRole('radio', { name: 'Vue auteur' });
    const a0 = await au.getAttribute('aria-checked'); await v.click(); await p.waitForTimeout(300);
    const v1 = await v.getAttribute('aria-checked'); await au.click(); await p.waitForTimeout(300);
    return a0 === 'true' && v1 === 'true' && (await au.getAttribute('aria-checked')) === 'true';
  });
  await essai('profil : une rubrique s’ouvre en salle (fragments, cartels), Échap la ferme', async () => {
    await p.locator('.fragments-grid:not(.fragments-sens) .fragment').first().click(); await p.waitForSelector('.salle');
    const el = await p.locator('.salle .element').count(); const titre = await txt('.salle-titre');
    const meta = await p.locator('.salle .element-meta').count();
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    return el > 0 && meta > 0 && (await p.locator('.salle').count()) === 0 ? `« ${titre} » : ${el} fragments` : false;
  });
  await essai('profil : un sens s’ouvre aussi', async () => { await p.locator('.fragments-sens .fragment').nth(2).click(); await p.waitForSelector('.salle'); const n = await p.locator('.salle .element').count(); await p.locator('.salle-entete button').click(); await p.waitForTimeout(300); return n > 0; });
  await essai('profil : visionneuse de média, « Voir tout »', async () => {
    await p.locator('.medias-rang .media-ouvrir').first().click(); await p.waitForSelector('.media-vue');
    const t = await txt('.media-vue-titre'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    const ferme = (await p.locator('.media-vue').count()) === 0;
    await p.locator('.medias .lien-discret, .bloc .lien-discret', { hasText: 'Voir tout' }).first().click(); await p.waitForSelector('.salle');
    const n = await p.locator('.salle .media').count(); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    return ferme && n > 3 ? `« ${t.trim()} », ${n} médias dans la salle` : false;
  });
  await essai('profil : partager copie le lien', async () => { await p.locator('.trace-nav .partager button').first().click(); await p.waitForTimeout(400); const t = await p.locator('.trace-nav .partager').textContent(); const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => '')); return /copié/i.test(t) || /bulle\/sakinah|\/b\/sakinah/.test(clip) || (await p.locator('.partager-manuel').count()) > 0; });
  await va('trace/jeannot', 2500);
  await essai('mémoire (Jeannot) : provenance, citation, rubriques vides repliées, signaler', async () => {
    const prov = await txt('.provenance-qui'); const cit = await p.locator('.citation').count(); const vides = await p.locator('.fragments-vides summary').count();
    if (vides) await p.locator('.fragments-vides summary').click();
    const liste = await p.locator('.fragments-vides-liste li').count();
    await p.getByRole('button', { name: 'Signaler' }).click(); await p.waitForSelector('.salle'); const r = await p.locator('.salle input[type=radio]').count(); await p.keyboard.press('Escape');
    return /Léa/.test(prov) && cit === 1 && r === 4 ? `${liste} rubriques vides repliées` : false;
  });
  await va('trace/inconnue-xyz', 1500);
  await essai('profil introuvable : message et retour', async () => /n’existe pas/.test(await txt('.introuvable-texte')));

  // ——— Pages de texte
  await va('projet');
  await essai('le projet : titres des sections', async () => { const h = await p.locator('main h2').allTextContents(); return h.length >= 5 ? h.join(' · ') : false; });
  await va('ressources');
  await essai('ressources : findahelpline, 112 / 911, 6 lignes directes', async () => { await p.locator('.lignes-directes summary').click(); const n = await p.locator('.lignes li').count(); const tel = await p.locator('.ligne-num[href^="tel:"]').count(); return (await p.locator('a.aide-monde[href*="findahelpline"]').count()) === 1 && n === 6 && tel === 6; });
  await va('juridique');
  await essai('juridique : 13 sections', async () => (await p.locator('.juridique-liste > li').count()) === 13);
  await va('soutenir');
  await essai('soutenir : 3 volets', async () => (await p.locator('.trois-colonnes > *').count()) === 3);
  await va('archives');
  await essai('archives : édition 2026, deux chemins', async () => /2026/.test(await txt('.frise-date')) && (await p.locator('.frise-liens a').count()) === 2);

  // ——— Créer ma trace, de bout en bout
  await va('creer');
  let idTrace = '';
  await essai('créer : 7 étapes, brouillon, compteurs, limites, publication', async () => {
    const etape = () => txt('.etape-compteur');
    const suite = p.locator('.etape-actions .bouton');
    const e0 = await etape(); const dis0 = await suite.isDisabled();
    await p.locator('.choix-item').first().click(); await suite.click(); await p.waitForTimeout(400);
    await p.locator('input[type=email]').fill('essai@exemple.fr'); const dis1 = await suite.isDisabled(); await p.locator('.check input').check(); await suite.click(); await p.waitForTimeout(600);
    await p.locator('.etape .field input').first().fill('Camille du test');
    const m1 = await txt('.bulle-numero'); await p.locator('.bulle-fleche').last().click(); await p.waitForTimeout(300); const m2 = await txt('.bulle-numero');
    const couleurs = await p.locator('.couleur').count(); await p.locator('.couleur').nth(8).click();
    await p.locator('.etape select').selectOption({ index: 6 });
    await p.waitForTimeout(700); const brouillon = await p.evaluate(() => !!localStorage.getItem('nmm:brouillon'));
    await suite.click(); await p.waitForTimeout(600);
    const ta = p.locator('.question-champ textarea'); const nq = await ta.count();
    const max = await ta.evaluateAll((els) => els.map((e) => e.maxLength).join('/'));
    const rep = ['Sois douce avec toi-même.', 'Merci pour tout ce que tu as porté.', 'Prenez le temps de vous regarder.', 'Une vie de jardins et de lettres.'];
    for (let i = 0; i < nq; i++) await ta.nth(i).fill(rep[i]);
    const cpt = await p.locator('.compteur').first().textContent();
    await suite.click(); await p.waitForTimeout(600); const apercuNom = await p.locator('.apercu-demo').textContent();
    await suite.click(); await p.waitForTimeout(600);
    await suite.click(); await p.waitForTimeout(600); const e6 = await etape();
    const dis6 = await suite.isDisabled(); await p.locator('.etape .check input').first().check(); await suite.click();
    await p.waitForSelector('.publication-texte', { timeout: 4000 }); const pub = await txt('.publication-texte');
    await p.waitForURL(/#\/trace\//, { timeout: 9000 }); idTrace = p.url().split('/trace/')[1];
    const ok = /1 sur 7/.test(e0) && dis0 && dis1 && m1 !== m2 && couleurs === 30 && brouillon && nq === 4 && max === '1200/1200/1200/200' && /25 \/ 1200/.test(cpt) && /Camille/.test(apercuNom) && /7 sur 7/.test(e6) && dis6 && /rejoint/.test(pub);
    return ok ? `30 couleurs, matière « ${m1.trim()} » → « ${m2.trim()} », limites ${max}` : [e0, dis0, dis1, m1, m2, couleurs, brouillon, nq, max, cpt, e6, dis6, pub].join(' | ') && false;
  });
  await essai('ma nouvelle trace : scellée, je dépose un fragment (confirmation en deux temps)', async () => {
    await p.waitForTimeout(800);
    const nom = await txt('h1.trace-nom'); const scelle = await p.locator('.trace-bandeau-scellee').count();
    await p.locator('.fragments-grid:not(.fragments-sens) .fragment').first().click(); await p.waitForSelector('.salle .editeur');
    const champs = await p.locator('.salle .editeur input:not([type=file])').count();
    await p.locator('.salle .editeur input:not([type=file])').first().fill('La plage de juin');
    await p.locator('.salle .editeur textarea').fill('La photo de la plage, un dimanche de juin.');
    await p.locator('.salle .editeur-actions .bouton').click(); await p.waitForTimeout(400);
    const avert = await p.locator('.salle .editeur-scelle').count();
    await p.locator('.salle .editeur-actions .bouton').first().click();
    await p.waitForTimeout(900); const n = await p.locator('.salle .element').count(); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    return /Camille/.test(nom) && scelle === 1 && avert === 1 && n === 1 ? `${champs} champs, 1 fragment déposé et scellé` : false;
  });
  await essai('ma nouvelle trace : 4 choix de confidentialité, un clic les change', async () => {
    const sw = p.locator('.parametres [role=switch]'); const n = await sw.count(); const a = await sw.first().isChecked();
    await sw.first().click({ force: true }); await p.waitForTimeout(250); const c = await sw.first().isChecked();
    return n === 4 && a !== c;
  });
  await va('compte');
  await essai('compte : mes traces, 18 rubriques à compléter, adresse, données', async () => { const n = await p.locator('.ma-trace-rubrique').count(); const nom = await txt('.ma-trace-nom'); const h = await p.locator('main h2').allTextContents(); return n === 18 && /Camille/.test(nom) ? h.join(' · ') : `${n} ${nom}`.length && false; });
  await va('', 3000);
  await essai('explorer : « Retrouver ma bulle » apparaît après la création', async () => (await p.getByRole('button', { name: 'Retrouver ma bulle' }).count()) === 1);

  // ——— L'œuvre commune
  await va('oeuvre-commune', 2500);
  await essai('œuvre commune : poser un trait en deux clics, le coudre', async () => {
    const c = await p.locator('.oeuvre-dessus').boundingBox();
    const x = c.x + c.width * (mobile ? 0.5 : 0.62), y = c.y + c.height * 0.2;
    const t0 = await txt('.oeuvre-consigne');
    await p.mouse.click(x, y); await p.waitForTimeout(400); const t1 = await txt('.oeuvre-consigne');
    await p.mouse.click(x + 40, y + 30); await p.waitForTimeout(400);
    const boutons = await p.locator('.oeuvre-actions button').allTextContents();
    await p.locator('.oeuvre-actions .bouton').first().click(); await p.waitForTimeout(4500);
    const garde = await p.evaluate(() => !!localStorage.getItem('nmm:mon-trait'));
    return t0 !== t1 && boutons.length >= 2 && garde ? boutons.join(' / ') : `${t0} | ${t1} | ${boutons} | ${garde}`.length && false;
  });

  // ——— socle
  await essai('aucune erreur JavaScript pendant tout le parcours', async () => erreurs.length === 0 || erreurs.slice(0, 2).join(' ; ').length && false);
  await b.close();
  const ok = res.filter((r) => r.ok).length;
  console.log(`\nTOTAL ${W} px : ${ok} / ${res.length} contrôles réussis`);
  process.exit(ok === res.length ? 0 : 1);
})();
