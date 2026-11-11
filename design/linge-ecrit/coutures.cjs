/*
 * Le linge écrit : les coutures du site.
 * Génère src/styles/coutures.css : le point avant (horizontal, vertical, en cadre), le cœur brodé,
 * les fils qui pendent, le bord effiloché et l'écriture cousue, en SVG dans des variables CSS. Aucune image à télécharger.
 *
 *   node design/linge-ecrit/coutures.cjs
 *
 * Tirage fixe (graine) : relancer le script redonne exactement les mêmes points.
 */
const fs = require('node:fs');
const path = require('node:path');

const FIL = '#64303d'; // le bordeaux du logo brodé, prélevé sur le tableau
const REFLET = '#b98a93'; // la lumière sur le fil
let graine = 20261111;
const hasard = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);
const entre = (a, b) => a + (b - a) * hasard();
const n = (x) => Math.round(x * 100) / 100;
const uri = (svg) => `url("data:image/svg+xml,${svg.replace(/\s+/g, ' ').replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/"/g, "'")}")`;

/** Une rangée de points avant, cousus à la main : longueurs, écarts et hauteurs jamais tout à fait égaux. */
function rangee(longueur, vertical, opacite = 0.9) {
  const points = [];
  let x = 2.5;
  while (x < longueur - 9) {
    const l = Math.min(entre(7.5, 10.5), longueur - 2.5 - x);
    points.push({ x, l, y: entre(-0.55, 0.55), p: entre(-0.45, 0.45) });
    x += l + entre(4.6, 6.4);
  }
  const trait = (p, d, couleur, e, o) => {
    const [x1, y1, x2, y2] = [p.x, 4 + p.y + d, p.x + p.l, 4 + p.y + p.p + d];
    return vertical
      ? `<line x1="${n(y1)}" y1="${n(x1)}" x2="${n(y2)}" y2="${n(x2)}" stroke="${couleur}" stroke-width="${e}" opacity="${o}"/>`
      : `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${couleur}" stroke-width="${e}" opacity="${o}"/>`;
  };
  const corps = points.map((p) => trait(p, 0, FIL, 1.9, opacite) + trait(p, -0.45, REFLET, 0.55, opacite * 0.55)).join('');
  const [w, h] = vertical ? [8, longueur] : [longueur, 8];
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" stroke-linecap="round">${corps}</svg>`);
}

/** Un cadre cousu : il suit la taille de l'élément, les points gardent leur longueur. */
function cadre(opacite = 0.85, marge = 1.5) {
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <filter id="m" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter>
    <rect x="${marge}" y="${marge}" width="100%" height="100%" style="width:calc(100% - ${marge * 2}px);height:calc(100% - ${marge * 2}px)" rx="5" fill="none"
      stroke="${FIL}" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="8.6 5.6" opacity="${opacite}" filter="url(#m)"/></svg>`);
}

/** Le bord effiloché d'un morceau de mousseline déchirée à la main (masque). */
function effiloche(marge = 5, force = 7) {
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <filter id="e" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035 0.6" numOctaves="2" seed="11" result="a"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.6 0.035" numOctaves="2" seed="3" result="b"/><feBlend in="a" in2="b" mode="multiply" result="c"/>
      <feDisplacementMap in="SourceGraphic" in2="c" scale="${force}" xChannelSelector="R" yChannelSelector="G"/></filter>
    <rect x="${marge}" y="${marge}" width="100%" height="100%" style="width:calc(100% - ${marge * 2}px);height:calc(100% - ${marge * 2}px)" rx="2" fill="#000" filter="url(#e)"/></svg>`);
}

/** Un petit cœur brodé au point avant, comme ceux du vêtement de référence. */
function coeur() {
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="22" height="20" viewBox="0 0 22 20" fill="none" stroke-linecap="round">
    <path d="M11 17.6C5.4 13.4 2.2 10.4 2.2 6.9 2.2 4.3 4.1 2.6 6.4 2.6c1.9 0 3.4 1.1 4.6 3.1 1.2-2 2.7-3.1 4.6-3.1 2.3 0 4.2 1.7 4.2 4.3 0 3.5-3.2 6.5-8.8 10.7Z"
      stroke="${FIL}" stroke-width="1.7" stroke-dasharray="4.2 2.9" opacity="0.9"/></svg>`);
}

/** Trois fils laissés pendants, au bas d'un morceau de tissu. */
function fils() {
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="46" height="54" viewBox="0 0 46 54" fill="none" stroke-linecap="round" stroke="${FIL}">
    <path d="M9 0c-2 9 3 15 0 25s-5 13-2 22" stroke-width="1.1" opacity="0.8"/>
    <path d="M17 0c3 7-2 12 1 20s3 9 1 14" stroke-width="0.9" opacity="0.6"/>
    <path d="M30 0c-1 6 4 10 2 17" stroke-width="0.9" opacity="0.5"/></svg>`);
}

/**
 * L'écriture cousue : des lignes d'écriture à la main, brodées au point avant, que l'on ne peut pas lire
 * (ce sont les mots de quelqu'un d'autre, on n'en voit que le geste). Au bout de certaines lignes, le fil n'est
 * pas coupé : il pend. Sert de masque : la couleur vient de la page (le fil de la personne).
 */
function lettre(w, h) {
  const t = hasard();
  const A = h * entre(1.75, 2.1), D = h * entre(0.9, 1.25);
  const c = (...v) => 'c' + v.map(n1).join(' ');
  if (t < 0.26) return c(w * 0.5, 0, w * 0.9, -h, w * 0.45, -h) + c(-w * 0.45, 0, -w * 0.25, h, w * 0.55, h); // e
  if (t < 0.4) return c(w * 0.5, 0, w * 0.85, -A, w * 0.42, -A) + c(-w * 0.4, 0, -w * 0.2, A, w * 0.58, A); // l
  if (t < 0.62) return c(w * 0.1, -h * 1.25, w * 0.8, -h * 1.25, w, 0); // n
  if (t < 0.76) return `q${n1(w * 0.25)} ${n1(-h * 1.1)} ${n1(w * 0.5)} ${n1(-h * 0.15)}t${n1(w * 0.5)} ${n1(h * 0.15)}`; // i
  if (t < 0.88) return c(w * 0.6, 0, w * 0.7, D, w * 0.2, D) + c(-w * 0.5, 0, -w * 0.1, -D, w * 0.8, -D); // g
  return c(-w * 0.2, -h, w * 0.9, -h, w * 0.7, -h * 0.1) + c(-w * 0.2, h * 0.3, -w * 0.5, h * 0.2, w * 0.3, h * 0.1); // o
}
const n1 = (x) => Math.round(x * 10) / 10;
function ecriture(W, lignes, interligne, h, pendants) {
  let corps = '';
  for (let l = 0; l < lignes; l++) {
    const y0 = 30 + l * interligne;
    let x = entre(4, 22);
    const fin = W - entre(8, l === lignes - 1 ? W * 0.45 : W * 0.12);
    let bout = [x, y0];
    while (x < fin - 30) {
      const lettres = 2 + Math.floor(hasard() * 7);
      let d = `M${n1(x)} ${n1(y0 + entre(-1.2, 1.2))}`;
      let larg = 0;
      for (let k = 0; k < lettres; k++) {
        const w = entre(7.5, 12);
        if (x + larg + w > fin) break;
        d += lettre(w, h * entre(0.88, 1.12));
        larg += w;
      }
      if (larg) corps += `<path d="${d}" stroke-dasharray="${n1(entre(4.8, 6.4))} ${n1(entre(2.8, 3.5))}" stroke-dashoffset="${n1(entre(0, 8))}"/>`;
      bout = [x + larg, y0];
      x += larg + entre(11, 20);
    }
    if (pendants && hasard() < 0.5) {
      const L = entre(46, 120);
      corps += `<path d="M${n1(bout[0])} ${n1(bout[1])}c${n1(entre(4, 10))} ${n1(L * 0.3)} ${n1(entre(-9, -2))} ${n1(L * 0.62)} ${n1(entre(-3, 6))} ${n1(L)}" stroke-width="0.9"/>`;
    }
  }
  const H = Math.round(30 + (lignes - 1) * interligne + (pendants ? 130 : 22));
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" stroke="#000" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><g transform="skewX(-10)">${corps}</g></svg>`);
}

const css = `/*
 * Les coutures du linge écrit. Fichier généré : ne pas modifier à la main.
 * Source : design/linge-ecrit/coutures.cjs (node design/linge-ecrit/coutures.cjs).
 */
:root {
  --couture: ${rangee(236, false)};
  --couture-pale: ${rangee(236, false, 0.3)};
  --couture-v: ${rangee(236, true)};
  --couture-v-pale: ${rangee(236, true, 0.3)};
  --couture-cadre: ${cadre()};
  --couture-cadre-pale: ${cadre(0.32)};
  --effiloche: ${effiloche()};
  --effiloche-fin: ${effiloche(3, 4)};
  --coeur: ${coeur()};
  --fils: ${fils()};
  /* l'écriture cousue (masques) : large 560 × 310, étroite 200 × 286, haute 200 × 448 pour la marge */
  --ecriture: ${ecriture(560, 6, 30, 10.5, true)};
  --ecriture-etroite: ${ecriture(200, 5, 31, 10, true)};
  --ecriture-haute: ${ecriture(200, 14, 30, 10, false)};
}
`;
const sortie = path.join(__dirname, '..', '..', 'src', 'styles', 'coutures.css');
fs.writeFileSync(sortie, css);
console.log('écrit', sortie, css.length, 'octets');
