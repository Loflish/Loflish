"""
Planche 5 « filaments de lumière » peinte par code (4 novembre 2026). Flow n'était pas joignable : chaque bulle est
tracée ici, en 4 096 px réduits à 2 048, à partir de design/planche-5-lumiere.json. Un lavis clair (le papier est la
lumière), puis des filaments tirés dans un champ de courant (bruit tourbillonnant), fumés ou secs, qui se perdent
dans les bords. La sortie suit le format des encres (taches_gothique.py : gris plein, alpha minimal VOILE).

  python design/hd/lumiere.py [numéros…]       (sans numéro : les 100)
  → .claude/nmm-inspiration/lumiere-2026-11-04/NNN.png (aperçu gris sur papier, 2 048 px)
  → public/hd/taches-lumiere/lumiere-NNN.webp (matière 1 024 px) + index.json
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

RACINE = Path(__file__).resolve().parents[2]
PLAN = RACINE / 'design' / 'planche-5-lumiere.json'
APERCUS = RACINE.parent / '.claude' / 'nmm-inspiration' / 'lumiere-2026-11-04'
OUT = RACINE / 'public' / 'hd' / 'taches-lumiere'
R = 4096  # taille de travail
S = 2048  # aperçu
M = 1024  # matière
DISQUE = 0.82
ENCRE, VOILE = 0.1, 0.36


# ——— bruit
def bruit(rng, taille, octaves=4, base=8, aniso=1.0):
    """bruit de valeur lissé, somme d'octaves, entre -1 et 1 ; aniso > 1 étire horizontalement"""
    out = np.zeros((taille, taille))
    amp, total = 1.0, 0.0
    for o in range(octaves):
        n = base * 2**o
        g = rng.standard_normal((max(2, int(n / aniso)), n))
        out += amp * ndi.zoom(g, (taille / g.shape[0], taille / g.shape[1]), order=3)
        total += amp
        amp *= 0.5
    out /= total
    return out / (np.abs(out).max() + 1e-9)


def champ(rng, taille=512, base=3, octaves=3):
    """champ tourbillonnant sans source ni puits : le rotationnel d'un potentiel bruité"""
    p = bruit(rng, taille, octaves, base)
    gy, gx = np.gradient(p)
    n = np.hypot(gx, gy) + 1e-9
    return gy / n, -gx / n  # (dx, dy) = (dP/dy, -dP/dx), de longueur 1


def echantillon(tab, x, y):
    """valeur d'un tableau (taille t) aux positions x, y dans [0, 1]"""
    t = tab.shape[0]
    xi = np.clip(np.atleast_1d(x) * (t - 1), 0, t - 1)
    yi = np.clip(np.atleast_1d(y) * (t - 1), 0, t - 1)
    v = ndi.map_coordinates(tab, [yi, xi], order=1, mode='nearest')
    return v if np.ndim(x) else float(v[0])


# ——— points de départ (en coordonnées du disque : centre 0, rayon 1)
def departs(rng, n, disposition):
    if disposition == 'tout':
        r, t = np.sqrt(rng.random(n)) * 0.95, rng.random(n) * 2 * np.pi
    elif disposition == 'centre':
        r, t = np.abs(rng.standard_normal(n)) * 0.25, rng.random(n) * 2 * np.pi
    elif disposition == 'anneau':
        r, t = 0.55 + rng.standard_normal(n) * 0.12, rng.random(n) * 2 * np.pi
    elif disposition == 'bas':
        r, t = np.sqrt(rng.random(n)) * 0.95, np.pi / 2 + rng.standard_normal(n) * 0.5
    elif disposition == 'haut':
        r, t = np.sqrt(rng.random(n)) * 0.95, -np.pi / 2 + rng.standard_normal(n) * 0.5
    elif disposition == 'flanc':
        r, t = np.sqrt(rng.random(n)) * 0.95, np.pi + rng.standard_normal(n) * 0.5
    elif disposition == 'point':
        r, t = 0.08 + rng.random(n) * 0.14, rng.random(n) * 2 * np.pi
        return np.c_[r * np.cos(t) - 0.1, r * np.sin(t) + 0.45]
    elif disposition == 'bande':
        u = rng.random(n) * 2 - 1
        v = rng.standard_normal(n) * 0.12
        return np.c_[u * 0.8 - v * 0.7, -u * 0.5 + v * 0.7]
    elif disposition == 'coin':
        r, t = np.abs(rng.standard_normal(n)) * 0.3, rng.random(n) * 2 * np.pi
        return np.c_[r * np.cos(t) - 0.5, r * np.sin(t) + 0.5]
    else:
        raise ValueError(disposition)
    return np.c_[r * np.cos(t), r * np.sin(t)]


# ——— les fils : chacun une manière de tirer des lignes dans le champ
FILS = {
    # nom : (nombre, longueur min, max, largeur px à 4096, force, flou fumée, tremblement, pas)
    'soie': dict(n=1400, lg=(0.25, 0.9), w=(1.0, 2.2), force=(0.35, 0.8), flou=0, tremble=0, courbe=1.0),
    'fumee': dict(n=260, lg=(0.4, 1.1), w=(2.0, 7.0), force=(0.3, 0.7), flou=6, tremble=0, courbe=0.8),
    'sec': dict(n=90, lg=(0.3, 0.8), w=(1.2, 2.0), force=(0.5, 0.9), flou=0, tremble=0, courbe=0.5, faisceau=9),
    'brume': dict(n=70, lg=(0.6, 1.3), w=(1.5, 3.0), force=(0.25, 0.5), flou=3, tremble=0, courbe=1.6),
    'tremble': dict(n=500, lg=(0.15, 0.5), w=(1.0, 1.6), force=(0.4, 0.8), flou=0, tremble=2.5, courbe=0.8),
    'branche': dict(n=40, lg=(0.4, 0.9), w=(1.0, 3.5), force=(0.5, 0.9), flou=0, tremble=0, courbe=0.6, branches=4),
    'boucle': dict(n=3, lg=(3.0, 5.0), w=(2.0, 3.5), force=(0.6, 0.9), flou=0, tremble=0, courbe=2.6),
    'eau': dict(n=700, lg=(0.4, 1.0), w=(1.0, 2.0), force=(0.3, 0.7), flou=0, tremble=0, courbe=0.9, parallele=True),
    'flottant': dict(n=60, lg=(1.5, 2.5), w=(1.0, 2.0), force=(0.3, 0.6), flou=1, tremble=0, courbe=1.4, parallele=True),
    'botte': dict(n=180, lg=(0.2, 0.5), w=(2.0, 5.0), force=(0.5, 0.9), flou=2, tremble=0, courbe=0.3),
    'fouet': dict(n=6, lg=(0.8, 1.6), w=(1.5, 9.0), force=(0.7, 0.95), flou=0, tremble=0, courbe=1.2),
    'chanvre': dict(n=400, lg=(0.6, 1.0), w=(1.2, 2.4), force=(0.35, 0.7), flou=0, tremble=0, courbe=0.7, parallele=True),
    'pendu': dict(n=350, lg=(0.5, 1.2), w=(1.0, 1.8), force=(0.4, 0.75), flou=0, tremble=0, courbe=0.15, parallele=True),
    'rayon': dict(n=600, lg=(0.3, 0.9), w=(1.0, 1.8), force=(0.35, 0.75), flou=0, tremble=0, courbe=0.1, radial=True),
    'une': dict(n=1, lg=(12.0, 16.0), w=(1.6, 2.4), force=(0.7, 0.85), flou=0, tremble=0, courbe=2.2),
    'flamme': dict(n=900, lg=(0.2, 0.6), w=(1.0, 1.8), force=(0.4, 0.8), flou=0, tremble=0, courbe=0.5, radial=True),
    'etoile': dict(n=90, lg=(0.1, 0.3), w=(1.0, 1.6), force=(0.4, 0.7), flou=0, tremble=0, courbe=0.2, noeuds=True),
    'reserve': dict(n=700, lg=(0.3, 0.9), w=(1.5, 3.0), force=(0.4, 0.8), flou=0, tremble=0, courbe=1.0, pale=True),
}
MOUVEMENTS = {'haut': (0, -1), 'cote': (1, 0), 'rond': None, 'bas': (0, 1), 'ouvert': 'ouvert', 'calme': (0, 0)}


def tracer(rng, fil, disposition, mouvement, densite=1.0, origine=(0.0, 0.0), rayon=1.0):
    """rend une couche de darkness (0..1) en R × R pour un fil"""
    f = FILS[fil]
    n = max(1, int(f['n'] * densite))
    dx, dy = champ(rng, base=2 if f['courbe'] >= 1 else 3, octaves=2)
    pts = departs(rng, n, disposition)
    if f.get('noeuds'):
        # une constellation : des nœuds reliés par des segments hésitants
        couche = Image.new('L', (R, R), 0)
        d = ImageDraw.Draw(couche)
        noeuds = departs(rng, n, disposition)
        pix = lambda p: ((p[0] * rayon + origine[0] + 1) / 2 * R, (p[1] * rayon + origine[1] + 1) / 2 * R)
        for p in noeuds:
            x, y = pix(p)
            r = rng.uniform(3, 9)
            d.ellipse([x - r, y - r, x + r, y + r], fill=int(255 * rng.uniform(0.5, 0.9)))
        for i, p in enumerate(noeuds):
            dist = np.hypot(*(noeuds - p).T)
            for j in np.argsort(dist)[1 : 1 + int(rng.integers(1, 3))]:
                if dist[j] < 0.5:
                    a, b = pix(p), pix(noeuds[j])
                    d.line([a, b], fill=int(255 * rng.uniform(0.3, 0.6)), width=int(rng.uniform(1.0, 1.8)))
        return np.asarray(couche).astype(float) / 255
    couches = {}
    bias = MOUVEMENTS[mouvement]
    foyer = np.array([-0.1, 0.45]) if disposition == 'point' else pts.mean(axis=0)
    for i in range(n):
        p = pts[i].copy()
        lg = rng.uniform(*f['lg'])
        courbe = f['courbe'] * rng.uniform(0.6, 1.4)
        pas = 0.012
        chemin = [p.copy()]
        k = int(lg / pas)
        for s in range(k):
            u = (p[0] + 1) / 2
            v = (p[1] + 1) / 2
            vx = echantillon(dx, u, v) * courbe
            vy = echantillon(dy, u, v) * courbe
            if f.get('radial'):
                q = p - foyer
                r = np.hypot(*q) + 1e-6
                vx += q[0] / r * 1.2
                vy += q[1] / r * 1.2
            if bias == 'ouvert':
                r = np.hypot(*p) + 1e-6
                vx += p[0] / r * 0.6
                vy += p[1] / r * 0.6
            elif bias is None:
                r = np.hypot(*p) + 1e-6
                vx += -p[1] / r * 0.8
                vy += p[0] / r * 0.8
            else:
                vx += bias[0] * 0.45
                vy += bias[1] * 0.45
            if f.get('parallele'):
                vx, vy = vx * 0.4 + (bias[0] if isinstance(bias, tuple) else 0) * 0.9, vy * 0.4 + (bias[1] if isinstance(bias, tuple) else 1) * 0.9
            nv = np.hypot(vx, vy) + 1e-6
            p = p + np.array([vx, vy]) / nv * pas
            if f['tremble']:
                p = p + rng.standard_normal(2) * 0.0015 * f['tremble']
            if np.hypot(*p) > 1.02:
                break
            chemin.append(p.copy())
        if len(chemin) < 4:
            continue
        force = rng.uniform(*f['force'])
        w0 = rng.uniform(*f['w'])
        cle = round(force, 1)
        if cle not in couches:
            couches[cle] = Image.new('L', (R, R), 0)
        d = ImageDraw.Draw(couches[cle])
        ch = np.array(chemin)
        ch = (ch * rayon + np.array(origine) + 1) / 2 * R
        # la ligne s'amincit et pâlit vers sa fin
        morceaux = 9
        taille = max(2, len(ch) // morceaux)
        pression = np.clip(1 - 0.6 * np.linspace(0, 1, morceaux) ** 1.5 + rng.standard_normal(morceaux) * 0.12, 0.15, 1)
        for m in range(morceaux):
            seg = ch[m * taille : (m + 1) * taille + 1]
            if len(seg) < 2:
                break
            w = max(1, int(round(w0 * pression[m] * rng.uniform(0.8, 1.2))))
            d.line([tuple(q) for q in seg], fill=int(255 * pression[m]), width=w, joint='curve')
        if f.get('faisceau'):
            # pinceau sec : les poils se séparent en lignes parallèles
            for b in range(f['faisceau']):
                dec = rng.standard_normal(2) * 9
                d.line([tuple(q + dec) for q in ch[::2]], fill=int(255 * rng.uniform(0.4, 0.9)), width=1)
    out = np.zeros((R, R))
    for cle, im in couches.items():
        a = np.asarray(im).astype(float) / 255 * cle
        out = 1 - (1 - out) * (1 - a)
    if f['flou']:
        out = ndi.gaussian_filter(out, f['flou'] * R / 2048) * 1.3
    return np.clip(out, 0, 1)


# ——— les fonds : un lavis clair, la lumière vient du papier
def lavis(rng, fond, aube_centre=True):
    g = np.linspace(-1, 1, 512)
    X, Y = np.meshgrid(g, g)
    r = np.hypot(X, Y)
    b1 = bruit(rng, 512, 4, 3)
    grain = bruit(rng, 512, 2, 48) * 0.5 + 0.5
    if fond == 'aube':
        d = 0.05 + 0.18 * np.clip(r, 0, 1) ** 1.5 + 0.06 * b1
    elif fond == 'souffle':
        d = 0.08 + 0.14 * (bruit(rng, 512, 3, 2, aniso=6) * 0.5 + 0.5)
    elif fond == 'eau':
        d = 0.10 + 0.16 * (b1 * 0.5 + 0.5) + 0.08 * (grain - 0.5)
    elif fond == 'poussiere':
        d = 0.08 + 0.10 * (b1 * 0.5 + 0.5)
        pts = (bruit(rng, 512, 1, 160) > 0.55) * 0.5
        d = d + pts
    elif fond == 'reserve':
        d = 0.02 + 0.16 * np.clip(r - 0.55, 0, 1) * (b1 * 0.5 + 0.8)
    elif fond == 'courant':
        d = 0.03 + 0.22 * np.exp(-((X * 0.7 + Y) ** 2) / 0.12) * (b1 * 0.4 + 0.8)
    elif fond == 'givre':
        d = 0.08 + 0.12 * (b1 * 0.5 + 0.5) + 0.12 * (bruit(rng, 512, 1, 90) > 0.35)
    elif fond == 'bruine':
        d = 0.06 + 0.16 * (bruit(rng, 512, 3, 2, aniso=0.08) * 0.5 + 0.5)
    else:
        raise ValueError(fond)
    # les réserves : des flaques de papier presque nu, au bord un peu plus chargé (la marée)
    b2 = bruit(rng, 512, 3, 4)
    reserve = np.clip((b2 - 0.25) / 0.2, 0, 1)
    d = d * (1 - 0.85 * reserve)
    gy2, gx2 = np.gradient(reserve)
    d = d + 0.10 * np.clip(np.hypot(gx2, gy2) * 6, 0, 1)
    # mouillé dans mouillé : le pigment s'accumule au bord des flaques (le gradient du bruit)
    gy, gx = np.gradient(ndi.gaussian_filter(b1, 3))
    maree = np.hypot(gx, gy)
    d = d + 0.10 * np.clip(maree / (np.percentile(maree, 97) + 1e-9), 0, 1) ** 2
    # la ligne de marée du disque : inégale, absente par endroits
    d = d + 0.06 * np.clip((r - 0.84) / 0.12, 0, 1) * np.clip(b1 * 1.5 + 0.6, 0, 1)
    d = ndi.zoom(d, R / 512, order=1)
    # la granulation du papier, fine, seulement là où c'est mouillé
    g2 = rng.standard_normal((R // 2, R // 2))
    g2 = ndi.zoom(ndi.gaussian_filter(g2, 1.2), 2, order=1)
    g2 = g2 / (np.abs(g2).max() + 1e-9)
    d = d * (1 + 0.35 * g2 * np.clip(d / 0.15, 0, 1))
    return np.clip(d, 0, 1)


def disque(rng):
    """le disque irrégulier au bord doux, et sa marée"""
    g = np.linspace(-1, 1, 512)
    X, Y = np.meshgrid(g, g)
    t = np.arctan2(Y, X)
    b = bruit(rng, 256, 3, 3)
    bord = 1 + 0.045 * b[((np.sin(t) * 0.4 + 0.5) * 255).astype(int), ((np.cos(t) * 0.4 + 0.5) * 255).astype(int)]
    m = np.clip((bord - np.hypot(X, Y)) / 0.035, 0, 1)
    return ndi.zoom(m, R / 512, order=1)


def peindre(b, seed):
    rng = np.random.default_rng(seed)
    garde = disque(rng)
    d = lavis(rng, b['fond'])
    fils = np.zeros_like(d)
    for couche in b['couches']:
        fil = tracer(rng, couche['fil'], couche['ou'], b['mouvement'], couche.get('densite', 1.0), couche.get('origine', (0, 0)), couche.get('rayon', 1.0))
        if FILS[couche['fil']].get('pale'):
            d = d * (1 - fil * 0.9)
        else:
            fils = 1 - (1 - fils) * (1 - fil)
    return np.clip(d, 0, 1) * garde, np.clip(fils, 0, 1) * garde, garde


def apercu(d, fils):
    tout = 1 - (1 - d) * (1 - fils)
    return Image.fromarray(((1 - tout) * 255).astype(np.uint8), 'L').resize((S, S), Image.LANCZOS)


def matiere(d, fils, garde):
    """le lavis fait la couverture (la couleur, avec ses réserves de papier) ; les fils seuls font le sombre"""
    reduire = lambda t: np.asarray(Image.fromarray((np.clip(t, 0, 1) * 255).astype(np.uint8), 'L').resize((M, M), Image.LANCZOS)).astype(float) / 255
    a, f, g = reduire(d), reduire(fils), reduire(garde)
    a = np.clip(a / max(np.percentile(a[g > 0.9], 95), 1e-3), 0, 1)
    f = np.clip(f / max(np.percentile(f[g > 0.9], 99.5), 1e-3), 0, 1)
    gris = 1 - (1 - ENCRE) * f**0.9
    alpha = np.clip(0.12 + 0.88 * a**0.6, 0, 1) * g
    alpha = np.maximum(alpha, f * 0.9 * g)  # un fil sur le papier nu reste visible
    # la tache occupe 82 % de la vignette (paintTache)
    im = Image.fromarray(np.dstack([gris * 255, gris * 255, gris * 255, alpha * 255]).astype(np.uint8), 'RGBA')
    cote = int(M / DISQUE)
    toile = Image.new('RGBA', (cote, cote), (255, 255, 255, 0))
    toile.paste(im, ((cote - M) // 2, (cote - M) // 2))
    return toile.resize((M, M), Image.LANCZOS)


# ——— recettes : comment chaque motif se construit (fil, disposition, densité). Les 8 essais d'abord.
RECETTES = {
    1: dict(couches=[dict(fil='etoile', ou='tout', densite=1.0), dict(fil='soie', ou='tout', densite=0.25)]),
    2: dict(couches=[dict(fil='tremble', ou='flanc', densite=1.2), dict(fil='fumee', ou='flanc', densite=0.4)]),
    21: dict(couches=[dict(fil='fumee', ou='bas', densite=1.0), dict(fil='soie', ou='bas', densite=0.5)]),
    27: dict(couches=[dict(fil='eau', ou='centre', densite=1.0), dict(fil='boucle', ou='centre', densite=1.0)]),
    41: dict(couches=[dict(fil='chanvre', ou='tout', densite=1.2)]),
    43: dict(couches=[dict(fil='soie', ou='anneau', densite=1.0), dict(fil='reserve', ou='anneau', densite=0.5)]),
    64: dict(couches=[dict(fil='pendu', ou='haut', densite=0.8), dict(fil='reserve', ou='centre', densite=0.6)]),
    81: dict(couches=[dict(fil='rayon', ou='point', densite=1.2), dict(fil='fumee', ou='point', densite=0.5)]),
}


def recette(b, rng):
    """la recette d'une bulle sans recette écrite : le fil du plan, une disposition lue dans le motif, une seconde couche par famille"""
    m = b['motif']
    ou = 'tout'
    for mots, disp in [
        (('one side', 'at one side', 'on one side', 'from one corner'), 'flanc'),
        (('low in the disc', 'bottom', 'settling', 'lying low', 'from the rim', 'welling up'), 'bas'),
        (('falling', 'hanging', 'down like', 'drifting down', 'sinks', 'from the top'), 'haut'),
        (('from one point', 'from one small', 'from a bright centre', 'at one point', 'one small dense knot', 'from one bright'), 'point'),
        (('ring', 'circling', 'around an empty', 'concentric', 'spiral', 'whirl'), 'anneau'),
        (('diagonal', 'band', 'crossing the disc', 'across the disc', 'current'), 'bande'),
        (('centre', 'center', 'bud', 'cluster'), 'centre'),
    ]:
        if any(w in m for w in mots):
            ou = disp
            break
    seconde = {
        'Poussière de lumière': ('etoile', 0.5),
        'L’encre dans l’eau': ('flottant', 0.5),
        'Le vent': ('chanvre', 0.5),
        'Les fragments': ('pendu', 0.45),
        'Ce qui s’ouvre': ('rayon', 0.5),
    }[b['famille']]
    couches = [dict(fil=b['fil'], ou=ou, densite=float(rng.uniform(0.7, 1.3)))]
    if rng.random() < 0.7 and seconde[0] != b['fil']:
        couches.append(dict(fil=seconde[0], ou=ou if rng.random() < 0.6 else 'tout', densite=seconde[1]))
    return dict(couches=couches)


def main():
    plan = json.loads(PLAN.read_text(encoding='utf-8'))
    bulles = {b['n']: b for b in plan['bulles']}
    voulus = [int(a) for a in sys.argv[1:]] or sorted(bulles)
    APERCUS.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    for n in voulus:
        b = dict(bulles[n], **(RECETTES.get(n) or recette(bulles[n], np.random.default_rng(n))))
        d, fils, garde = peindre(b, seed=1000 + n)
        apercu(d, fils).save(APERCUS / f'{n:03d}.png')
        matiere(d, fils, garde).save(OUT / f'lumiere-{n:03d}.webp', quality=90, method=4)
        index.append(dict(n=n, nom=b['nom'], famille=b['famille']))
        print(f"{n:03d} {b['nom']:28s} {b['fond']:10s} lavis {d[garde > 0.5].mean():.2f} fils {fils[garde > 0.5].mean():.3f}")
    if len(voulus) >= 8:
        (OUT / 'index.json').write_text(json.dumps(index, ensure_ascii=False), encoding='utf-8')


if __name__ == '__main__':
    main()
