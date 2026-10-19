const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const inventory=JSON.parse(fs.readFileSync(path.join(root,'inventaire.json'),'utf8'));
let checked=0;
for(const item of inventory.fichiers){
 const file=path.resolve(root,item.fichier);
 if(!file.startsWith(root+path.sep))throw Error('Chemin hors archive');
 const data=fs.readFileSync(file);
 const hash=crypto.createHash('sha256').update(data).digest('hex');
 if(data.length!==item.octets||hash!==item.sha256)throw Error('Fichier différent : '+item.fichier);
 checked++;
}
console.log(`PASS : ${checked} fichiers conformes à l'inventaire SHA-256.`);
