"""
Le catalogue des bulles du site (5 novembre 2026) : les bulles que Tom aime dans les planches 2 et 3
(design/atelier-bulles.json, avis « aime »), moins les doublons qu'il a retirés (design/doublons-choix.json),
copiées sous des numéros stables dans public/hd/taches-catalogue/ (palette M de src/lib/hd.ts, 1001 et suivants).

  python design/hd/catalogue.py
  → public/hd/taches-catalogue/cat-NN.webp + index.json [{ n, origine, planche, nom }]

Un numéro, une fois donné, ne change plus : l'index existant est relu, les nouvelles bulles prennent les numéros
suivants, les retirées disparaissent de l'index (leur numéro reste réservé). Les traces qui ont choisi une matière
gardent leur numéro.
"""
import json
import shutil
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
HD = RACINE / 'public' / 'hd'
OUT = HD / 'taches-catalogue'
MELANGE, CLAUDE = 3000, 4000


def main():
    avis = json.loads((RACINE / 'design' / 'atelier-bulles.json').read_text(encoding='utf-8'))
    choix = json.loads((RACINE / 'design' / 'doublons-choix.json').read_text(encoding='utf-8'))
    retirees = set(choix.get('retirees', []))
    melange = {d['n']: d for d in json.loads((HD / 'taches-melange' / 'index.json').read_text(encoding='utf-8'))}
    claude = {d['n']: d for d in json.loads((HD / 'taches-claude' / 'index.json').read_text(encoding='utf-8'))}
    voulues = []
    for k, v in avis.items():
        n = int(k)
        if v.get('avis') != 'aime' or n in retirees:
            continue
        if MELANGE < n <= MELANGE + 100:
            d = melange[n - MELANGE]
            voulues.append(dict(origine=n, planche=2, nom=d['fr'], source=HD / 'taches-melange' / f"melange-{d['n']:03d}.webp"))
        elif CLAUDE < n <= CLAUDE + 100:
            d = claude[n - CLAUDE]
            voulues.append(dict(origine=n, planche=3, nom=d['nom'], source=HD / 'taches-claude' / d['f']))
    voulues.sort(key=lambda b: b['origine'])
    OUT.mkdir(exist_ok=True)
    ancien = {d['origine']: d['n'] for d in json.loads((OUT / 'index.json').read_text(encoding='utf-8'))} if (OUT / 'index.json').exists() else {}
    prochain = max(ancien.values(), default=0) + 1
    index = []
    for b in voulues:
        n = ancien.get(b['origine'])
        if n is None:
            n, prochain = prochain, prochain + 1
        shutil.copyfile(b['source'], OUT / f'cat-{n:02d}.webp')
        index.append(dict(n=n, origine=b['origine'], planche=b['planche'], nom=b['nom']))
    gardes = {f'cat-{d["n"]:02d}.webp' for d in index} | {'index.json'}
    for f in OUT.iterdir():
        if f.name not in gardes:
            f.unlink()
    (OUT / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=0), encoding='utf-8')
    print(len(index), 'matières dans le catalogue ; dernier numéro', max(d['n'] for d in index), '; retirées :', len(retirees))


if __name__ == '__main__':
    main()
