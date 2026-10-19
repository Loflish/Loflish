import {bubbleSprite} from '../../../../src/engine/bubbleSprite';
import {loadCatalogue} from '../../../../src/lib/hd';
import {createPigmentLoop} from './boucle-pigments';

await loadCatalogue();
const stage=document.querySelector<HTMLElement>('.scene')!;
const rows=[{n:0,label:'00 · Aquarelle cousue'},{n:81,label:'81 · Touches peintes'},{n:95,label:'95 · Plis'}];
const colors=['#4B6097','#DFABA4','#F6C761'];
for(const row of rows){
 const group=document.createElement('section');
 const h=document.createElement('h2');h.textContent=row.label;group.append(h);
 for(let i=0;i<3;i++){
  const cell=document.createElement('figure');
  for(const d of [34,38,64]){
   const img=document.createElement('img');img.src=bubbleSprite('essai-lisibilite-commun',colors[i],{matiere:row.n,size:208}).toDataURL();img.width=d/.6;img.height=d/.6;img.alt=`Matière ${row.n}, couleur ${colors[i]}, ${d} pixels`;cell.append(img);
  }
  const caption=document.createElement('figcaption');caption.textContent=['Bleu de l’aube','Pétale','Soleil doux'][i]+' · 34 / 38 / 64 px';cell.append(caption);group.append(cell);
 }
 stage.append(group);
}
for(const button of document.querySelectorAll<HTMLButtonElement>('button[data-opacity]')){
 button.addEventListener('click',()=>{
  stage.style.setProperty('--fond',button.dataset.opacity!);
  document.querySelectorAll('button[data-opacity]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  document.querySelector('#etat')!.textContent=button.textContent!;
 });
}
const video=document.querySelector<HTMLVideoElement>('video')!;
const surface=document.querySelector<HTMLCanvasElement>('.peinture .video-surface')!;
const paint=surface.getContext('2d',{alpha:false})!;
const loopSurface=document.querySelector<HTMLCanvasElement>('.pigment-surface')!;
let loopRenderer:Awaited<ReturnType<typeof createPigmentLoop>>|undefined;
try{loopRenderer=await createPigmentLoop(loopSurface,document.querySelector<HTMLImageElement>('.fond-image')!);}catch(e){console.warn('Boucle locale indisponible',String(e));}
const showBubbles=document.querySelector<HTMLInputElement>('#afficher-bulles')!;
showBubbles.addEventListener('change',()=>stage.classList.toggle('fond-seul',!showBubbles.checked));
let previousFrame=0;
let lastTick=0;
let turn=0;
const cycle=document.querySelector<HTMLInputElement>('#cycle')!;
cycle.addEventListener('input',()=>{document.querySelector('#cycle-valeur')!.textContent=cycle.value+' s';});
function drawVideo(now:number){
 const delta=lastTick?Math.min(now-lastTick,100):0;lastTick=now;
 if(!document.hidden && mode==='boucle' && loopRenderer?.available()){
  turn+=delta/(Number(cycle.value)*1000);
  if(now-previousFrame>=50){loopRenderer.draw(turn);loopSurface.style.visibility='visible';previousFrame=now;}
 }else if(!document.hidden && mode!=='fixe' && mode!=='pause' && mode!=='boucle' && video.readyState>=2 && now-previousFrame>=50){
  const width=1280;
  const height=Math.round(width*video.videoHeight/video.videoWidth);
  if(surface.width!==width||surface.height!==height){surface.width=width;surface.height=height;}
  try{paint.drawImage(video,0,0,width,height);surface.style.visibility='visible';previousFrame=now;}catch{surface.style.visibility='hidden';}
 }
 requestAnimationFrame(drawVideo);
}
const fond=document.querySelector<HTMLElement>('.peinture')!;
const motionButtons=document.querySelectorAll<HTMLButtonElement>('button[data-motion]');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let mode='pause';
const modes:Record<string,{animation:string;duration:number;rate:number;text:string}>={
 boucle:{animation:'none',duration:72,rate:1,text:'Essai : les zones peintes évoluent doucement, à des rythmes décalés. Cadre immobile et boucle continue ; durée réglable ci-dessous.'},
 actuel:{animation:'derive',duration:140,rate:1,text:'Dérive diagonale lente et pigments à vitesse normale.'},
 vivant:{animation:'derive',duration:90,rate:1.15,text:'Dérive diagonale plus présente et pigments accélérés de 15 %.'},
 pigments:{animation:'none',duration:140,rate:1,text:'Pigments seuls : peinture animée, cadre immobile. Le mouvement interne reste celui de la vidéo existante.'},
 respiration:{animation:'respiration',duration:60,rate:1,text:'Respiration : rapprochement et éloignement très lents, pigments à vitesse normale.'},
 lateral:{animation:'lateral',duration:75,rate:1,text:'Dérive latérale : translation horizontale douce, pigments à vitesse normale.'},
};
function motion(next:string){
 mode=next;
 const config=modes[next];
 if(config){fond.style.animationName=config.animation;fond.style.animationDuration=config.duration+'s';}
 if(next!=='pause'){loopSurface.style.visibility='hidden';surface.style.visibility='hidden';}
 fond.style.animationPlayState=(next==='pause'||next==='fixe')?'paused':'running';
 if(next==='fixe'){fond.style.animationName='none';surface.style.visibility='hidden';}
 video.playbackRate=config?.rate??1;
 if(next==='pause'||next==='fixe'||next==='boucle')video.pause();else void video.play().catch(()=>{surface.style.visibility='hidden';document.querySelector('#mouvement-etat')!.textContent='Vidéo indisponible : le fond fixe reste affiché.';});
 motionButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.motion===next)));
 document.querySelector('#mouvement-etat')!.textContent=next==='fixe'?'Image fixe : comparer les intensités, puis choisir un mouvement.':next==='pause'?'Mouvement en pause':config.text;
 document.querySelector<HTMLElement>('#reglage-cycle')!.hidden=next!=='boucle';
 if(next==='boucle'&&!loopRenderer?.available())document.querySelector('#mouvement-etat')!.textContent='Animation locale indisponible : image fixe affichée. Le mouvement « Pigments seuls » reste disponible.';
}
motionButtons.forEach(b=>b.addEventListener('click',()=>motion(b.dataset.motion!)));
reduced.addEventListener('change',e=>{if(e.matches)motion('pause');});
document.addEventListener('visibilitychange',()=>{if(document.hidden){video.pause();fond.style.animationPlayState='paused';}else motion(mode);});
motion(reduced.matches?'fixe':'boucle');
requestAnimationFrame(drawVideo);
document.querySelector('#chargement')!.textContent='Vos trois références · mêmes bulles, mêmes couleurs, mêmes positions';
