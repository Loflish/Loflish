"""Mesure des vues du balayage (traits clairs par tuile) et mosaïque. Appelé par balayage.mjs."""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as n

dossier = Path(sys.argv[1])
vues = [l.split('\t') for l in (dossier / 'vues.tsv').read_text(encoding='utf-8').splitlines()]
f = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 18)


def traits(path):
    g = np.asarray(Image.open(path).convert('L')).astype(float)
    d = g - n.gaussian_filter(g, 4)
    clair = np.clip(d, 0, None)
    # par tuile de 120 px : la pire tuile de la vue
    h, w = clair.shape
    t = clair[: h // 120 * 120, : w // 120 * 120].reshape(h // 120, 120, w // 120, 120).mean(axis=(1, 3))
    return float(clair.mean()), float(t.max()), np.unravel_index(int(t.argmax()), t.shape)


res = []
for zoom, j, i, path in vues:
    m, pire, ou = traits(path)
    res.append((float(zoom), int(j), int(i), path, m, pire, ou))
for zoom in (1.0, 2.2):
    sel = [r for r in res if r[0] == zoom]
    moy = np.mean([r[4] for r in sel])
    pires = sorted(sel, key=lambda r: -r[5])[:3]
    print(f'zoom {zoom} : {len(sel)} vues, traits clairs moyens {moy:.2f}, pire tuile {pires[0][5]:.2f} (vue ligne {pires[0][1]} colonne {pires[0][2]}, tuile {pires[0][6]})')
    # mosaïque
    cols = max(r[2] for r in sel) + 1
    rows = max(r[1] for r in sel) + 1
    W, H = 480, 270
    mos = Image.new('RGB', (cols * (W + 6) + 6, rows * (H + 26) + 6), (236, 233, 226))
    d = ImageDraw.Draw(mos)
    for z, j, i, path, m, pire, ou in sel:
        im = Image.open(path).resize((W, H), Image.LANCZOS)
        x, y = 6 + i * (W + 6), 6 + j * (H + 26)
        mos.paste(im, (x, y + 20))
        d.text((x, y + 2), f'{m:.2f} / pire {pire:.2f}', fill=(47, 44, 51) if pire < 3 else (150, 30, 30), font=f)
    mos.save(dossier / f'mosaique-z{zoom}.png')
