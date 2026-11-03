"""
Matières des bulles en 1 024 px (chantier 2, 3 novembre 2026) : la même découpe que matieres.py, mais depuis la case
d'origine de chaque tache dans sa planche 4K (research_notes/Planche 4/outils/origines-taches.json), en 1 024 px au lieu
de 512. La page d'une trace (bulle de 418 px, peinte en 920 px) et le zoom gagnent le grain ; la constellation garde 512.

  python design/hd/matieres_1024.py [numéros…]      (sans numéro : les 100)
  → public/hd/taches/1024/tache-NN.webp

Les six matières sans perte (15, 50, 70, 81, 85, 95) viennent d'une autre source approuvée : elles ne sont pas refaites ici.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

RACINE = Path(__file__).resolve().parents[2]
ORIGINES = RACINE.parent / 'research_notes' / 'Planche 4' / 'outils' / 'origines-taches.json'
PLANCHES = RACINE.parent / '.claude' / 'nmm-inspiration' / 'higgsfield' / 'compte-complet-2026-10-30' / 'images'
OUT = RACINE / 'public' / 'hd' / 'taches' / '1024'
S = 1024
DIAM = 0.82
SANS_PERTE = {15, 50, 70, 81, 85, 95}


def fond_et_encre(g):
    """Comme matieres.py : le ton du support suivi à grande échelle, puis l'encre = ce qui est plus sombre."""
    H, W = g.shape
    taille = max(25, int(min(H, W) / 16 * 0.45))
    fond = ndi.zoom(ndi.percentile_filter(g[::16, ::16], 92, size=taille), 16, order=1)[:H, :W]
    d = np.clip(fond - g, 0, 255)
    return ndi.gaussian_filter(d, 0.8)


def tache(c):
    b = max(8, int(min(c.shape) * 0.06))
    pourtour = np.concatenate([c[:b].ravel(), c[-b:].ravel(), c[:, :b].ravel(), c[:, -b:].ravel()])
    grain = float(np.percentile(pourtour, 80))
    c = np.clip(c - grain, 0, None)
    k = 8
    petit = c[::k, ::k] > 12
    sil = ndi.binary_fill_holes(ndi.binary_closing(petit, iterations=6, border_value=0))
    lab, nb = ndi.label(sil)
    if not nb:
        return None
    sil = lab == (np.argmax(ndi.sum(sil, lab, range(1, nb + 1))) + 1)
    yy, xx = np.nonzero(sil)
    cy, cx = (yy.min() + yy.max() + 1) / 2 * k, (xx.min() + xx.max() + 1) / 2 * k
    diam = max(yy.max() - yy.min() + 1, xx.max() - xx.min() + 1) * k
    cote = int(diam / DIAM)
    yy2, xx2 = np.mgrid[0 : c.shape[0], 0 : c.shape[1]]
    disque = np.clip((diam * 0.52 - np.hypot(yy2 - cy, xx2 - cx)) / (diam * 0.02), 0, 1)
    c = c * disque
    ty, tx = int(cy - cote / 2), int(cx - cote / 2)
    pad = np.zeros((cote, cote))
    sy0, sx0 = max(0, ty), max(0, tx)
    sy1, sx1 = min(c.shape[0], ty + cote), min(c.shape[1], tx + cote)
    pad[sy0 - ty : sy1 - ty, sx0 - tx : sx1 - tx] = c[sy0:sy1, sx0:sx1]
    hi = np.percentile(pad[pad > 6], 97) if (pad > 6).any() else 1
    a = np.clip(pad / hi, 0, 1) ** 0.85
    alpha = np.clip(a * 1.12, 0, 1)
    teinte = 255 - a * 110
    im = Image.fromarray(np.dstack([teinte, teinte, teinte, alpha * 255]).astype(np.uint8), 'RGBA')
    im = im.resize((S, S), Image.LANCZOS)
    y, x = np.mgrid[0:S, 0:S]
    bord = np.clip((1.0 - np.hypot(x - S / 2 + 0.5, y - S / 2 + 0.5) / (S / 2)) / 0.1, 0, 1)
    A = np.asarray(im).astype(float)
    A[..., 3] *= bord
    return Image.fromarray(A.astype(np.uint8), 'RGBA')


def main():
    origines = json.loads(ORIGINES.read_text(encoding='utf-8'))
    voulus = [int(a) for a in sys.argv[1:]] or sorted(int(k) for k in origines)
    OUT.mkdir(parents=True, exist_ok=True)
    encres = {}
    faits, sautes = 0, []
    for n in voulus:
        o = origines.get(str(n))
        if not o or n in SANS_PERTE:
            sautes.append(n)
            continue
        chemin = PLANCHES / o['planche']
        if chemin not in encres:
            g = np.asarray(Image.open(chemin).convert('L')).astype(float)
            encres[chemin] = fond_et_encre(g)
        d = encres[chemin]
        x, y, cote = o['x'], o['y'], o['cote']
        # une marge autour de la case : le pourtour sert à mesurer le grain du support
        m = int(cote * 0.08)
        c = d[max(0, y - m) : y + cote + m, max(0, x - m) : x + cote + m]
        im = tache(c)
        if im is None:
            sautes.append(n)
            continue
        im.save(OUT / f'tache-{n:02d}.webp', quality=80, method=4)
        faits += 1
        print(f'tache-{n:02d}', 'depuis', o['planche'][:18], 'case', o['case'], 'score', o['score'])
    print(f'{faits} matières en 1 024 px ; sautées : {sautes}')


if __name__ == '__main__':
    main()
