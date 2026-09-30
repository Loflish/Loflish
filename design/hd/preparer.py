"""
Prépare les matières HD générées avec Higgsfield pour le site (public/hd/).

  python3 preparer.py fond   <image> <nom> <largeur>   → public/hd/<nom>.webp
  python3 preparer.py lin    <image>                   → public/hd/lin.webp (raccordable)
  python3 preparer.py taches <premier_numéro> <planche…> → public/hd/taches/tache-NN.webp
  python3 preparer.py aplat  <image> <nom>             → public/hd/aplats/<nom>.webp (masque)
  python3 preparer.py motif  <image> <nom>             → public/hd/motifs/<nom>.webp (masque raccordable)
  python3 preparer.py papier <image> <nom> [force]     → public/hd/<nom>.webp (calque raccordable)

Aplats et motifs deviennent des masques blancs (alpha = gouache) : le site les
remplit de n'importe quelle couleur avec `mask-image`.

Les taches (planches de 3 × 3) sont gardées monochromes : le site les teinte
ensuite dans la couleur GRIS exacte de chaque personne (alpha = quantité de
pigment, gris = densité).
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

OUT = Path(__file__).resolve().parents[2] / 'public' / 'hd'
for d in ('taches', 'aplats', 'motifs'):
    (OUT / d).mkdir(parents=True, exist_ok=True)


def fond(src, nom, largeur):
    im = Image.open(src).convert('RGB')
    im = im.resize((largeur, round(im.size[1] * largeur / im.size[0])), Image.LANCZOS)
    im.save(OUT / f'{nom}.webp', quality=82, method=6)
    print('fond', nom, im.size)


def lin(src):
    img = Image.open(src).convert('RGB')
    s = min(img.size)
    a = np.asarray(img.crop((0, 0, s, s)).resize((1024, 1024), Image.LANCZOS)).astype(float)
    shift = np.roll(np.roll(a, 512, 0), 512, 1)
    y, x = np.mgrid[0:1024, 0:1024]
    edge = np.minimum(np.minimum(x, 1023 - x), np.minimum(y, 1023 - y)) / 512.0
    w = np.clip(edge * 2.2, 0, 1)[..., None]
    tile = a * w + shift * (1 - w)
    tile = tile - tile.mean(axis=(0, 1)) + np.array([232, 227, 216])  # neutre, ton lin
    Image.fromarray(np.clip(tile, 0, 255).astype(np.uint8)).save(OUT / 'lin.webp', quality=86, method=6)
    print('lin')


def raccord(a, n):
    """Rend une image carrée n × n raccordable (fondu avec sa version décalée d'une demi-tuile)."""
    shift = np.roll(np.roll(a, n // 2, 0), n // 2, 1)
    y, x = np.mgrid[0:n, 0:n]
    edge = np.minimum(np.minimum(x, n - 1 - x), np.minimum(y, n - 1 - y)) / (n / 2)
    w = np.clip(edge * 2.2, 0, 1)
    if a.ndim == 3:
        w = w[..., None]
    return a * w + shift * (1 - w)


def masque(g):
    """Gouache grise sur papier blanc → alpha (0 = papier, 1 = pleine gouache)."""
    bg = np.percentile(g, 97)
    plein = np.percentile(g[g < bg - 30], 20) if (g < bg - 30).any() else bg - 100
    return np.clip((bg - 6 - g) / max(1, bg - 6 - plein), 0, 1)


def aplat(src, nom):
    g = np.asarray(Image.open(src).convert('L')).astype(float)
    a = masque(g)
    ys, xs = np.where(a > 0.08)
    pad = 24
    y0, y1 = max(0, ys.min() - pad), min(a.shape[0], ys.max() + pad)
    x0, x1 = max(0, xs.min() - pad), min(a.shape[1], xs.max() + pad)
    a = np.clip((a[y0:y1, x0:x1] - 0.06) / 0.94, 0, 1) ** 0.85  # le papier autour disparaît
    im = Image.fromarray((a * 255).astype(np.uint8), 'L')
    im.thumbnail((1000, 1000), Image.LANCZOS)
    blanc = Image.new('L', im.size, 255)
    Image.merge('RGBA', (blanc, blanc, blanc, im)).save(OUT / 'aplats' / f'{nom}.webp', quality=70, alpha_quality=55, method=6)
    print('aplat', nom, im.size)


def motif(src, nom, n=720):
    img = Image.open(src).convert('L')
    s = min(img.size)
    g = np.asarray(img.crop((0, 0, s, s)).resize((n, n), Image.LANCZOS)).astype(float)
    a = raccord(masque(g), n)
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), 'L')
    blanc = Image.new('L', im.size, 255)
    Image.merge('RGBA', (blanc, blanc, blanc, im)).save(OUT / 'motifs' / f'{nom}.webp', quality=70, alpha_quality=55, method=6)
    print('motif', nom)


def papier(src, nom, n=768, force=0.13):
    """Papier fait main → calque translucide raccordable : seules les fibres et le
    grain restent (leurs ombres, en brun chaud), posé sur la couleur du panneau."""
    img = Image.open(src).convert('L')
    s = min(img.size)
    g = np.asarray(img.crop((0, 0, s, s)).resize((n, n), Image.LANCZOS)).astype(float)
    t = raccord(g, n)
    t = t - ndi.gaussian_filter(t, 60)  # retire les nuages de teinte, garde le relief
    dev = np.clip(t / (np.percentile(np.abs(t), 99) + 1e-6), -1, 1)
    a = np.clip(-dev, 0, 1) ** 1.1 * force  # seules les ombres des fibres, en brun chaud, à peine
    rgba = np.dstack([np.full_like(a, 112), np.full_like(a, 96), np.full_like(a, 78), a * 255]).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(OUT / f'{nom}.webp', quality=66, alpha_quality=50, method=6)
    print('papier', nom)


def taches(premier, planches):
    n = premier - 1
    for sheet in planches:
        g = np.asarray(Image.open(sheet).convert('L')).astype(float)
        bg = np.percentile(g, 92)
        d = np.clip(bg - g, 0, 255)
        mask = ndi.binary_closing(d > 14, iterations=4)
        mask = ndi.binary_fill_holes(mask)
        lab, k = ndi.label(mask)
        sizes = ndi.sum(mask, lab, range(1, k + 1))
        keep = np.argsort(sizes)[::-1][:9] + 1
        med = np.median(sizes[keep - 1])
        slices = ndi.find_objects(lab)
        for c in keep:
            if sizes[c - 1] < med * 0.45:  # tache ratée ou collée à une autre : on l'écarte
                continue
            sy, sx = slices[c - 1]  # boîte englobante : bien plus rapide qu'un masque plein format
            cy, cx = (sy.start + sy.stop) / 2, (sx.start + sx.stop) / 2
            diam = max(sy.stop - sy.start, sx.stop - sx.start)
            side = int(diam / 0.82)
            y0, x0 = int(cy - side / 2), int(cx - side / 2)
            pad = np.zeros((side, side))
            crop = d[max(0, y0):y0 + side, max(0, x0):x0 + side]
            m = lab[max(0, y0):y0 + side, max(0, x0):x0 + side] == c
            crop = ndi.gaussian_filter(crop, 0.6) * ndi.binary_dilation(m, iterations=6)
            pad[max(0, -y0):max(0, -y0) + crop.shape[0], max(0, -x0):max(0, -x0) + crop.shape[1]] = crop
            hi = np.percentile(pad[pad > 3], 98) if (pad > 3).any() else 1
            a = np.clip(pad / hi, 0, 1) ** 0.8
            alpha = np.clip(a * 1.35, 0, 1)  # quantité de pigment
            shade = 255 - a * 105  # densité (sert au multiply)
            rgba = np.dstack([shade, shade, shade, alpha * 255]).astype(np.uint8)
            n += 1
            Image.fromarray(rgba, 'RGBA').resize((320, 320), Image.LANCZOS).save(
                OUT / 'taches' / f'tache-{n:02d}.webp', quality=76, method=6)
    print('taches jusqu’à', n)
    return n


if __name__ == '__main__':
    cmd, *args = sys.argv[1:]
    if cmd == 'fond':
        fond(args[0], args[1], int(args[2]))
    elif cmd == 'lin':
        lin(args[0])
    elif cmd == 'taches':
        taches(int(args[0]), args[1:])
    elif cmd == 'papier':
        papier(args[0], args[1], force=float(args[2]) if len(args) > 2 else 0.13)
    elif cmd in ('aplat', 'motif'):
        globals()[cmd](args[0], args[1])
