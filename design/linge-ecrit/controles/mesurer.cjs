// Juge extérieur : axe-core, débordement horizontal, cibles tactiles, erreurs de page. Usage : node mesurer.cjs <sortie.json> [base]
const { chromium } = require('playwright');
const fs = require('fs');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const out = process.argv[2] || require('path').join(require('os').tmpdir(), 'nmm-mesures.json');
const base = process.argv[3] || 'http://127.0.0.1:4174/';
const routes = ['', 'se-perdre', 'trace/sakinah', 'trace/jeannot', 'creer', 'projet', 'ressources', 'soutenir', 'juridique', 'archives', 'oeuvre-commune', 'compte'];
const formats = [['320', { width: 320, height: 640 }, true], ['390', { width: 390, height: 844 }, true], ['768', { width: 768, height: 1024 }, true], ['1440', { width: 1440, height: 900 }, false]];
(async () => {
  const b = await chromium.launch();
  const res = [];
  for (const [nom, vp, mobile] of formats) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    await ctx.addInitScript(() => { try { localStorage.setItem('nmm:vu', '1'); localStorage.setItem('nmm:visites', '5'); sessionStorage.setItem('nmm:entree-vue', '1'); } catch {} });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(String(e)));
    p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    for (const r of routes) {
      await p.goto(base + '?entree=0#/' + r);
      await p.waitForTimeout(r === '' ? 3500 : 1800);
      await p.addScriptTag({ content: axe });
      const a = await p.evaluate(async () => {
        const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] });
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes.slice(0, 3).map((x) => x.target.join(' ')) }));
      });
      const m = await p.evaluate(() => {
        const W = document.documentElement.clientWidth;
        const deb = [];
        const petits = [];
        for (const el of document.querySelectorAll('#contenu *')) {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          if (r.right > W + 1 || r.left < -1) {
            // ignoré si un ancêtre défile ou coupe horizontalement
            let a = el.parentElement, coupe = false;
            // seul un ancêtre qui défile (auto, scroll) rend le dépassement légitime : un contenu coupé par hidden/clip est perdu
            while (a && a !== document.body) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll') { coupe = true; break; } a = a.parentElement; }
            const halo = el.matches('.bubble-image img') || !!el.closest('[aria-hidden=true]');
            if (!coupe && !halo && cs.position !== 'fixed' && el.matches('a, button, p, h1, h2, h3, li, span, label, input, select, textarea, img, figure, dd, dt, blockquote, summary')) deb.push((typeof el.className === 'string' && el.className.slice(0, 40)) || el.tagName);
          }
          if (el.matches('a, button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=radio], [role=switch]')) {
            if (el.disabled) continue;
            if (r.width < 24 || r.height < 24) petits.push({ c: (String(el.className).slice(0, 30) || el.tagName) + ' « ' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20) + ' »', w: Math.round(r.width), h: Math.round(r.height) });
          }
        }
        const cibles = [...document.querySelectorAll('#contenu a, #contenu button, #contenu summary')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && !e.disabled; });
        const sous44 = cibles.filter((e) => { const r = e.getBoundingClientRect(); return r.height < 44 && r.width < 44 || r.height < 32; }).length;
        return { scrollW: document.documentElement.scrollWidth, W, deb: [...new Set(deb)].slice(0, 8), petits: petits.slice(0, 8), nPetits: petits.length, cibles: cibles.length, sous44 };
      });
      res.push({ format: nom, route: r || 'explorer', axe: a, debordement: m.scrollW > m.W + 1, scrollW: m.scrollW, deb: m.deb, nPetits: m.nPetits, petits: m.petits, cibles: m.cibles, sous44: m.sous44 });
    }
    res.push({ format: nom, erreurs: errs.slice(0, 5), nErreurs: errs.length });
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  const pages = res.filter((r) => r.route);
  const tot = (f) => pages.reduce((s, r) => s + f(r), 0);
  console.log('pages mesurées :', pages.length);
  console.log('violations axe (règles × pages) :', tot((r) => r.axe.length), '| nœuds :', tot((r) => r.axe.reduce((s, v) => s + v.n, 0)));
  const parRegle = {}; pages.forEach((r) => r.axe.forEach((v) => (parRegle[v.id] = (parRegle[v.id] || 0) + v.n)));
  console.log('par règle :', JSON.stringify(parRegle));
  console.log('pages avec débordement horizontal :', pages.filter((r) => r.debordement).map((r) => r.format + ':' + r.route).join(', ') || 'aucune');
  console.log('éléments hors écran :', pages.filter((r) => r.deb.length).map((r) => r.format + ':' + r.route + '→' + r.deb.join('|')).join(' ; ') || 'aucun');
  console.log('cibles < 24 px (WCAG 2.5.8) :', tot((r) => r.nPetits), '| cibles basses (< 32 px de haut ou < 44 des deux côtés) :', tot((r) => r.sous44), 'sur', tot((r) => r.cibles));
  console.log('erreurs de page :', res.filter((r) => r.erreurs).map((r) => r.format + ':' + r.nErreurs).join(' '));
  // échec : un défaut d'accessibilité, une page qui déborde, un contenu hors de l'écran, ou une cible de moins de 24 px
  // autre qu'un lien dans une phrase (les adresses e-mail du texte)
  const horsTexte = pages.reduce((s, r) => s + r.petits.filter((x) => !/^A «/.test(x.c)).length, 0);
  const mauvais = tot((r) => r.axe.length) + pages.filter((r) => r.debordement || r.deb.length).length + horsTexte;
  process.exit(mauvais ? 1 : 0);
})();
