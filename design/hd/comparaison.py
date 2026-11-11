"""
La grande comparaison (4 novembre 2026) : les planches 2, 3, 4, 5 et le mélange, à égalité. Mêmes vingt couleurs GRIS,
mêmes tailles (38 px comme dans la constellation, 96 px au zoom, 190 px sur la page d'une trace), sur un morceau du
vrai fond feutre. Les aquarelles (planches 2 et 3) sont peintes comme le site les peint (encre 0,28) ; les encres
(planches 4 et 5) au rendu F retenu pour la planche 4 (3 couches, 1,5) et au rendu des essais pour la planche 5 (2 couches, 1,2).

  python design/hd/comparaison.py  → reports/Bulles 2026-11-04/grande-comparaison.png
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from selection_bulles import HD, SORTIE, RACINE  # noqa: E402

COULEURS = ['#3C75AA', '#52AE9A', '#D17067', '#F6C761', '#9C62A3', '#DB8F50', '#4B6097', '#D9647A', '#59A6AB', '#EB8D8D',
            '#954B7F', '#E2E288', '#84BAE3', '#648560', '#B0676E', '#AFA4E2', '#7483B8', '#E4B476', '#8892C9', '#7EA5A3']


def teinter(chemin, k, hexa, taille, couches=1):
    a = np.asarray(Image.open(chemin).convert('RGBA').resize((taille, taille), Image.LANCZOS)).astype(float) / 255
    rgb = np.array([int(hexa[i:i + 2], 16) for i in (1, 3, 5)]) / 255
    alpha, gris = a[..., 3:4], a[..., :3]
    alpha2 = 1 - (1 - alpha) ** couches
    couleur = np.clip(rgb * (1 - k * alpha * (1 - gris)), 0, 1)
    return Image.fromarray((np.dstack([couleur, alpha2[..., 0]]) * 255).astype(np.uint8), 'RGBA')


def main():
    sel = json.loads((RACINE / 'design' / 'selection-bulles.json').read_text(encoding='utf-8'))
    rng = np.random.default_rng(4)
    pick = lambda n: sorted(rng.choice(np.arange(1, 101), 20, replace=False).tolist())
    chemins = {
        'Planche 2 — tes détails de vie dans tes taches': [(HD / 'taches-melange' / f'melange-{n:03d}.webp', 0.28, 1) for n in pick(2)],
        'Planche 3 — l’autre conversation': [(HD / 'taches-claude' / f'{n:03d}.webp', 0.28, 1) for n in pick(3)],
        'Planche 4 — filaments gothiques (rendu F)': [(HD / 'taches-gothique' / f'gothique-{n:03d}.webp', 1.5, 3) for n in pick(4)],
        'Planche 5 — filaments de lumière (2 couches, 1,2)': [(HD / 'taches-lumiere' / '1024' / f'lumiere-{n:02d}.webp', 1.0, 2) for n in pick(5)],
        'Le mélange — 100 bulles choisies dans les planches 2, 3, 4': [],
    }
    bulles = sel['bulles']
    for b in [bulles[i] for i in rng.choice(len(bulles), 20, replace=False)]:
        p, n = b['planche'], b['n']
        chemins['Le mélange — 100 bulles choisies dans les planches 2, 3, 4'].append(
            (HD / 'taches-melange' / f'melange-{n:03d}.webp', 0.28, 1) if p == 2 else (HD / 'taches-claude' / f'{n:03d}.webp', 0.28, 1) if p == 3 else (HD / 'taches-gothique' / f'gothique-{n:03d}.webp', 1.5, 3)
        )
    fond = Image.open(HD / 'fond-16x9.webp').convert('RGB')
    fond = fond.resize((20 * 200 + 40, int(fond.height * (20 * 200 + 40) / fond.width)), Image.LANCZOS)
    f = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 24)
    tailles = [38, 96, 190]
    colonne = 200
    W = 20 * colonne + 40
    hauteur_rang = 44 + sum(t + 12 for t in tailles) + 20
    H = len(chemins) * hauteur_rang + 20
    # le fond feutre, étiré sur toute la planche (un morceau par rang, pour varier)
    im = Image.new('RGB', (W, H), (236, 233, 226))
    y = 10
    d = ImageDraw.Draw(im)
    for r, (titre, items) in enumerate(chemins.items()):
        y0 = min(r * 300, fond.height - hauteur_rang)
        im.paste(fond.crop((0, y0, W, y0 + hauteur_rang)), (0, y))
        d.text((20, y + 8), titre, fill=(47, 44, 51), font=f)
        yy = y + 44
        for t in tailles:
            for i, (ch, k, c) in enumerate(items):
                if not ch.exists():
                    continue
                b = teinter(ch, k, COULEURS[i], t, c)
                im.paste(b, (20 + i * colonne + (colonne - t) // 2, yy), b)
            yy += t + 12
        y += hauteur_rang
    im.save(SORTIE / 'grande-comparaison.png')
    print(im.size)


if __name__ == '__main__':
    main()
