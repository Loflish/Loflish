import { bubbleSprite, clearSpriteCache } from './site/src/engine/bubbleSprite';
import { loadCatalogue } from './site/src/lib/hd';
import { GRIS_PALETTE } from './site/src/lib/palette';

const select = document.querySelector<HTMLSelectElement>('#couleur')!;
const filtre = document.querySelector<HTMLInputElement>('#selection')!;
const grid = document.querySelector<HTMLDivElement>('#matieres')!;
const status = document.querySelector<HTMLElement>('#etat')!;
const count = document.querySelector<HTMLElement>('#compteur')!;
const selected = new Set<number>();
const cells: { node: HTMLElement; images: HTMLImageElement[]; n: number }[] = [];
for (const p of GRIS_PALETTE) {
  const option = document.createElement('option');
  option.value = p.hex;
  option.textContent = `${p.label} · ${p.hex}`;
  select.append(option);
}

function updateSelection() {
  count.textContent = selected.size ? `À discuter : ${[...selected].sort((a,b)=>a-b).join(', ')}` : 'Aucune matière marquée.';
  for (const c of cells) c.node.hidden = filtre.checked && !selected.has(c.n);
}

async function render() {
  clearSpriteCache();
  status.textContent = 'Préparation des aperçus…';
  select.disabled = true;
  for (const c of cells) {
    const source = bubbleSprite('atelier-reference-commune', select.value, {matiere:c.n,size:208});
    const data = source.toDataURL('image/png');
    for (const img of c.images) img.src = data;
    if(c.n % 10 === 0) await new Promise<void>(resolve => requestAnimationFrame(()=>resolve()));
  }
  status.textContent = '101 matières préparées · 0 crédit consommé';
  select.disabled = false;
}

await loadCatalogue();
for(let n=0; n<=100; n++) {
  const card=document.createElement('article');
  card.className='matiere';
  const header=document.createElement('div'); header.className='card-top';
  const title=document.createElement('h2'); title.textContent=n===0?'00 · Aquarelle cousue':String(n).padStart(2,'0');
  const label=document.createElement('label'); label.className='mark';
  const check=document.createElement('input');check.type='checkbox';check.setAttribute('aria-label',`Marquer la matière ${n} pour en discuter`);
  check.addEventListener('change',()=>{if(check.checked)selected.add(n);else selected.delete(n);updateSelection();});
  label.append(check,document.createTextNode('À discuter'));
  header.append(title,label);card.append(header);
  const samples=document.createElement('div');samples.className='samples';
  const images:HTMLImageElement[]=[];
  for(const [diameter,caption] of [[32,'32 px'],[64,'64 px'],[128,'128 px']] as const) {
    const figure=document.createElement('figure');
    const area=document.createElement('div');area.className='sample';
    const img=document.createElement('img');img.alt=`Matière ${n}, diamètre nominal ${diameter} pixels`;img.width=diameter/.6;img.height=diameter/.6;
    const figcaption=document.createElement('figcaption');figcaption.textContent=caption;
    area.append(img);figure.append(area,figcaption);samples.append(figure);images.push(img);
  }
  card.append(samples);grid.append(card);cells.push({node:card,images,n});
}
select.addEventListener('change',()=>void render());
filtre.addEventListener('change',updateSelection);
await render();
