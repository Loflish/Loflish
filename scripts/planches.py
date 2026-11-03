"""Planches avant / après pour Tom : les captures de la même page côte à côte, avec leur étiquette.

    python scripts/planches.py "<dossier du rapport>"

Lit <dossier>/avant/*.png et <dossier>/apres/*.png, écrit <dossier>/planches/<page>-<largeur>.png.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

dossier = sys.argv[1]
sortie = os.path.join(dossier, 'planches')
os.makedirs(sortie, exist_ok=True)
try:
    police = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 34)
except OSError:
    police = ImageFont.load_default()

for nom in sorted(os.listdir(os.path.join(dossier, 'avant'))):
    a = os.path.join(dossier, 'avant', nom)
    b = os.path.join(dossier, 'apres', nom)
    if not os.path.exists(b):
        print('pas d’après pour', nom)
        continue
    ia, ib = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    # même hauteur, sinon on recadre en haut
    h = min(ia.height, ib.height)
    ia, ib = ia.crop((0, 0, ia.width, h)), ib.crop((0, 0, ib.width, h))
    marge, bandeau = 40, 70
    planche = Image.new('RGB', (ia.width + ib.width + marge * 3, h + bandeau + marge), (236, 233, 226))
    d = ImageDraw.Draw(planche)
    d.text((marge, 20), 'Avant', fill=(47, 44, 51), font=police)
    d.text((marge * 2 + ia.width, 20), 'Après', fill=(47, 44, 51), font=police)
    planche.paste(ia, (marge, bandeau))
    planche.paste(ib, (marge * 2 + ia.width, bandeau))
    chemin = os.path.join(sortie, nom)
    planche.save(chemin, optimize=True)
    print(chemin, planche.size)
