"""Les taches du catalogue (palette M) en 256 px, pour la constellation : elle peint ses bulles en 208 px au plus,
les 512 px (142 Ko chacune) ne servaient qu'aux grandes bulles d'une page. 183 taches : 16,9 Mo -> 5,1 Mo.
Relancer après design/hd/catalogue.py.  Usage : python design/hd/catalogue_256.py
"""
from pathlib import Path

from PIL import Image

RACINE = Path(__file__).resolve().parents[2]
SRC = RACINE / 'public' / 'hd' / 'taches-catalogue'
DST = SRC / '256'
DST.mkdir(exist_ok=True)
n = total = 0
for f in sorted(SRC.glob('cat-*.webp')):
    im = Image.open(f).convert('RGBA').resize((256, 256), Image.LANCZOS)
    out = DST / f.name
    # exact=False : les pixels entièrement transparents n'emportent pas de couleur (plus léger, invisible)
    im.save(out, 'WEBP', quality=85, method=6, alpha_quality=85, exact=False)
    n += 1
    total += out.stat().st_size
print(f'{n} taches en 256 px, {total / 1048576:.1f} Mo')
