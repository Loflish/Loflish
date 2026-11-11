"""
Le coton ivoire des pages, légèrement teint (5 novembre 2026). Tom garde le tissu actuel (public/hd/fond-tissu-*.webp) et veut
une version un peu colorée et joyeuse, comme la constellation. Ici, rien n'est ajouté : des teintures pâles (rose, lilas,
sauge, miel, les familles de GRIS) sont passées dans le tissu lui-même, et se rassemblent dans les creux des plis, comme une
teinture à la main sèche de façon inégale. Deux forces : « leger » et « moyen ».

  python design/hd/tissu_teinte.py
  → public/hd/essais/tissu-teinte-{leger,moyen}-{16x9,9x16}.webp   (drapeau ?tissu=teinte-leger ou ?tissu=teinte-moyen)
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

RACINE = Path(__file__).resolve().parents[2]
HD = RACINE / 'public' / 'hd'
OUT = HD / 'essais'
# teintures pâles, une par grande nappe : rose, lilas, sauge, miel, puis bleu de brume
# chaque teinture a sa place (centre relatif), pour que les couleurs restent franches au lieu de se mêler en gris
TEINTURES = [
    ((0.97, 0.78, 0.78), (0.82, 0.12)),  # rose, en haut à droite
    ((0.82, 0.80, 0.96), (0.12, 0.88)),  # lilas, en bas à gauche
    ((0.98, 0.88, 0.62), (0.70, 0.62)),  # miel, à droite au milieu
    ((0.76, 0.90, 0.82), (0.45, 0.98)),  # sauge, en bas au centre
    ((0.80, 0.88, 0.96), (0.98, 0.95)),  # bleu de brume, le coin bas droit
]


def bruit(rng, h, w, base, octaves=3):
    out = np.zeros((h, w))
    amp = 1.0
    for o in range(octaves):
        n = base * 2**o
        g = rng.standard_normal((max(2, int(n * h / w)), n))
        out += amp * ndi.zoom(g, (h / g.shape[0], w / g.shape[1]), order=3)
        amp *= 0.5
    return out / (np.abs(out).max() + 1e-9)


def teindre(source, force, graine=11):
    rng = np.random.default_rng(graine)
    img = np.asarray(Image.open(source).convert('RGB')).astype(float) / 255
    h, w = img.shape[:2]
    lum = img.mean(axis=2)
    # les creux des plis : plus sombres que leur voisinage large ; la teinture s'y rassemble
    creux = np.clip((ndi.gaussian_filter(lum, w / 40) - lum) / 0.04, 0, 1)
    out = img.copy()
    yy, xx = np.mgrid[0:h, 0:w]
    for t, (cx, cy) in TEINTURES:
        # une nappe de teinture aux bords perdus, à sa place ; le bruit la rend inégale comme un séchage
        n = bruit(rng, h, w, 2, 3)
        d = np.hypot((xx / w - cx) / 0.42, (yy / h - cy) / 0.48)
        nappe = np.clip(1 - d, 0, 1) ** 1.3 * np.clip(n * 0.45 + 0.75, 0, 1)
        a = force * nappe * (0.55 + 0.45 * creux)
        out = out * (1 - a[..., None]) + out * np.array(t)[None, None, :] * a[..., None]
    # la ligne de marée : là où la nappe s'arrête, un peu plus de pigment (séchage)
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), 'RGB')


def main():
    OUT.mkdir(exist_ok=True)
    for nom, force in (('leger', 0.38), ('moyen', 0.62)):
        for ratio in ('16x9', '9x16'):
            im = teindre(HD / f'fond-tissu-{ratio}.webp', force)
            im.save(OUT / f'tissu-teinte-{nom}-{ratio}.webp', quality=88, method=4)
            print(nom, ratio, im.size)


if __name__ == '__main__':
    main()
