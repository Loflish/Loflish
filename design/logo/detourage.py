"""
Détourage du logo brodé « Nos mots mémoriaux » depuis une photo du tableau.

Usage :  python3 detourage.py photo_du_tableau.jpg
(dépendances : pillow, numpy, scipy)

Principe : on estime le satin de fond (filtre médian), on isole le fil par sa
densité et sa chroma rouge, on garde un alpha doux pour préserver fibres,
points et irrégularités, puis on ramène le fil vers un bordeaux cohérent en
conservant ses variations de lumière. Aucune vectorisation.

Les coordonnées de recadrage (lignes « c = im[...] » et zones de nettoyage)
correspondent à la photo actuelle (2000×1500, tournée de 90°) : à ajuster
pour le scan définitif.
"""
import sys
from PIL import Image
import numpy as np
from scipy import ndimage as ndi

src = sys.argv[1] if len(sys.argv) > 1 else 'photo.webp'
im = np.asarray(Image.open(src).convert('RGB').rotate(90, expand=True)).astype(float)
c = im[250:1880, 20:1490].copy()
H, W, _ = c.shape

# Background estimate per channel (median on downsampled image removes the thin threads)
bg = np.zeros_like(c)
for k in range(3):
    small = ndi.median_filter(c[::4, ::4, k], size=21)
    bg[..., k] = ndi.zoom(small, 4, order=1)[:H, :W]
bg = ndi.gaussian_filter(bg, (6, 6, 0))

lum = c @ [0.3, 0.55, 0.15]
bgl = bg @ [0.3, 0.55, 0.15]
dark = bgl - lum
red = (c[..., 0] - (c[..., 1] + c[..., 2]) / 2) - (bg[..., 0] - (bg[..., 1] + bg[..., 2]) / 2)
score = dark + 1.6 * red

a = np.clip((score - 22) / (95 - 22), 0, 1)

# Remove specks / folds: keep connected components of a hard mask with enough pixels
hard = score > 34
lab, n = ndi.label(hard, structure=np.ones((3, 3)))
sizes = ndi.sum(hard, lab, range(1, n + 1))
redm = ndi.mean(red, lab, range(1, n + 1))
darkm = ndi.mean(dark, lab, range(1, n + 1))
keep_ids = np.where((sizes >= 90) & ((redm > 4) | (darkm > 55)))[0] + 1
keep = np.isin(lab, keep_ids)
keep = ndi.binary_dilation(keep, iterations=3)
a = a * keep
a[H-120:, :140] = 0
# grey fold shadows touching the strokes: fade pixels without the thread's red chroma
chroma = ndi.gaussian_filter(red, 1.5)
a = a * np.clip((chroma + 1.0) / 6.0, 0, 1) ** 0.7
ys, xs = slice(1025, 1095), slice(185, 270)   # fold smudge beside the first M
a[ys, xs] *= np.maximum(np.clip((chroma[ys, xs] - 4.0) / 5.0, 0, 1), np.clip((dark[ys, xs] - 45) / 20, 0, 1))
a = ndi.gaussian_filter(a, 0.6)
a = np.clip(a * 1.15, 0, 1)

# Unmix thread colour from the satin background
aa = np.maximum(a, 0.25)[..., None]
fg = np.clip((c - (1 - aa) * bg) / aa, 0, 255)
fl = fg @ [0.3, 0.55, 0.15]
# normalise luminance of the thread to keep fibre variation but a coherent bordeaux
lo, hi = np.percentile(fl[a > 0.6], [3, 97])
t = np.clip((fl - lo) / (hi - lo + 1e-6), 0, 1)
dark_c = np.array([62, 12, 26])     # ombre du fil
mid_c = np.array([112, 28, 46])     # bordeaux
light_c = np.array([160, 70, 86])   # reflet du fil
t2 = t[..., None]
col = np.where(t2 < 0.55, dark_c + (mid_c - dark_c) * (t2 / 0.55), mid_c + (light_c - mid_c) * ((t2 - 0.55) / 0.45))
# keep a little of the photographed hue variation
col = 0.82 * col + 0.18 * fg

out = np.dstack([np.clip(col, 0, 255), a * 255]).astype(np.uint8)
img = Image.fromarray(out, 'RGBA')
bbox = img.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
pad = 24
bbox = (max(bbox[0] - pad, 0), max(bbox[1] - pad, 0), min(bbox[2] + pad, W), min(bbox[3] + pad, H))
print('bbox',bbox)
img = img.crop(bbox)
print('logo size', img.size)
img.save('logo-brode.png', optimize=True)
w = 900
img.resize((w, round(img.size[1] * w / img.size[0])), Image.LANCZOS).save('logo-brode-900.webp', quality=92, method=6)
# preview on linen
prev = Image.new('RGBA', img.size, (236, 233, 226, 255))
prev.alpha_composite(img)
prev.convert('RGB').resize((img.size[0] // 2, img.size[1] // 2)).save('preview.png')
