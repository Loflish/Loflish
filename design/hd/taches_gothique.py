"""
Matières de la planche 4 — une image de Flow (encre sur papier blanc, un disque) devient une matière de bulle.
Contrairement aux autres planches, le gris reste une vraie encre : il descend jusqu'au presque noir, et paintTache
le multiplie pleinement par la couleur de la personne (voir MATIERE_ENCRE dans src/lib/hd.ts).

  python3 taches_gothique.py <dossier_images> <plan.json>
    dossier_images : 001.jpg, 002.jpg…
    plan.json : [{ "n": 1, "nom": "…", "famille": "…" }, …]
  → public/hd/taches-gothique/gothique-001.webp … (768 × 768) et index.json, lu par les ateliers
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

OUT = Path(__file__).resolve().parents[2] / 'public' / 'hd' / 'taches-gothique'
S = 768
DISQUE = 0.82  # paintTache : la tache occupe ~82 % de sa vignette
ENCRE = 0.1  # gris le plus sombre : la couleur de la personne tombe à 10 %
MASSE = 0.38  # force des grandes masses d'encre
FIL = 1.45  # force des fils, par-dessus les masses
VOILE = 0.36  # alpha minimal dans le disque : même le plus pâle reste de la couleur (presque double au passage multiply) ; plus bas, le côté pâle fait un reflet et la bulle devient une bille


def matiere(chemin):
    g = np.asarray(Image.open(chemin).convert('L')).astype(float)
    papier = np.median(np.concatenate([c.ravel() for c in (g[:24, :24], g[:24, -24:], g[-24:, :24], g[-24:, -24:])]))
    d = np.clip(papier - g, 0, 255)

    # le disque : ce qui n'est pas du papier, trous bouchés, plus grande pièce
    disque = ndi.binary_fill_holes(ndi.binary_closing(ndi.gaussian_filter(d, 4) > 4, iterations=8))
    pieces, k = ndi.label(disque)
    disque = pieces == 1 + np.argmax(ndi.sum(disque, pieces, range(1, k + 1)))
    ys, xs = np.where(disque)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    cote = int(round((max(np.ptp(xs), np.ptp(ys)) + 1) / DISQUE))

    def recadre(tableau, fond, mode):
        toile = Image.new('L', (cote, cote), fond)
        toile.paste(Image.fromarray(tableau.astype(np.uint8)), (int(round(cote / 2 - cx)), int(round(cote / 2 - cy))))
        return np.asarray(toile.resize((S, S), mode)).astype(float)

    v = recadre(np.clip(d, 0, 255), 0, Image.LANCZOS)
    garde = ndi.gaussian_filter(recadre(disque * 255, 0, Image.BILINEAR) / 255, 2)

    a = np.clip(v / np.percentile(v[garde > 0.9], 99.5), 0, 1)
    # Tom trouvait la planche sombre : seules les grandes masses s'allègent, les fils gardent leur force
    # le flou reste dans le disque : le papier blanc autour ferait croire à un bord noir
    masses = ndi.gaussian_filter(a * garde, S / 40) / np.maximum(ndi.gaussian_filter(garde, S / 40), 1e-3)
    a = np.clip(masses * MASSE + (a - masses) * FIL, 0, 1)
    gris = 1 - (1 - ENCRE) * a ** 0.9
    alpha = np.clip(VOILE + (1 - VOILE) * a ** 0.7, 0, 1) * garde
    return Image.fromarray(np.dstack([gris * 255, gris * 255, gris * 255, alpha * 255]).astype(np.uint8), 'RGBA')


if __name__ == '__main__':
    dossier, plan = Path(sys.argv[1]), json.loads(Path(sys.argv[2]).read_text(encoding='utf8'))
    OUT.mkdir(exist_ok=True)
    pretes = []
    for d in plan:
        image = dossier / f"{d['n']:03d}.jpg"
        if not image.exists():
            print('manque', image.name)
            continue
        matiere(image).save(OUT / f"gothique-{d['n']:03d}.webp", quality=90, method=4)
        pretes.append(d)
    (OUT / 'index.json').write_text(json.dumps(pretes, ensure_ascii=False), encoding='utf8')
    print(len(pretes), 'matières prêtes')
