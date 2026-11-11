// Parité des contenus : le texte de chaque page (textContent, insensible au CSS), ses liens, ses contrôles, ses titres.
//   node textes.cjs                 compare le site servi à la référence enregistrée (textes-reference.json)
//   node textes.cjs --ecrire        enregistre la référence : à faire après un changement de texte VOULU
//   node textes.cjs --comparer <ancienne adresse> <nouvelle adresse>   compare deux versions servies
// Adresse du site : variable NMM_BASE, sinon http://127.0.0.1:4174/
const { chromium } = require('playwright');
const routes = ['', 'trace/sakinah', 'trace/jeannot', 'creer', 'projet', 'ressources', 'soutenir', 'juridique', 'archives', 'oeuvre-commune', 'compte', 'trace/inconnue'];
const lire = async (ctx, base) => {
  const p = await ctx.newPage(); const o = {};
  for (const r of routes) {
    await p.goto('about:blank'); await p.goto(base + '?entree=0#/' + r); await p.waitForTimeout(r === '' ? 3000 : 1600);
    // la création enregistre son brouillon après une demi-seconde : attendre l'état stable
    if (r === 'creer') await p.waitForSelector('.brouillon.is-saved', { timeout: 5000 }).catch(() => {});
    o[r || 'explorer'] = await p.evaluate(() => {
      // tout déplier : les contenus repliés comptent aussi
      document.querySelectorAll('details').forEach((d) => (d.open = true));
      const t = (document.querySelector('#contenu')?.textContent || '').replace(/\s+/g, ' ').trim();
      const liens = [...document.querySelectorAll('#contenu a[href]')].map((a) => a.getAttribute('href')).sort();
      const controles = document.querySelectorAll('#contenu a, #contenu button, #contenu input, #contenu select, #contenu textarea, #contenu summary').length;
      const titres = [...document.querySelectorAll('#contenu h1, #contenu h2, #contenu h3')].map((h) => h.tagName + ':' + h.textContent.trim().replace(/\s+/g, ' '));
      const aria = [...document.querySelectorAll('#contenu [aria-label], #contenu [role], #contenu [aria-live]')].map((e) => [e.getAttribute('role'), e.getAttribute('aria-label'), e.getAttribute('aria-live')].join('|')).sort();
      return { t, liens, controles, titres, aria };
    });
  }
  await p.close(); return o;
};
const fs = require('fs'); const path = require('path');
const REF = path.join(__dirname, 'textes-reference.json');
const BASE = process.env.NMM_BASE || 'http://127.0.0.1:4174/';
(async () => {
  const b = await chromium.launch();
  const mk = (W) => b.newContext({ viewport: { width: W, height: 900 }, isMobile: W < 900, hasTouch: W < 900 }).then(async (c) => { await c.addInitScript(() => { try { localStorage.setItem('nmm:vu', '1'); localStorage.setItem('nmm:visites', '5'); sessionStorage.setItem('nmm:entree-vue', '1'); } catch {} }); return c; });
  const mode = process.argv[2];
  const tout = async (base) => { const o = {}; for (const W of [390, 1440]) o[W] = await lire(await mk(W), base); return o; };
  if (mode === '--ecrire') {
    fs.writeFileSync(REF, JSON.stringify(await tout(BASE), null, 1));
    console.log('référence enregistrée :', REF); await b.close(); return;
  }
  const [a, n] = mode === '--comparer' ? [await tout(process.argv[3]), await tout(process.argv[4])] : [JSON.parse(fs.readFileSync(REF, 'utf8')), await tout(BASE)];
  let total = 0, egaux = 0, car = 0;
  for (const W of Object.keys(a)) for (const r of Object.keys(a[W])) {
    const x = a[W][r], y = n[W][r];
    const memeT = x.t === y.t, memeL = JSON.stringify(x.liens) === JSON.stringify(y.liens), memeC = x.controles === y.controles, memeH = JSON.stringify(x.titres) === JSON.stringify(y.titres), memeA = JSON.stringify(x.aria) === JSON.stringify(y.aria);
    total++; car += x.t.length; const egal = memeT && memeL && memeC && memeH && memeA; if (egal) egaux++;
    if (!egal) {
      console.log(`${W} ${r.padEnd(16)} texte ${memeT ? 'identique' : 'DIFFÉRENT'} | liens ${memeL ? '=' : '≠'} | contrôles ${x.controles}→${y.controles} | titres ${memeH ? '=' : '≠'} | aria ${memeA ? '=' : '≠'}`);
      if (!memeT) { let i = 0; while (i < x.t.length && x.t[i] === y.t[i]) i++; console.log('   attendu :', JSON.stringify(x.t.slice(Math.max(0, i - 40), i + 80))); console.log('   trouvé  :', JSON.stringify(y.t.slice(Math.max(0, i - 40), i + 80))); }
    }
  }
  console.log(`PARITÉ : ${egaux} / ${total} pages identiques (texte, liens, contrôles, titres, attributs d'accessibilité) ; ${car.toLocaleString('fr-FR')} caractères comparés`);
  if (egaux !== total && mode !== '--comparer') console.log('Si ce changement de texte est voulu : npm run controles:textes:ecrire, puis enregistrer textes-reference.json.');
  await b.close();
  process.exit(egaux === total ? 0 : 1);
})();
