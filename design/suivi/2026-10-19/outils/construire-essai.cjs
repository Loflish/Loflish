const fs=require('node:fs');const path=require('node:path');const esbuild=require(path.resolve(__dirname,'../../../../node_modules/esbuild'));
const root=__dirname;const repoRoot=path.resolve(root,'../../../..');fs.mkdirSync(path.join(root,'../reconstruits'),{recursive:true});const sources={};const png=new Set([15,50,70,81,85,95]);
function data(file,ext){return `data:image/${ext};base64,${fs.readFileSync(path.join(repoRoot,'public/hd',file)).toString('base64')}`;}
for(let n=1;n<=100;n++){const ext=png.has(n)?'png':'webp';sources[n]=data(`taches/tache-${String(n).padStart(2,'0')}.${ext}`,ext);}
(async()=>{
const result=await esbuild.build({entryPoints:[path.join(root,'essai-lisibilite.ts')],bundle:true,write:false,format:'esm',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},plugins:[{name:'sources',setup(build){build.onLoad({filter:/[\\/]src[\\/]lib[\\/]hd\.ts$/},args=>{const source=fs.readFileSync(args.path,'utf8');if(!source.includes('img.src = tacheUrl(n);'))throw Error('Source inattendue');return{contents:`const SOURCES:Record<number,string>=${JSON.stringify(sources)};\n`+source.replace('img.src = tacheUrl(n);','img.src = SOURCES[n];'),loader:'ts',resolveDir:path.dirname(args.path)};});}}]});
const videoData='data:video/mp4;base64,'+fs.readFileSync(path.join(repoRoot,'public/hd/fond-explorer-1920.mp4')).toString('base64');
const html=`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fond vivant — 00, 81, 95</title><style>
*{box-sizing:border-box}
body{margin:0;background:#f3f1ec;color:#302d35;font-family:Georgia,serif}
main{max-width:1100px;margin:auto;padding:28px 20px}
h1{font-size:clamp(28px,4vw,42px);font-weight:400;margin:0 0 16px}p{line-height:1.6}
nav{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0 20px}
button{padding:12px 15px;background:#faf8f3;color:#34303c;border:1px solid #aaa1ad;border-radius:4px;font:inherit;cursor:pointer}
button[aria-pressed=true]{background:#4b6097;color:white}button:focus-visible{outline:3px solid #d17067;outline-offset:3px}
.scene{--fond:1;position:relative;isolation:isolate;background:#f3f1ec;border:1px solid #cec8c1;padding:24px 12px;overflow:hidden}
.peinture{position:absolute;inset:-4%;z-index:0;opacity:var(--fond);animation:derive 140s ease-in-out infinite alternate;animation-play-state:paused;pointer-events:none;background:url('${data('fond-16x9.webp','webp')}') center/cover}
.peinture .fond-image,.peinture canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.peinture .fond-image{z-index:0}.peinture canvas{z-index:1;visibility:hidden}
.peinture video{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.scene.fond-seul{height:58vh;min-height:360px}.scene.fond-seul section{display:none}
.vue-bulles{display:flex;align-items:center;gap:10px;margin:16px 0;font-size:17px}
@keyframes derive{from{transform:scale(1) translate(0,0)}to{transform:scale(1.06) translate(-1.2%,.8%)}}
@keyframes respiration{from{transform:scale(1)}to{transform:scale(1.04)}}
@keyframes lateral{from{transform:translateX(-1.5%)}to{transform:translateX(1.5%)}}
.scene section{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:8px 0 24px}
.scene h2{grid-column:1/-1;font-weight:400;font-size:19px;margin:4px 8px}
figure{margin:0;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;min-width:0}
figure img{flex:none;object-fit:contain}figcaption{width:100%;text-align:center;font-size:12px;margin-top:10px}
.note{font-size:14px;color:#625b67}.label{margin-bottom:4px}#etat{font-weight:bold}
details{margin-top:20px;line-height:1.6}summary{cursor:pointer}
@media(max-width:720px){.scene section{grid-template-columns:1fr}main{padding:24px 12px}}
</style><main>
<h1>La peinture, doucement vivante</h1>
<p>Ton choix provisoire : <strong>100 % et pigments seuls, sans déplacement du cadre.</strong> Le nouvel essai anime doucement l'ensemble des zones peintes à des rythmes décalés. Observe-le pendant 20 à 30 secondes, puis compare avec « Pigments seuls », la vidéo d'origine. 100 % conserve les couleurs du fond sans ajouter de saturation.</p>
<p class="label">Présence de la peinture</p>
<nav aria-label="Présence du fond"><button data-opacity=".7" aria-pressed="false">Référence · 70 %</button><button data-opacity=".8" aria-pressed="false">Plus présent · 80 %</button><button data-opacity=".85" aria-pressed="false">85 %</button><button data-opacity=".9" aria-pressed="false">90 %</button><button data-opacity=".95" aria-pressed="false">95 %</button><button data-opacity="1" aria-pressed="true">100 %</button></nav>
<p class="label">Mouvement de la peinture et dérive du fond</p>
<nav aria-label="Mouvement du fond"><button data-motion="boucle" aria-pressed="false">Boucle douce · nouvel essai</button><button data-motion="pigments" aria-pressed="false">Pigments seuls</button><button data-motion="fixe" aria-pressed="true">Fond fixe</button><button data-motion="actuel" aria-pressed="false">Dérive actuelle</button><button data-motion="vivant" aria-pressed="false">Dérive renforcée</button><button data-motion="respiration" aria-pressed="false">Respiration lente</button><button data-motion="lateral" aria-pressed="false">Dérive latérale</button><button data-motion="pause" aria-pressed="false">Pause</button></nav>
<p><span id="etat" aria-live="polite">100 %</span> — <span id="mouvement-etat" aria-live="polite">Préparation du mouvement…</span></p>
<p id="reglage-cycle" hidden><label for="cycle">Durée du cycle : <output id="cycle-valeur">72 s</output></label> <input id="cycle" type="range" min="48" max="120" step="12" value="72"> <span class="note">Vers la droite : plus lent.</span></p>
<p id="chargement" role="status">Préparation…</p>
<label class="vue-bulles"><input type="checkbox" id="afficher-bulles"> Afficher les bulles sur le fond</label>
<div class="scene fond-seul"><div class="peinture" aria-hidden="true"><img class="fond-image" alt="" src="${data('fond-16x9.webp','webp')}"><canvas class="video-surface"></canvas><canvas class="pigment-surface"></canvas><video muted loop playsinline preload="auto" poster="${data('fond-16x9.webp','webp')}" src="${videoData}"></video></div></div>
<details><summary>Ce que cet essai permet de comparer</summary><p class="note">« Boucle douce » part de l'image fixe d'origine. De petits déplacements cycliques de la couleur sont calculés localement, avec des phases différentes selon les zones et le grain fin réappliqué à sa position initiale. La position et la vitesse du mouvement se raccordent à chaque cycle. C'est une interprétation animée de la peinture, pas une simulation physique de diffusion ni une vidéo Higgsfield. Son naturel reste à juger visuellement. Le cadre est fixe.</p><p class="note">Les autres mouvements réutilisent la vidéo existante (environ 14,54 secondes) : Pigments seuls garde le cadre immobile ; les dérives et la respiration ajoutent un déplacement ou un zoom. La répétition de cette vidéo ne garantit pas que son raccord soit invisible.</p><p class="note">Ceci est une planche d'étude animée, pas la constellation complète. Atmosphère, fibres du fond, masque autour du logo et déplacements des bulles ne sont pas reproduits. Les bulles sont à pleine opacité. Les tailles nominales 34 et 38 px viennent des bases mobile et ordinateur ; 64 px sert à examiner les détails. Le recadrage du fond dépend de cette planche.</p><p class="note">L'animation se met en pause lorsque l'onglet est masqué. Si ton système demande moins d'animations, l'essai démarre sur l'image fixe ; tu peux lancer volontairement un aperçu. La version mobile du musée actuel utilise une image fixe.</p></details>
<p class="note">0 crédit Higgsfield consommé · Site inchangé · 100 % + pigments seuls validés provisoirement ; nouvelle boucle à évaluer.</p>
</main><script type="module">${result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script></html>`;

fs.writeFileSync(path.join(root,'../reconstruits/Essai_lisibilite_00_81_95.html'),html);console.log('Essai autonome créé');
})().catch(e=>{console.error(e);process.exitCode=1});
