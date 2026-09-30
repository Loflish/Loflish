"""
Recompose le logo brodé sur une seule ligne : NOS MOTS MÉMORIAUX.

Chaque lettre brodée est gardée intacte (aucune déformation du fil) : elle est
seulement déplacée verticalement pour rejoindre une ligne commune. Les
soulignés, fils fins, sont redressés colonne par colonne en conservant leurs
petites ondulations. Entrée : logo-brode-original.png (détourage 3 lignes).
"""
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage as ndi

src = np.asarray(Image.open('logo-brode-original.png').convert('RGBA')).astype(float)
H, W = src.shape[:2]
alpha = src[..., 3]
core = alpha > 40
lab, n = ndi.label(ndi.binary_dilation(core, iterations=2))
sizes = ndi.sum(core, lab, range(1, n + 1))
# chaque pixel (même très transparent) rejoint le trait le plus proche
_, (iy, ix) = ndi.distance_transform_edt(lab == 0, return_indices=True)
full = lab[iy, ix] * (alpha > 0)

GROUPS = {  # composantes repérées sur le détourage (voir liste dans l'historique)
    'NOS': dict(letters=[1, 2, 3], under=[4]),
    'MOTS': dict(letters=[5, 6, 7, 8], under=[9]),
    'MÉMORIAUX': dict(letters=[10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21], under=[14, 22]),
}

def trend_of(under_mask):
    ys, xs = np.nonzero(under_mask)
    cols = np.arange(W)
    cy = np.full(W, np.nan)
    for x in np.unique(xs):
        cy[x] = ys[xs == x].mean()
    ok = ~np.isnan(cy)
    x0, x1 = cols[ok].min(), cols[ok].max()
    filled = np.interp(cols, cols[ok], cy[ok])
    smooth = ndi.uniform_filter1d(filled, 160, mode='nearest')
    # prolongement linéaire au-delà du souligné
    m = (smooth[x1] - smooth[x0]) / max(1, x1 - x0)
    smooth[:x0] = smooth[x0] - m * (x0 - cols[:x0])
    smooth[x1:] = smooth[x1] + m * (cols[x1:] - x1)
    return smooth, x0, x1

pieces = []
for name, g in GROUPS.items():
    under = np.isin(full, g['under'])
    trend, x0, x1 = trend_of(under & core)
    ref = trend[x0]
    out = np.zeros_like(src)
    # souligné : redressé colonne par colonne
    ys, xs = np.nonzero(under)
    dy = np.round(trend[xs] - ref).astype(int)
    ny = ys - dy
    okm = (ny >= 0) & (ny < H)
    out[ny[okm], xs[okm]] = src[ys[okm], xs[okm]]
    # lettres : translation verticale, forme intacte
    for c in g['letters']:
        m = full == c
        ys, xs = np.nonzero(m)
        cx = xs.mean()
        d = int(round(trend[int(cx)] - ref))
        ny = ys - d
        okm = (ny >= 0) & (ny < H)
        prev = out[ny[okm], xs[okm]]
        new = src[ys[okm], xs[okm]]
        take = new[:, 3] > prev[:, 3]
        out[ny[okm][take], xs[okm][take]] = new[take]
    a = out[..., 3] > 8
    rows = np.nonzero(a.any(1))[0]
    cols = np.nonzero(a.any(0))[0]
    crop = out[rows[0]:rows[-1] + 1, cols[0]:cols[-1] + 1]
    pieces.append((name, crop, ref - rows[0]))
    print(name, crop.shape, 'ligne à', round(ref - rows[0]))

gap = 70
base = max(p[2] for p in pieces)
below = max(p[1].shape[0] - p[2] for p in pieces)
Htot = int(base + below) + 20
Wtot = sum(p[1].shape[1] for p in pieces) + gap * (len(pieces) - 1) + 20
canvas = np.zeros((Htot, Wtot, 4))
x = 10
for name, crop, bl in pieces:
    y = int(round(base - bl)) + 10
    h, w = crop.shape[:2]
    region = canvas[y:y + h, x:x + w]
    take = crop[..., 3] > region[..., 3]
    region[take] = crop[take]
    x += w + gap
img = Image.fromarray(canvas.astype(np.uint8), 'RGBA')
img.save('logo-ligne-original.png', optimize=True)
print('ligne', img.size)

def web(dil, width, path):
    a = img.getchannel('A')
    if dil:
        a = a.filter(ImageFilter.MaxFilter(dil))
    al = (np.asarray(a).astype(float) / 255) ** 0.6
    rgba = np.asarray(img).copy()
    rgba[..., 3] = (al * 255).astype(np.uint8)
    out = Image.fromarray(rgba, 'RGBA')
    out = out.resize((width, round(out.size[1] * width / out.size[0])), Image.LANCZOS)
    out.save(path, quality=92, method=6)
    print(path, out.size)

web(3, 1800, '../../public/brand/logo-ligne.webp')
web(7, 900, '../../public/brand/logo-ligne-petit.webp')
