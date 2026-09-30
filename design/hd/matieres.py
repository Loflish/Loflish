"""
Matières des bulles — découpe les planches de 3 × 3 (Higgsfield) en taches.

Chaque planche est une famille de techniques (shibori, suminagashi, gestes du
pinceau, broderie…) dont les neuf cercles sont tous différents : les bulles se
distinguent d'un coup d'œil. Les taches restent monochromes ; le site les
teint dans la couleur GRIS exacte de chaque personne.

La grille est trouvée par les gouttières blanches entre les cercles (pas par
les formes, qui peuvent être ajourées : anneaux, points, lignes). Chaque tache
est remise à la même taille par son contour extérieur (toutes les bulles ont la
même taille visible), et sa texture interne est gardée : les lignes blanches
d'un shibori restent des jours dans la couleur.

  python3 matieres.py <premier_numéro> <planche[:cases_écartées][@grain]> …
    ex. matieres.py 1 shibori.png suminagashi.png:7 broderie.png@28
    (cases numérotées de 1 à 9, de gauche à droite puis de haut en bas ;
     @grain fixe le grain du support à retirer, pour un lin très texturé)
  → public/hd/taches/tache-NN.webp (256 × 256)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

OUT = Path(__file__).resolve().parents[2] / 'public' / 'hd' / 'taches'
S = 256  # les bulles ne dépassent jamais 208 px à l'écran
DIAM = 0.82  # la tache occupe 82 % de sa vignette (comme dans bubbleSprite)


def gouttieres(prof, n):
    """Les deux creux les plus blancs entre les trois rangées (ou colonnes)."""
    p = ndi.uniform_filter1d(prof, max(3, n // 60))
    a = int(np.argmin(p[int(n * 0.22):int(n * 0.45)])) + int(n * 0.22)
    b = int(np.argmin(p[int(n * 0.55):int(n * 0.78)])) + int(n * 0.55)
    return [0, a, b, n]


def planche(chemin, ecartees, n, grain_fixe=None):
    g = np.asarray(Image.open(chemin).convert('L')).astype(float)
    H, W = g.shape
    # le papier ou le tissu n'est pas uniforme : son ton est suivi à grande échelle
    fond = ndi.zoom(ndi.percentile_filter(g[::16, ::16], 92, size=25), 16, order=1)[:H, :W]
    d = np.clip(fond - g, 0, 255)
    d = ndi.gaussian_filter(d, 0.8)
    encre = d > 16
    ys, xs = gouttieres(encre.mean(1), H), gouttieres(encre.mean(0), W)
    y, x = np.mgrid[0:S, 0:S]
    bord = np.clip((1.0 - np.hypot(x - S / 2 + 0.5, y - S / 2 + 0.5) / (S / 2)) / 0.1, 0, 1)
    case = 0
    for i in range(3):
        for j in range(3):
            case += 1
            if case in ecartees:
                continue
            y0, y1, x0, x1 = ys[i], ys[i + 1], xs[j], xs[j + 1]
            c = d[y0:y1, x0:x1]
            # le grain du support (un lin très texturé passerait pour de l'encre) : mesuré sur le
            # pourtour de la case, toujours vide, puis retiré partout
            b = max(8, int(min(c.shape) * 0.06))
            pourtour = np.concatenate([c[:b].ravel(), c[-b:].ravel(), c[:, :b].ravel(), c[:, -b:].ravel()])
            grain = grain_fixe if grain_fixe is not None else float(np.percentile(pourtour, 80))
            c = np.clip(c - grain, 0, None)
            # la silhouette : l'encre, refermée largement (points, lignes, jours), trous bouchés
            k = 8
            petit = c[::k, ::k] > 12
            sil = ndi.binary_fill_holes(ndi.binary_closing(petit, iterations=6, border_value=0))
            lab, nb = ndi.label(sil)
            if not nb:
                continue
            sil = lab == (np.argmax(ndi.sum(sil, lab, range(1, nb + 1))) + 1)
            yy, xx = np.nonzero(sil)
            cy, cx = (yy.min() + yy.max() + 1) / 2 * k, (xx.min() + xx.max() + 1) / 2 * k
            diam = max(yy.max() - yy.min() + 1, xx.max() - xx.min() + 1) * k
            cote = int(diam / DIAM)
            # un disque autour de la silhouette : rien du papier alentour ne passe
            yy2, xx2 = np.mgrid[0:c.shape[0], 0:c.shape[1]]
            disque = np.clip((diam * 0.52 - np.hypot(yy2 - cy, xx2 - cx)) / (diam * 0.02), 0, 1)
            c = c * disque
            ty, tx = int(cy - cote / 2), int(cx - cote / 2)
            pad = np.zeros((cote, cote))
            sy0, sx0 = max(0, ty), max(0, tx)
            sy1, sx1 = min(c.shape[0], ty + cote), min(c.shape[1], tx + cote)
            pad[sy0 - ty:sy1 - ty, sx0 - tx:sx1 - tx] = c[sy0:sy1, sx0:sx1]
            hi = np.percentile(pad[pad > 6], 97) if (pad > 6).any() else 1
            a = np.clip(pad / hi, 0, 1) ** 0.85
            alpha = np.clip(a * 1.12, 0, 1)  # la texture interne reste lisible dans la couleur
            teinte = 255 - a * 110
            im = Image.fromarray(np.dstack([teinte, teinte, teinte, alpha * 255]).astype(np.uint8), 'RGBA')
            im = im.resize((S, S), Image.LANCZOS)
            A = np.asarray(im).astype(float)
            A[..., 3] *= bord  # jamais coupée net par le bord de sa vignette
            n += 1
            Image.fromarray(A.astype(np.uint8), 'RGBA').save(OUT / f'tache-{n:02d}.webp', quality=78, method=4)
    return n


if __name__ == '__main__':
    n = int(sys.argv[1]) - 1
    for arg in sys.argv[2:]:
        arg, _, g = arg.partition('@')
        chemin, _, ec = arg.partition(':')
        n = planche(chemin, {int(e) for e in ec.split(',') if e}, n, float(g) if g else None)
        print(chemin, '→ jusqu’à', n)
