"""
Alphabet brodé — découpe les planches générées (Higgsfield, broderie au point
arrière « dans l'esprit » d'un abécédaire fait main) en lettres, mesure la
ligne de base de chaque rangée, met toutes les planches à la même échelle et
assemble un atlas unique :

  public/hd/alphabet.webp   (les lettres détourées, fil conservé, fond transparent)
  src/data/alphabet.json    (position et mesures de chaque lettre, en 1/120 d'em)

Usage : python3 alphabet.py <dossier_des_planches>
  planches attendues : min.png, maj2.png, acc.png, ponct.png
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

RACINE = Path(__file__).resolve().parents[2]
SRC = Path(sys.argv[1])
EM = 120  # pixels d'atlas par em
XH = 0.46  # hauteur des minuscules, en em
CAP = 0.66  # hauteur des capitales et des chiffres, en em

PLANCHES = [
    ('min.png', ['abcdefg', 'hijklmn', 'opqrstu', 'vwxyz'], 'x'),
    ('maj2.png', ['ABCDEFG', 'HIJKLMN', 'OPQRSTU', 'VWXYZ'], 'cap'),
    ('acc.png', ['éèêëàâ', 'çîïôûù', 'œÉÈÀÇï'], 'x'),
    ('ponct.png', ['0123456', '789.,;:', "!?’«»-("], 'cap'),
]
DESCENDANTES = set('gjpqyçÇ,;(')
# ce qui repose sur la ligne de base (les guillemets, tirets et apostrophes flottent au-dessus)
SUR_BASE = set('abcdefhiklmnorstuvwxzéèêëàâîïôûùœABCDEFGHIJKLMNOPRSTUVWXYZÉÈÀ0123456789!?.:')
# lettres dont le corps donne la hauteur de référence de la rangée
REF_X = set('acemnorsuvwxzéèêëàâçîïôûùœ')
REF_CAP = set('ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789ÉÈÀÇ')


def otsu(v):
    h, e = np.histogram(v, bins=256)
    c = (e[:-1] + e[1:]) / 2
    w0 = np.cumsum(h)
    w1 = w0[-1] - w0
    m0 = np.cumsum(h * c) / np.maximum(w0, 1)
    m1 = (np.sum(h * c) - np.cumsum(h * c)) / np.maximum(w1, 1)
    return c[np.argmax(w0 * w1 * (m0 - m1) ** 2)]


def encre(img: Image.Image):
    g = np.asarray(img.convert('L')).astype(np.float32)
    H, W = g.shape
    flou = ndi.gaussian_filter(g, 20)
    bord = np.concatenate([flou[: H // 50].ravel(), flou[-H // 50 :].ravel(), flou[:, : W // 50].ravel(), flou[:, -W // 50 :].ravel()])
    centre = flou[H // 4 : 3 * H // 4, W // 4 : 3 * W // 4]
    if np.median(centre) - np.median(bord) > 12:
        # une planche posée sur un carton gris : on garde le tissu seul
        tissu = flou > otsu(flou)
        lab, n = ndi.label(tissu)
        tissu = lab == (np.argmax(ndi.sum(tissu, lab, range(1, n + 1))) + 1)
        tissu = ndi.binary_erosion(ndi.binary_fill_holes(tissu), iterations=30)
    else:
        tissu = np.ones_like(g, bool)
        tissu[: H // 60] = tissu[-H // 60 :] = False
        tissu[:, : W // 60] = tissu[:, -W // 60 :] = False
    fond = ndi.gaussian_filter(g, 30)
    d = np.clip((fond - g) / 90.0, 0, 1) * tissu
    return d, np.asarray(img.convert('RGB')).astype(np.float32)


def glyphes(d, rangees):
    m = ndi.binary_opening(d > 0.22, iterations=1)
    m = ndi.binary_closing(m, iterations=3)  # les points arrière se rejoignent
    lab, n = ndi.label(m)
    objs = ndi.find_objects(lab)
    comps = []
    for i, sl in enumerate(objs):
        if sl is None:
            continue
        aire = int((lab[sl] == i + 1).sum())
        if aire < 40:
            continue
        encre_moy = float(d[sl][lab[sl] == i + 1].mean())
        comps.append({'y0': sl[0].start, 'y1': sl[0].stop, 'x0': sl[1].start, 'x1': sl[1].stop, 'aire': aire, 'id': i + 1, 'encre': encre_moy})
    # rangées : les grands tracés (les lettres) se rangent en k bandes ; on coupe aux k-1 plus grands écarts
    grands = sorted([c for c in comps if c['aire'] > 0.25 * np.median([x['aire'] for x in comps if x['aire'] > 400] or [400])],
                    key=lambda c: (c['y0'] + c['y1']) / 2)
    ys = [(c['y0'] + c['y1']) / 2 for c in grands]
    k = len(rangees)
    coupes = sorted(np.argsort(np.diff(ys))[-(k - 1):]) if k > 1 else []
    groupes_y = np.split(np.array(grands, dtype=object), [c + 1 for c in coupes])
    # la boîte « des lettres » de chaque rangée : haut et bas médians (sans jambages ni accents)
    boites = [(float(np.median([c['y0'] for c in gy])), float(np.median([c['y1'] for c in gy]))) for gy in groupes_y]
    # les petits morceaux (accents, points) ne comptent que s'ils sont près d'une lettre
    ref_aire = np.median([x['aire'] for x in grands])
    comps = [c for c in comps if c['aire'] > 0.25 * ref_aire or
             c['aire'] > 0.03 * ref_aire and c['encre'] > 0.42 and any(abs((c['x0'] + c['x1']) / 2 - (g['x0'] + g['x1']) / 2) < (g['x1'] - g['x0']) and
                 g['y0'] - 1.2 * (g['y1'] - g['y0']) < c['y0'] < g['y1'] + 0.6 * (g['y1'] - g['y0']) for g in grands)]
    sortie = []
    def rangee_de(c):
        cy = (c['y0'] + c['y1']) / 2
        dist = [max(b0 - cy, 0, cy - b1) for b0, b1 in boites]
        # à égalité, la rangée du dessous : un point ou un accent se pose au-dessus de sa lettre
        return min(range(len(boites)), key=lambda k: (dist[k], -k))
    par_rangee = [[] for _ in boites]
    for c in comps:
        par_rangee[rangee_de(c)].append(c)
    for rg, chars in zip(par_rangee, rangees):
        cs = sorted(rg, key=lambda c: c['x0'])
        # regroupe les morceaux d'une même lettre (accent, cédille, point) : recouvrement horizontal
        groupes = []
        for c in cs:
            if groupes and c['x0'] < groupes[-1]['x1'] - 4:
                g = groupes[-1]
                g['parts'].append(c)
                g['x1'] = max(g['x1'], c['x1'])
            else:
                groupes.append({'x0': c['x0'], 'x1': c['x1'], 'parts': [c]})
        while len(groupes) > len(chars):
            k = int(np.argmin([groupes[i + 1]['x0'] - groupes[i]['x1'] for i in range(len(groupes) - 1)]))
            a, b = groupes[k], groupes[k + 1]
            groupes[k : k + 2] = [{'x0': a['x0'], 'x1': max(a['x1'], b['x1']), 'parts': a['parts'] + b['parts']}]
        assert len(groupes) == len(chars), f'rangée « {chars} » : {len(groupes)} lettres trouvées'
        for ch, g in zip(chars, groupes):
            ids = [p['id'] for p in g['parts']]
            corps = max(g['parts'], key=lambda p: p['aire'])
            sortie.append({
                'ch': ch,
                'x0': g['x0'], 'x1': g['x1'],
                'y0': min(p['y0'] for p in g['parts']), 'y1': max(p['y1'] for p in g['parts']),
                'corps': corps, 'ids': ids, 'n': len(ids),
            })
    return sortie, lab


def main():
    atlas_parts = []  # (ch, image RGBA, largeur em, desc em)
    for nom, rangees, ref in PLANCHES:
        d, rgb = encre(Image.open(SRC / nom))
        gs, lab = glyphes(d, rangees)
        # ligne de base par rangée : bas médian des lettres sans jambage
        for chars in rangees:
            rg = [g for g in gs if g['ch'] in chars]
            base = float(np.median([g['corps']['y1'] for g in rg if g['ch'] in SUR_BASE]))
            for g in rg:
                g['base'] = base
        hauteurs = [g['base'] - g['corps']['y0'] for g in gs if g['ch'] in (REF_X if ref == 'x' else REF_CAP)]
        echelle = EM * (XH if ref == 'x' else CAP) / float(np.median(hauteurs))
        # les capitales accentuées de la planche des accents : même échelle que leurs minuscules
        for g in gs:
            pad = 6
            y0, y1, x0, x1 = g['y0'] - pad, g['y1'] + pad, g['x0'] - pad, g['x1'] + pad
            masque = np.isin(lab[y0:y1, x0:x1], g['ids'])
            masque = ndi.binary_dilation(masque, iterations=4)
            a = np.clip(d[y0:y1, x0:x1] * 1.25, 0, 1) * masque
            col = np.clip(rgb[y0:y1, x0:x1] * 0.55, 0, 255)
            im = Image.fromarray(np.dstack([col, a * 255]).astype(np.uint8), 'RGBA')
            w, h = im.size
            im = im.resize((max(1, round(w * echelle)), max(1, round(h * echelle))), Image.LANCZOS)
            atlas_parts.append({
                'ch': g['ch'],
                'n': g['n'],
                'im': im,
                'desc': (y1 - g['base']) * echelle / EM,  # ce qui descend sous la ligne de base
            })
    # i et j : le point, pris sur le point final brodé
    point = next(p for p in atlas_parts if p['ch'] == '.')
    for ch in 'ij':
        p = next(p for p in atlas_parts if p['ch'] == ch)
        if p['n'] > 1:  # le point est déjà brodé
            continue
        im = p['im']
        pt = point['im'].resize((round(point['im'].width * 0.8), round(point['im'].height * 0.8)), Image.LANCZOS)
        top_corps = im.height - round((p['desc'] + XH) * EM)  # haut du corps dans l'image
        gap = round(0.13 * EM)
        extra = max(0, pt.height + gap - top_corps)
        neuve = Image.new('RGBA', (max(im.width, pt.width), im.height + extra), (0, 0, 0, 0))
        neuve.paste(im, (0, extra), im)
        neuve.paste(pt, ((neuve.width - pt.width) // 2 + (2 if ch == 'i' else 4), max(0, top_corps + extra - gap - pt.height)), pt)
        p['im'] = neuve
    # parenthèse fermante : la parenthèse ouvrante, en miroir
    par = next(p for p in atlas_parts if p['ch'] == '(')
    atlas_parts.append({'ch': ')', 'im': par['im'].transpose(Image.FLIP_LEFT_RIGHT), 'desc': par['desc']})
    # apostrophe droite = apostrophe typographique
    ap = next(p for p in atlas_parts if p['ch'] == '’')
    atlas_parts.append({'ch': "'", 'im': ap['im'], 'desc': ap['desc']})

    # assemblage de l'atlas (rangées de 1024 px)
    W, x, y, rh = 1024, 0, 0, 0
    pos = []
    for p in atlas_parts:
        w, h = p['im'].size
        if x + w > W:
            x, y, rh = 0, y + rh + 2, 0
        pos.append((x, y))
        x += w + 2
        rh = max(rh, h)
    H = y + rh
    atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    meta = {'em': EM, 'largeur': W, 'hauteur': H, 'glyphes': {}}
    for p, (px, py) in zip(atlas_parts, pos):
        atlas.paste(p['im'], (px, py))
        w, h = p['im'].size
        meta['glyphes'].setdefault(p['ch'], []).append({'x': px, 'y': py, 'w': w, 'h': h, 'd': round(p['desc'] * EM, 1)})
    atlas.save(RACINE / 'public' / 'hd' / 'alphabet.webp', quality=86, method=6)
    (RACINE / 'src' / 'data' / 'alphabet.json').write_text(json.dumps(meta, ensure_ascii=False))
    print('atlas', atlas.size, len(meta['glyphes']), 'caractères')


main()
