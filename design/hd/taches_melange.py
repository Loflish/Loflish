"""
Matières du mélange — une image de Flow (une tache de la palette A repeinte avec un détail de vie caché dedans)
devient une matière de bulle, avec la recette de matieres.py. Pas de recadrage : Flow garde la tache à sa place,
et le contour de la tache d'origine sert de garde (ni grain du papier ni trace hors de la tache).

  python3 taches_melange.py <dossier_images> <plan.json>
    dossier_images : 001.jpg … 100.jpg
    plan.json : [{ "n": 1, "tache": 61, "fr": "…", "famille": "…" }, …]
  → public/hd/taches-melange/melange-001.webp … (512 × 512) et index.json, lu par l'atelier du mélange
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HD = Path(__file__).resolve().parents[2] / 'public' / 'hd'
OUT = HD / 'taches-melange'
S = 512


def contour(tache):
    # les six taches remplacées et validées sont en PNG, leur ancien WebP n'est plus affiché (matieresSansPerte, src/lib/hd.ts)
    png = HD / 'taches' / f'tache-{tache:02d}.png'
    alpha = Image.open(png if png.exists() else png.with_suffix('.webp')).convert('RGBA').getchannel('A')
    a = np.asarray(alpha.resize((S, S), Image.LANCZOS)).astype(float) / 255
    return np.clip(ndi.gaussian_filter(a, 3) * 5, 0, 1)


def matiere(chemin, tache):
    g = np.asarray(Image.open(chemin).convert('L').resize((S, S), Image.LANCZOS)).astype(float)
    garde = contour(tache)
    d = np.clip(np.percentile(g[garde == 0], 80) - g, 0, 255) * garde
    a = np.clip(d / np.percentile(d[d > 6], 99), 0, 1) ** 0.85
    teinte = 255 - a * 110
    return Image.fromarray(np.dstack([teinte, teinte, teinte, np.clip(a * 1.12, 0, 1) * 255]).astype(np.uint8), 'RGBA')


if __name__ == '__main__':
    dossier, plan = Path(sys.argv[1]), json.loads(Path(sys.argv[2]).read_text(encoding='utf8'))
    OUT.mkdir(exist_ok=True)
    pretes = []
    for d in plan:
        image = dossier / f"{d['n']:03d}.jpg"
        if not image.exists():
            print('manque', image.name)
            continue
        matiere(image, d['tache']).save(OUT / f"melange-{d['n']:03d}.webp", quality=88, method=4)
        pretes.append(d)
    (OUT / 'index.json').write_text(json.dumps(pretes, ensure_ascii=False), encoding='utf8')
    print(len(pretes), 'matières prêtes')
