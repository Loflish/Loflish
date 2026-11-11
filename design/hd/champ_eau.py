"""
Le champ de déplacement de l'eau, recalculé hors du navigateur (mêmes formules que le shader de src/engine/eau.ts),
pour mesurer où il cisaille : la différence de déplacement entre deux points voisins, en pixels d'écran à 1920 px.
Une carte par variante, et trois nombres. Sert à choisir les réglages de `fluide` sans l'œil seul.

  python design/hd/champ_eau.py
"""
import numpy as np
from PIL import Image

W, H = 1920, 1080
CADRE = np.array([1 - 0.12, (1 - 0.12) * (H / W) / (1364 / 2560)])  # part de l'image visible (MARGE 6 %), approché
AMPLEUR, FLOTTE = 0.05, 2.0


def hachage(p):
    p = np.modf(p * np.array([123.34, 456.21]))[0]
    p = p + np.sum(p * (p + 45.32), axis=-1, keepdims=True)
    return np.modf(p[..., 0] * p[..., 1])[0]


def bruit(p):
    i = np.floor(p)
    f = p - i
    u = f * f * (3 - 2 * f)
    a = hachage(i)
    b = hachage(i + [1, 0])
    c = hachage(i + [0, 1])
    d = hachage(i + [1, 1])
    return (a * (1 - u[..., 0]) + b * u[..., 0]) * (1 - u[..., 1]) + (c * (1 - u[..., 0]) + d * u[..., 0]) * u[..., 1]


def cercle(phase, k, r):
    return r * np.array([np.cos(phase * k), np.sin(phase * k)])


def fbm(p, d, phase, octaves=4):
    s, a = 0, 0.5
    for i in range(octaves):
        s = s + a * bruit(p + cercle(phase, i + 1, d))
        p = p * 2.03
        a *= 0.5
    return s


def champ(phase, octaves=4, hc=0.04, tourb=0.18, souffle_k=0.12):
    ys, xs = np.mgrid[0:H:6, 0:W:6]
    uv = np.stack([xs / W, ys / H], -1)
    p = (uv - 0.5) * CADRE + 0.5
    q = np.stack([fbm(p * 2.2, 0.9, phase, octaves), fbm(p * 2.2 + [5.2, 1.3], 0.9, phase, octaves)], -1)
    r = np.stack([fbm(p * 1.6 + 2.2 * q + [1.7, 9.2], 1.3, phase, octaves), fbm(p * 1.6 + 2.2 * q + [8.3, 2.8], 1.3, phase, octaves)], -1)
    g = np.stack([bruit(p * 1.15 + cercle(phase, 1, 1.1)), bruit(p * 1.15 + [7.3, 2.1] + cercle(phase, 1, 1.1))], -1) - 0.5
    g2 = np.stack([bruit(p * 0.7 + [3.3, 8.1] + cercle(phase, 2, 0.8)), bruit(p * 0.7 + [9.4, 0.6] + cercle(phase, 2, 0.8))], -1) - 0.5
    pc = p * 1.8 + [5.7, 3.1] + cercle(phase, 1, 0.7)
    tourbillon = np.stack([bruit(pc + [0, hc]) - bruit(pc - [0, hc]), bruit(pc - [hc, 0]) - bruit(pc + [hc, 0])], -1) / (2 * hc) * tourb
    ps = p * 1.35 + [2.2, 7.4] + cercle(phase, 2, 0.6)
    souffle = np.stack([bruit(ps + [hc, 0]) - bruit(ps - [hc, 0]), bruit(ps + [0, hc]) - bruit(ps - [0, hc])], -1) / (2 * hc) * souffle_k
    dep = ((r - 0.5) + (g + g2 * 0.7 + tourbillon + souffle) * FLOTTE) * AMPLEUR
    # en pixels d'écran : dep est en fraction de l'image, l'image couvre W / CADRE.x pixels
    return dep * np.array([W / CADRE[0], H / CADRE[1]])


def mesurer(nom, **kw):
    dep = champ(phase=1.3, **kw)
    # cisaillement : écart de déplacement entre points voisins (6 px), ramené à 1 px
    gx = np.diff(dep, axis=1) / 6
    gy = np.diff(dep, axis=0) / 6
    cis = np.zeros(dep.shape[:2])
    cis[:, :-1] += np.hypot(gx[..., 0], gx[..., 1])
    cis[:-1, :] += np.hypot(gy[..., 0], gy[..., 1])
    amp = np.hypot(dep[..., 0], dep[..., 1])
    print(f'{nom:28s} déplacement moyen {amp.mean():5.1f} px, max {amp.max():5.1f} ; cisaillement moyen {cis.mean():.3f} px/px, 95e {np.percentile(cis, 95):.3f}, max {cis.max():.3f}')
    carte = np.clip(cis / 0.25, 0, 1)
    Image.fromarray((carte * 255).astype(np.uint8)).resize((W // 2, H // 2)).save(f'C:/Users/tombl/Desktop/Claude Code/reports/Bulles 2026-11-04/eau/champ-{nom}.png')
    return cis


if __name__ == '__main__':
    mesurer('avant (fluide=0)', octaves=4, hc=0.04)
    mesurer('apres (fluide=1)', octaves=3, hc=0.10, tourb=0.12, souffle_k=0.08)
