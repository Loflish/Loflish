const fs=require('node:fs');
const path=require('node:path');
const esbuild=require(path.resolve(__dirname,'../../../../node_modules/esbuild'));
const root=__dirname;const repoRoot=path.resolve(root,'../../../..');fs.mkdirSync(path.join(root,'../reconstruits'),{recursive:true});
const sources={};
const png=new Set([15,50,70,81,85,95]);
for(let n=1;n<=100;n++) {
  const ext=png.has(n)?'png':'webp';
  const file=path.join(repoRoot,'public/hd/taches',`tache-${String(n).padStart(2,'0')}.${ext}`);
  sources[n]=`data:image/${ext};base64,${fs.readFileSync(file).toString('base64')}`;
}
(async()=>{
  const result=await esbuild.build({
    entryPoints:[path.join(root,'atelier-matieres.ts')],bundle:true,write:false,format:'esm',minify:true,
    define:{'import.meta.env.BASE_URL':'"/"'},
    plugins:[{name:'sources-autonomes',setup(build){
      build.onLoad({filter:/[\\/]src[\\/]lib[\\/]hd\.ts$/},args=>{
        const original=fs.readFileSync(args.path,'utf8');
        const needle='img.src = tacheUrl(n);';
        if(!original.includes(needle))throw new Error('Chargement des matières inattendu : adaptation à revoir.');
        return {contents:`const ATELIER_SOURCES: Record<number,string> = ${JSON.stringify(sources)};\n`+original.replace(needle,'img.src = ATELIER_SOURCES[n];'),loader:'ts',resolveDir:path.dirname(args.path)};
      });
    }}]
  });
  const html=`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comparer les matières — Nos Mots Mémoriaux</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f3f1ec;color:#2f2c33;font-family:Georgia,serif}main{max-width:1440px;margin:auto;padding:36px 28px 64px}header{max-width:880px}h1{font-weight:400;font-size:clamp(30px,4vw,52px);margin:0 0 16px}p{line-height:1.6;font-size:17px}.note{font-size:14px;color:#57535c}nav{position:sticky;top:0;background:#f3f1ecf5;z-index:2;padding:18px 0;border-bottom:1px solid #d3cec4;display:flex;gap:24px;align-items:center;flex-wrap:wrap}select{font:inherit;color:inherit;border:1px solid #8c8880;background:#fffefa;border-radius:4px;padding:9px;max-width:100%}label{display:flex;gap:9px;align-items:center}input{accent-color:#4b6097}#etat,#compteur{font-size:14px;color:#57535c}#compteur{overflow-wrap:anywhere}#matieres{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:18px;margin-top:24px}.matiere{border:1px solid #d9d3c8;border-radius:5px;background:#f9f7f1;overflow:hidden;padding:16px 8px 14px}.matiere[hidden]{display:none}.card-top{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 8px}h2{font-size:17px;font-weight:400;margin:0}.mark{font-size:13px}.samples{display:grid;grid-template-columns:1fr 1.1fr 1.7fr;align-items:end}figure{margin:0;text-align:center;overflow:visible}.sample{height:218px;display:flex;justify-content:center;align-items:center}img{flex:none;max-width:none}figcaption{font-size:12px;color:#57535c}a{color:#4b6097}:focus-visible{outline:2px solid #4b6097;outline-offset:3px}@media(max-width:440px){main{padding:24px 12px}#matieres{grid-template-columns:1fr}.sample{height:205px}nav{gap:12px}.samples{grid-template-columns:.7fr 1fr 1.7fr}}.matiere{container-type:inline-size}@container(max-width:370px){.samples{grid-template-columns:1fr 1fr}.sample{height:115px}.samples figure:last-child{grid-column:1 / -1}.samples figure:last-child .sample{height:218px}}</style>
<main><header><h1>Les matières, à taille réelle</h1><p>Comparer les 101 matières actuelles du musée, dans une même couleur et à trois tailles. Les détails que l'on distingue ici en petit sont ceux à privilégier pour une constellation lisible.</p><p class="note">Étude de l'existant, sans nouvelle génération. Les aperçus utilisent le rendu des bulles du projet, une graine commune et une opacité pleine. Le fond, le mouvement et la transparence de la constellation restent à examiner dans le musée. Les tailles sont des diamètres nominaux ; les formes peuvent les dépasser.</p></header>
<nav aria-label="Réglages de comparaison"><label>Couleur <select id="couleur" aria-label="Couleur GRIS des matières"></select></label><label><input type="checkbox" id="selection"> Seulement les matières marquées</label><span id="etat" role="status">Chargement…</span></nav><p id="compteur" aria-live="polite">Aucune matière marquée.</p><div id="matieres"></div><p class="note">Référence : dépôt Loflish/Loflish, commit 33956a0. Les marques servent à la discussion et sont temporaires : elles ne changent pas le site.</p></main><script type="module">${result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script></html>`;
  const output=path.join(root,'../reconstruits/Comparateur_des_matieres.html');
  fs.writeFileSync(output,html,'utf8');
  console.log(JSON.stringify({file:output,bytes:Buffer.byteLength(html),matieres:101,sources:100}));
})().catch(error=>{console.error(error);process.exitCode=1;});
