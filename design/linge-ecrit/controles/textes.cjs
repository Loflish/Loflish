// Parité des contenus : le texte de chaque page (textContent, insensible au CSS), ancienne et nouvelle version.
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
(async () => {
  const b = await chromium.launch();
  let total = 0, egaux = 0, car = 0;
  for (const W of [390, 1440]) {
    const mk = () => b.newContext({ viewport: { width: W, height: 900 }, isMobile: W < 900, hasTouch: W < 900 }).then(async (c) => { await c.addInitScript(() => { try { localStorage.setItem('nmm:vu', '1'); localStorage.setItem('nmm:visites', '5'); sessionStorage.setItem('nmm:entree-vue', '1'); } catch {} }); return c; });
    const [a, n] = [await lire(await mk(), process.argv[2] || 'http://127.0.0.1:4175/'), await lire(await mk(), process.argv[3] || 'http://127.0.0.1:4174/')];
    for (const r of Object.keys(a)) {
      const memeT = a[r].t === n[r].t, memeL = JSON.stringify(a[r].liens) === JSON.stringify(n[r].liens), memeC = a[r].controles === n[r].controles, memeH = JSON.stringify(a[r].titres) === JSON.stringify(n[r].titres), memeA = JSON.stringify(a[r].aria) === JSON.stringify(n[r].aria);
      total++; car += a[r].t.length; if (memeT && memeL && memeC && memeH && memeA) egaux++;
      console.log(`${W} ${r.padEnd(16)} texte ${memeT ? 'identique' : 'DIFFÉRENT'} (${a[r].t.length} car.) | liens ${memeL ? '=' : '≠'} ${a[r].liens.length} | contrôles ${a[r].controles}→${n[r].controles} | titres ${memeH ? '=' : '≠'} ${a[r].titres.length} | aria ${memeA ? '=' : '≠'} ${a[r].aria.length}`);
      if (!memeT) { let i = 0; while (i < a[r].t.length && a[r].t[i] === n[r].t[i]) i++; console.log('   avant :', JSON.stringify(a[r].t.slice(Math.max(0, i - 40), i + 80))); console.log('   après :', JSON.stringify(n[r].t.slice(Math.max(0, i - 40), i + 80))); }
    }
  }
  console.log(`\nPARITÉ : ${egaux} / ${total} pages identiques (texte, liens, contrôles, titres, attributs d'accessibilité) ; ${car.toLocaleString('fr-FR')} caractères comparés`);
  await b.close();
})();
