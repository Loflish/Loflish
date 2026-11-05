"""
Le fond des pages à la manière de Ruth Rae (5 novembre 2026) : sur le coton ivoire actuel (public/hd/fond-tissu-*.webp),
des pièces de tissu teint à la main, posées en couches, aux bords effrangés, cousues au point avant ; un fil qui traverse.
Deux versions : « ivoire » (teintes de thé et d'os seulement) et « couleur » (les mêmes pièces, avec de pâles teintures
sauge, rose, lilas, miel : légèrement coloré et joyeux, comme la constellation). Le centre de la page reste calme : les
pièces vivent dans les marges, le texte passe dessus.

  python design/hd/tissu_ruth.py
  → public/hd/essais/tissu-ruth-{ivoire,couleur}-{16x9,9x16}.webp   (drapeau ?tissu=ruth-ivoire ou ?tissu=ruth-couleur)
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

RACINE = Path(__file__).resolve().parents[2]
HD = RACINE / 'public' / 'hd'
OUT = HD / 'essais'
ENCRE = (47, 44, 51)

# pièces en coordonnées relatives (x, y, largeur, hauteur, teinte) ; le centre-gauche (le texte) reste nu
PIECES_16x9 = [
    (0.70, -0.04, 0.24, 0.30, 'the'),
    (0.86, 0.14, 0.20, 0.36, 'os'),
    (0.64, 0.30, 0.16, 0.12, 'lin'),
    (0.78, 0.58, 0.30, 0.26, 'the'),
    (0.58, 0.84, 0.22, 0.22, 'os'),
    (-0.03, 0.74, 0.20, 0.30, 'lin'),
    (0.10, 0.90, 0.26, 0.14, 'the'),
    (-0.03, -0.03, 0.14, 0.18, 'os'),
    (0.08, 0.10, 0.06, 0.40, 'bande'),
]
PIECES_9x16 = [
    (0.60, -0.03, 0.44, 0.16, 'the'),
    (0.80, 0.10, 0.24, 0.22, 'os'),
    (-0.04, 0.26, 0.20, 0.18, 'lin'),
    (0.70, 0.44, 0.36, 0.14, 'the'),
    (-0.03, 0.70, 0.30, 0.16, 'os'),
    (0.62, 0.80, 0.42, 0.22, 'the'),
    (0.12, 0.90, 0.34, 0.12, 'lin'),
    (0.30, 0.04, 0.05, 0.30, 'bande'),
]
TEINTES = {'the': (0.92, 0.88, 0.79), 'os': (0.96, 0.94, 0.88), 'lin': (0.90, 0.89, 0.83), 'bande': (0.89, 0.86, 0.80)}
# version couleur : des teintures pâles, à la place du thé (rose, lilas, sauge, miel), jamais deux voisines pareilles
COULEURS = [(0.96, 0.85, 0.85), (0.89, 0.87, 0.96), (0.85, 0.92, 0.87), (0.97, 0.91, 0.76)]


def bruit(rng, h, w, base, octaves=3):
    out = np.zeros((h, w))
    amp = 1.0
    for o in range(octaves):
        n = base * 2**o
        g = rng.standard_normal((max(2, int(n * h / w)), n))
        out += amp * ndi.zoom(g, (h / g.shape[0], w / g.shape[1]), order=3)
        amp *= 0.5
    return out / (np.abs(out).max() + 1e-9)


def masque_piece(rng, h, w, x, y, lw, lh):
    """une pièce rectangulaire aux bords déchirés, légèrement de travers"""
    m = np.zeros((h, w))
    x0, y0, x1, y1 = int(x * w), int(y * h), int((x + lw) * w), int((y + lh) * h)
    x0, y0, x1, y1 = max(-w, x0), max(-h, y0), min(2 * w, x1), min(2 * h, y1)
    im = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(im)
    a = rng.uniform(-6, 6)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    c, s = np.cos(np.radians(a)), np.sin(np.radians(a))
    pts = [(cx + (px - cx) * c - (py - cy) * s, cy + (px - cx) * s + (py - cy) * c) for px, py in [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]]
    d.polygon(pts, fill=255)
    m = np.asarray(im).astype(float) / 255
    # le bord déchiré : la frontière poussée par un bruit, puis adoucie
    dep = bruit(rng, h, w, 40, 3) * (0.016 * w)
    yy, xx = np.mgrid[0:h, 0:w]
    m = ndi.map_coordinates(m, [np.clip(yy + dep, 0, h - 1), np.clip(xx + dep * 0.7, 0, w - 1)], order=1)
    m = ndi.gaussian_filter(m, 1.2)
    return np.clip(m, 0, 1)


def point_avant(d, chemin, pas=16, longueur=9, largeur=2, couleur=ENCRE, alpha=140, rng=None):
    """le point avant le long d'un chemin : des tirets réguliers mais vivants"""
    pts = np.array(chemin, dtype=float)
    seg = np.diff(pts, axis=0)
    lg = np.hypot(seg[:, 0], seg[:, 1])
    total = lg.sum()
    t = 0.0
    while t < total:
        i = np.searchsorted(np.cumsum(lg), t)
        if i >= len(seg):
            break
        u = (t - (np.cumsum(lg)[i] - lg[i])) / max(lg[i], 1e-6)
        p = pts[i] + seg[i] * u
        v = seg[i] / max(lg[i], 1e-6)
        j = (rng.standard_normal(2) * 1.2) if rng is not None else np.zeros(2)
        lo = longueur * (rng.uniform(0.7, 1.3) if rng is not None else 1)
        ang = np.radians(rng.uniform(-9, 9)) if rng is not None else 0
        vr = np.array([v[0] * np.cos(ang) - v[1] * np.sin(ang), v[0] * np.sin(ang) + v[1] * np.cos(ang)])
        a, b = p + j - vr * lo / 2, p + j + vr * lo / 2
        d.line([tuple(a), tuple(b)], fill=couleur + (alpha,), width=largeur)
        t += pas * (1 + (rng.uniform(-0.12, 0.12) if rng is not None else 0))


def contour(m, w, h):
    """les points du contour d'un masque, dans l'ordre"""
    from PIL import Image as _I

    im = _I.fromarray((m > 0.5).astype(np.uint8) * 255)
    edges = np.asarray(im.filter(ImageFilter.FIND_EDGES)) > 0
    ys, xs = np.nonzero(edges)
    if len(xs) < 50:
        return []
    cx, cy = xs.mean(), ys.mean()
    ordre = np.argsort(np.arctan2(ys - cy, xs - cx))
    pts = list(zip(xs[ordre], ys[ordre]))
    return pts[:: max(1, len(pts) // 600)]


def fabriquer(source, pieces, couleur, graine):
    rng = np.random.default_rng(graine)
    base = Image.open(source).convert('RGB')
    w, h = base.size
    img = np.asarray(base).astype(float) / 255
    out = img.copy()
    fils = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(fils)
    for k, (x, y, lw, lh, teinte) in enumerate(pieces):
        m = masque_piece(rng, h, w, x, y, lw, lh)
        t = np.array(COULEURS[k % len(COULEURS)]) if couleur and teinte != 'bande' else np.array(TEINTES[teinte])
        # la pièce : une teinture inégale (thé, ou couleur pâle), multipliée sur le coton
        tache = 0.86 + 0.14 * (bruit(rng, h, w, 3, 3) * 0.5 + 0.5)
        couche = t[None, None, :] * tache[..., None]
        force = 0.6
        out = out * (1 - m[..., None] * force) + out * couche * (m[..., None] * force)
        # l'ombre fine sous le bord de la pièce : la couche se lit
        bord = np.clip(ndi.gaussian_filter(m, 3) - m, 0, 1)
        out = out * (1 - 0.16 * bord[..., None])
        # la couture au point avant, un peu en retrait du bord
        interieur = ndi.binary_erosion(m > 0.5, iterations=int(0.012 * w))
        pts = contour(interieur.astype(float), w, h)
        if pts:
            point_avant(d, pts + [pts[0]], pas=int(0.0075 * w), longueur=int(0.0038 * w), largeur=max(1, int(0.0009 * w)), alpha=85, rng=rng)
        # l'effilochage : de courts fils lâches qui dépassent du bord déchiré
        bordure = contour(m, w, h)
        fil = tuple(int(v * 255 * 0.78) for v in t)
        for (bx, by) in bordure[:: max(1, len(bordure) // 60)]:
            if rng.random() < 0.6:
                continue
            L = rng.uniform(0.004, 0.012) * w
            ang = rng.uniform(0, 2 * np.pi)
            px = [bx + np.cos(ang + rng.uniform(-0.5, 0.5) * s) * L * s for s in np.linspace(0, 1, 5)]
            py = [by + np.sin(ang + rng.uniform(-0.5, 0.5) * s) * L * s for s in np.linspace(0, 1, 5)]
            d.line(list(zip(px, py)), fill=fil + (150,), width=1)
    # un fil qui traverse, lâche, d'un bord à l'autre
    for _ in range(2):
        y0 = rng.uniform(0.15, 0.9) * h
        xs = np.linspace(-20, w + 20, 40)
        ys = y0 + bruit(rng, 1, 40, 3, 2)[0] * 0.06 * h
        point_avant(d, list(zip(xs, ys)), pas=int(0.009 * w), longueur=int(0.0045 * w), largeur=max(1, int(0.0009 * w)), alpha=75, rng=rng)
    fils = fils.filter(ImageFilter.GaussianBlur(0.6))
    res = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), 'RGB')
    res.paste(fils, (0, 0), fils)
    return res


def main():
    OUT.mkdir(exist_ok=True)
    for nom, couleur in (('ivoire', False), ('couleur', True)):
        for ratio, source, pieces in (('16x9', HD / 'fond-tissu-16x9.webp', PIECES_16x9), ('9x16', HD / 'fond-tissu-9x16.webp', PIECES_9x16)):
            im = fabriquer(source, pieces, couleur, graine=7)
            im.save(OUT / f'tissu-ruth-{nom}-{ratio}.webp', quality=86, method=4)
            print(nom, ratio, im.size)


if __name__ == '__main__':
    main()
