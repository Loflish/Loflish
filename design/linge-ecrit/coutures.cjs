/*
 * Le linge écrit : les coutures du site.
 * Génère src/styles/coutures.css : le point avant (horizontal, vertical, en cadre), le cœur brodé,
 * les fils qui pendent et le bord effiloché, en SVG dans des variables CSS. Aucune image à télécharger.
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
}
`;
const sortie = path.join(__dirname, '..', '..', 'src', 'styles', 'coutures.css');
fs.writeFileSync(sortie, css);
console.log('écrit', sortie, css.length, 'octets');
