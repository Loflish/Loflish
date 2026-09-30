"""
Prépare les matières HD générées avec Higgsfield pour le site.

Usage : python3 preparer.py <dossier_source>
  0.png  fond peint 16:9      → public/hd/fond-16x9.webp
  1.png  fond peint 9:16      → public/hd/fond-9x16.webp
  2.png  lin                  → public/hd/lin.webp (rendu raccordable)
  3.png, 4.png  planches de 9 taches → public/hd/taches/tache-01…18.webp

Les taches sont gardées monochromes : le site les teinte ensuite dans la
couleur GRIS exacte de chaque personne (alpha = quantité de pigment,
gris = densité).
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
out = Path(__file__).resolve().parents[2] / 'public' / 'hd'
(out / 'taches').mkdir(parents=True, exist_ok=True)

def fit(im, w):
    return im.resize((w, round(im.size[1] * w / im.size[0])), Image.LANCZOS)

# fonds
fit(Image.open(src / '0.png').convert('RGB'), 2560).save(out / 'fond-16x9.webp', quality=82, method=6)
fit(Image.open(src / '1.png').convert('RGB'), 1440).save(out / 'fond-9x16.webp', quality=82, method=6)

# lin raccordable : fondu croisé avec sa copie décalée d'une demi-tuile
lin = Image.open(src / '2.png').convert('RGB')
s = min(lin.size)
lin = np.asarray(lin.crop((0, 0, s, s)).resize((1024, 1024), Image.LANCZOS)).astype(float)
shift = np.roll(np.roll(lin, 512, 0), 512, 1)
y, x = np.mgrid[0:1024, 0:1024]
edge = np.minimum(np.minimum(x, 1023 - x), np.minimum(y, 1023 - y)) / 512.0
w = np.clip(edge * 2.2, 0, 1)[..., None]
tile = lin * w + shift * (1 - w)
tile = tile - tile.mean(axis=(0, 1)) + np.array([232, 227, 216])  # neutre, ton lin
Image.fromarray(np.clip(tile, 0, 255).astype(np.uint8)).save(out / 'lin.webp', quality=86, method=6)

# taches
n = 0
for sheet in ['3.png', '4.png']:
    g = np.asarray(Image.open(src / sheet).convert('L')).astype(float)
    bg = np.percentile(g, 92)
    d = np.clip(bg - g, 0, 255)
    mask = ndi.binary_closing(d > 14, iterations=4)
    mask = ndi.binary_fill_holes(mask)
    lab, k = ndi.label(mask)
    sizes = ndi.sum(mask, lab, range(1, k + 1))
    keep = np.argsort(sizes)[::-1][:9] + 1
    for c in sorted(keep, key=lambda c: tuple(np.round(np.array(ndi.center_of_mass(mask, lab, c)) / 300))):
        ys, xs = np.nonzero(lab == c)
        cy, cx = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2
        diam = max(ys.max() - ys.min(), xs.max() - xs.min())
        side = int(diam / 0.82)
        y0, x0 = int(cy - side / 2), int(cx - side / 2)
        pad = np.zeros((side, side))
        crop = d[max(0, y0):y0 + side, max(0, x0):x0 + side]
        m = (lab[max(0, y0):y0 + side, max(0, x0):x0 + side] == c)
        crop = ndi.gaussian_filter(crop, 0.6) * ndi.binary_dilation(m, iterations=6)
        pad[max(0, -y0):max(0, -y0) + crop.shape[0], max(0, -x0):max(0, -x0) + crop.shape[1]] = crop
        hi = np.percentile(pad[pad > 3], 98) if (pad > 3).any() else 1
        a = np.clip(pad / hi, 0, 1) ** 0.8
        alpha = np.clip(a * 1.35, 0, 1)                 # quantité de pigment
        shade = 255 - a * 105                            # densité (sert au multiply)
        rgba = np.dstack([shade, shade, shade, alpha * 255]).astype(np.uint8)
        n += 1
        Image.fromarray(rgba, 'RGBA').resize((512, 512), Image.LANCZOS).save(out / 'taches' / f'tache-{n:02d}.webp', lossless=False, quality=90)
print('taches :', n)
