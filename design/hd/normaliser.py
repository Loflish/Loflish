"""
Toutes les bulles doivent avoir exactement la même taille visible.
Ce script remet chaque tache à la même surface de pigment : son diamètre
équivalent (surface où alpha > 0,3) occupe 80 % de la vignette.
"""
from pathlib import Path
import numpy as np
from PIL import Image

D = Path(__file__).resolve().parents[2] / 'public' / 'hd' / 'taches'
S = 320
for f in sorted(D.glob('tache-*.webp')):
    im = Image.open(f).convert('RGBA')
    a = np.asarray(im)[..., 3] / 255.0
    eq = 2 * np.sqrt((a > 0.3).sum() / np.pi)
    k = (0.8 * S) / max(eq, 1)
    if abs(k - 1) < 0.03:
        continue
    big = im.resize((round(S * k), round(S * k)), Image.LANCZOS)
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    out.alpha_composite(big, ((S - big.size[0]) // 2, (S - big.size[1]) // 2)) if k < 1 else out.alpha_composite(
        big.crop(((big.size[0] - S) // 2, (big.size[1] - S) // 2, (big.size[0] - S) // 2 + S, (big.size[1] - S) // 2 + S)))
    out.save(f, quality=76, method=6)
    print(f.name, round(k, 2))

# une tache agrandie ne doit jamais être coupée net par le bord de sa vignette
y, x = np.mgrid[0:S, 0:S]
fade = np.clip((1.0 - np.hypot(x - S / 2 + 0.5, y - S / 2 + 0.5) / (S / 2)) / 0.12, 0, 1)
for f in sorted(D.glob('tache-*.webp')):
    A = np.asarray(Image.open(f).convert('RGBA')).astype(float)
    if np.concatenate([A[0, :, 3], A[-1, :, 3], A[:, 0, 3], A[:, -1, 3]]).max() > 40:
        A[..., 3] *= fade
        Image.fromarray(A.astype(np.uint8), 'RGBA').save(f, quality=76, method=6)
