// Extrait tous les textes lus par les visiteurs (JSX, attributs, données) dans un fichier à relire.
// Usage : node scripts/textes.mjs [sortie.md]
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const racine = resolve(import.meta.dirname, '..');
const sortie = process.argv[2] ?? resolve(racine, '..', 'reports', 'Revue 2026-11-06', 'TEXTES-DU-SITE.md');

// Fichiers lus par un visiteur, dans l'ordre du site. Exclus : ateliers (dev), tests, traces de démonstration (Sakinah, Jeannot).
const FICHIERS = [
  ['Entrée du site', 'src/components/Entree.tsx'],
  ['Menu, dock, pied de page', 'src/components/Chrome.tsx'],
  ['Constellation', 'src/pages/Explorer.tsx'],
  ['Fiche et page d’une trace', 'src/pages/TracePage.tsx'],
  ['Se perdre', 'src/pages/SePerdre.tsx'],
  ['Œuvre commune', 'src/pages/OeuvreCommune.tsx'],
  ['Créer (les 7 étapes)', 'src/pages/Creer.tsx'],
  ['Créer : éditeur de fragments', 'src/components/FragmentEditor.tsx'],
  ['Créer : choix de confidentialité', 'src/components/ChoixConfidentialite.tsx'],
  ['Mes traces (compte)', 'src/pages/MesTraces.tsx'],
  ['Pages de texte (Projet, Ressources, Juridique, Archives, Compte, Introuvable…)', 'src/pages/Pages.tsx'],
  ['Signaler', 'src/components/Signaler.tsx'],
  ['Partager', 'src/components/Partager.tsx'],
  ['Panneau latéral', 'src/components/Panneau.tsx'],
  ['Médias', 'src/components/Media.tsx'],
  ['Panne réseau', 'src/components/Panne.tsx'],
  ['Questions, rubriques, limites', 'src/data/types.ts'],
  ['Archives (éditions)', 'src/data/archives.ts'],
  ['Règles de l’œuvre commune', 'src/data/oeuvre-regles.ts'],
  ['Titre des onglets', 'src/lib/titre.ts'],
  ['Contact', 'src/lib/contact.ts'],
  ['Courriels envoyés par le serveur', 'server/src/courriel.ts'],
  ['Messages du serveur (auteur)', 'server/src/routes/auteur.ts'],
  ['Messages du serveur (public)', 'server/src/routes/public.ts'],
  ['Messages du serveur (règles)', 'server/src/regles.ts'],
  ['Administration (Tom seulement)', 'src/pages/Admin.tsx'],
];

const ATTRIBUTS = new Set(['title', 'aria-label', 'placeholder', 'alt', 'aria-description', 'label', 'content']);
const IGNORER_ATTR = new Set(['className', 'id', 'href', 'to', 'src', 'type', 'name', 'key', 'rel', 'target', 'role', 'htmlFor', 'style', 'd', 'viewBox', 'fill', 'stroke', 'autoComplete', 'inputMode', 'lang', 'dir', 'data-testid', 'for']);

// Une chaîne « texte » : au moins une lettre et un espace ou une ponctuation de phrase, pas un chemin ni un identifiant.
function estTexte(s) {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length < 2) return false;
  if (!/[A-Za-zÀ-ÿ]/.test(t)) return false;
  if (/^[\w\-./#?=&:%@+,;()[\]{}]+$/.test(t) && !/[À-ÿ]/.test(t)) return false; // identifiant, chemin, URL
  if (/^(https?:|mailto:|#\/|\/|\.\/|data:)/.test(t)) return false;
  if (/^(select|insert|update|delete|with|alter|create|drop)\s/i.test(t) || /^</.test(t) || /style="/.test(t)) return false; // SQL, HTML
  if (/^\[\w+\]/.test(t) || /:graine$/.test(t) || /^\d+ (hour|minute|second)s?$/.test(t)) return false; // journal, clés techniques
  if (/^[a-z][\w-]*(\s[a-z][\w-]*)*$/.test(t) && !/[À-ÿ]/.test(t) && t.length < 24) return false; // classes css
  if (t.length < 4 && !/[À-ÿ]/.test(t)) return false;
  return true;
}

function nettoie(s) {
  return s.replace(/[ \t]*\n[ \t]*/g, ' ').replace(/\s+/g, ' ').trim();
}

const parties = [];
let total = 0;
let numero = 0;

for (const [titre, rel] of FICHIERS) {
  const chemin = resolve(racine, rel);
  let code;
  try { code = readFileSync(chemin, 'utf8'); } catch { continue; }
  const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'], errorRecovery: true });
  const lignes = []; // { ligne, composant, texte }
  const vus = new Set();
  const pousse = (node, texte, composant) => {
    if (!estTexte(texte)) return;
    const t = nettoie(texte);
    const cle = `${node.loc.start.line}:${t}`;
    if (vus.has(cle)) return;
    vus.add(cle);
    lignes.push({ ligne: node.loc.start.line, composant, texte: t });
  };
  const composantDe = (path) => {
    const f = path.findParent((p) => (p.isFunctionDeclaration() || p.isVariableDeclarator() || p.isExportNamedDeclaration()) && p.node.id?.name);
    return f?.node.id?.name ?? '';
  };
  const consommes = new Set();
  const seulementTexte = (el) => el.children.length > 0 && el.children.every((c) => c.type === 'JSXText' || (c.type === 'JSXExpressionContainer' && c.expression.type === 'StringLiteral'));
  const texteDe = (c) => (c.type === 'JSXText' ? c.value : c.expression.value);
  traverse(ast, {
    'JSXElement|JSXFragment'(path) {
      const enfants = path.node.children;
      const aTexte = enfants.some((c) => c.type === 'JSXText' && /[A-Za-zÀ-ÿ]/.test(c.value));
      const aAutre = enfants.some((c) => c.type !== 'JSXText');
      if (!aTexte || !aAutre) return;
      const morceaux = enfants.map((c) => {
        if (c.type === 'JSXText') { consommes.add(c); return c.value; }
        if (c.type === 'JSXExpressionContainer' && c.expression.type === 'StringLiteral') { consommes.add(c.expression); return c.expression.value; }
        if (c.type === 'JSXElement' && seulementTexte(c)) { c.children.forEach((x) => consommes.add(x.type === 'JSXText' ? x : x.expression)); return c.children.map(texteDe).join(''); }
        return ' […] ';
      });
      pousse(path.node, morceaux.join(''), composantDe(path));
    },
    JSXText(path) { if (!consommes.has(path.node)) pousse(path.node, path.node.value, composantDe(path)); },
    JSXAttribute(path) {
      const nom = path.node.name.name;
      if (!ATTRIBUTS.has(nom)) return;
      const v = path.node.value;
      if (v?.type === 'StringLiteral') pousse(v, v.value, composantDe(path));
      if (v?.type === 'JSXExpressionContainer' && v.expression.type === 'TemplateLiteral') pousse(v, v.expression.quasis.map((q) => q.value.cooked).join('…'), composantDe(path));
    },
    StringLiteral(path) {
      const parent = path.parent;
      if (parent.type === 'ImportDeclaration' || parent.type === 'ExportNamedDeclaration') return;
      if (parent.type === 'JSXAttribute') return; // traité au-dessus
      if (consommes.has(path.node)) return;
      if (parent.type === 'MemberExpression' || parent.type === 'TSLiteralType' || parent.type === 'TSEnumMember') return;
      if (parent.type === 'ObjectProperty' && parent.key === path.node) return; // clé d'objet
      if (parent.type === 'CallExpression' && /^(require|import|querySelector|querySelectorAll|getElementById|matches|closest|getItem|setItem|removeItem|addEventListener|removeEventListener|getAttribute|setAttribute)$/.test(parent.callee?.property?.name ?? parent.callee?.name ?? '')) return;
      if (parent.type === 'BinaryExpression' && ['===', '!==', '==', '!='].includes(parent.operator)) return;
      if (parent.type === 'SwitchCase') return;
      const objPar = path.findParent((p) => p.isObjectProperty());
      if (objPar && /^(id|type|kind|slug|href|to|src|classe|className|icone|icon|key|code|statut|status|couleur|color|font|route|cle|path|rubrique|nom_fichier|mime)$/.test(objPar.node.key?.name ?? objPar.node.key?.value ?? '')) return;
      const attr = path.findParent((p) => p.isJSXAttribute());
      if (attr && IGNORER_ATTR.has(attr.node.name.name)) return;
      pousse(path.node, path.node.value, composantDe(path));
    },
    TemplateLiteral(path) {
      if (path.parent.type === 'TaggedTemplateExpression') return;
      const attr = path.findParent((p) => p.isJSXAttribute());
      if (attr && !ATTRIBUTS.has(attr.node.name.name)) return;
      const texte = path.node.quasis.map((q) => q.value.cooked ?? '').join(' […] ');
      if (!/[A-Za-zÀ-ÿ]{3,}/.test(texte) || !/\s/.test(texte.trim())) return;
      if (/[\w-]+\/[\w-]+|\.(webp|png|jpg|svg|json|pdf)/.test(texte)) return; // chemin de fichier
      pousse(path.node, texte, composantDe(path));
    },
  });
  lignes.sort((a, b) => a.ligne - b.ligne);
  if (!lignes.length) continue;
  total += lignes.length;
  const bloc = [`\n\n## ${titre}\n\nFichier : \`${rel}\`\n`];
  let dernierComposant = null;
  for (const l of lignes) {
    if (l.composant !== dernierComposant) {
      bloc.push(`\n### ${l.composant || '(hors composant)'}\n`);
      dernierComposant = l.composant;
    }
    numero += 1;
    bloc.push(`\n**T${String(numero).padStart(4, '0')}** · ligne ${l.ligne}\n${l.texte}\n\nNouveau :\n`);
  }
  parties.push(bloc.join(''));
}

const entete = `# Tous les textes du site — à reformuler

Généré le ${new Date().toISOString().slice(0, 10)} par \`scripts/textes.mjs\` depuis la branche de travail. ${total} textes, dans l'ordre du site.

Comment t'en servir :

1. Lis un texte sous son numéro (**T0001**…). La ligne « ligne N » dit où il vit dans le fichier.
2. Écris ta version après « Nouveau : ». Laisse vide ce que tu gardes tel quel.
3. Écris comme tu parles : je repasse ensuite sur l'orthographe, la syntaxe et le vocabulaire, sans changer ton sens.
4. Un texte avec « […] » contient un morceau variable (un nom, un nombre) : garde le « […] » à sa place.
5. Rends-moi le fichier : je reporte chaque « Nouveau » dans le code.

Les titres « ### » sont les noms des composants dans le code : c'est l'endroit de la page (par exemple \`Projet\`, \`Juridique\`, \`EtapeCompte\`).
`;

writeFileSync(sortie, entete + parties.join(''), 'utf8');
console.log(`${total} textes écrits dans ${sortie}`);
