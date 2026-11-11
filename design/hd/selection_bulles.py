"""
Les 100 bulles du mélange (4 novembre 2026) : parmi les bulles gardées par Tom dans design/tri-bulles.json (planches 2, 3, 4),
choisir 100 qui tiennent ensemble dans la constellation. Chaque bulle est mesurée telle qu'elle sera peinte (bubbleSprite.ts :
le pigment découpé par la tache, puis la densité en multiplication, 0,28 pour une aquarelle, 1 pour une encre), à 40 px sur le
papier : poids (ce qu'elle assombrit), effet bille (un dégradé d'un seul côté), bord (ce qui reste dans la couronne).

Règles : pas de bille (part expliquée par un plan > 0,45), pas d'extrême de poids (hors 8 % à 92 % des 290), un tiers par
planche, familles servies à tour de rôle, et à chaque tour la bulle la plus proche du poids médian de tout le lot : c'est ce
qui fait l'harmonie, trois matières différentes mais le même poids à l'écran.

  python design/hd/selection_bulles.py
  → design/selection-bulles.json, et les planches dans reports/Bulles 2026-11-04/
"""
import json
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

RACINE = Path(__file__).resolve().parents[2]
HD = RACINE / 'public' / 'hd'
SORTIE = RACINE.parent / 'reports' / 'Bulles 2026-11-04'
PLANCHES = {
    'm': (2, 'taches-melange', lambda d: f"melange-{d['n']:03d}.webp", 'famille', 'fr', 0.28),
    'c': (3, 'taches-claude', lambda d: d['f'], 'groupe', 'nom', 0.28),
    'g': (4, 'taches-gothique', lambda d: f"gothique-{d['n']:03d}.webp", 'famille', 'nom', 1.0),
}
GRIS = ['#4B6097', '#3C75AA', '#84BAE3', '#8892C9', '#7F9FAC', '#74AFCF', '#59A6AB', '#7EA5A3', '#52AE9A', '#8DBEB2', '#648560', '#7B867E',
        '#D17067', '#B0676E', '#EB8D8D', '#DFABA4', '#D9647A', '#C4878A', '#9C62A3', '#827A9C', '#63577C', '#AFA4E2', '#7483B8', '#954B7F',
        '#F6C761', '#E4B476', '#DB8F50', '#E2E288', '#B6B3A0', '#9AACAE']
PAPIER = 0.93
N = 40
yy, xx = np.mgrid[0:N, 0:N]
xx = (xx - (N - 1) / 2) / (N / 2 * 0.82)
yy = (yy - (N - 1) / 2) / (N / 2 * 0.82)
rr = np.hypot(xx, yy)
disque = rr < 0.96
couronne = (rr > 0.7) & disque


def mesurer(chemin, k):
    a = np.asarray(Image.open(chemin).convert('RGBA').resize((N, N), Image.LANCZOS)).astype(float) / 255
    alpha, gris = a[..., 3], a[..., 0]
    # ton vu sur le papier, pour une couleur GRIS moyenne (clarté 0,6)
    ton = alpha * 0.6 * (1 - k * alpha * (1 - gris)) + (1 - alpha) * PAPIER
    poids = float((PAPIER - ton)[disque].mean())
    z = ton[disque]
    X = np.c_[xx[disque], yy[disque], np.ones(z.size)]
    c, *_ = np.linalg.lstsq(X, z, rcond=None)
    bille = float(1 - ((z - X @ c) ** 2).sum() / max(((z - z.mean()) ** 2).sum(), 1e-9))
    bord = float((PAPIER - ton)[couronne].mean() / max(poids, 1e-6))
    return poids, bille, bord


def teinter(chemin, k, hexa, taille):
    """La bulle comme bubbleSprite la peint : pigment découpé, puis densité multipliée."""
    a = np.asarray(Image.open(chemin).convert('RGBA').resize((taille, taille), Image.LANCZOS)).astype(float) / 255
    rgb = np.array([int(hexa[i:i + 2], 16) for i in (1, 3, 5)]) / 255
    alpha, gris = a[..., 3:4], a[..., :3]
    couleur = rgb * (1 - k * alpha * (1 - gris))
    return Image.fromarray((np.dstack([couleur, alpha[..., 0]]) * 255).astype(np.uint8), 'RGBA')


def planche(liste, chemin, titre):
    cote, marge, colonnes = 96, 8, 20
    lignes = -(-len(liste) // colonnes)
    im = Image.new('RGB', (colonnes * (cote + marge) + marge, 40 + lignes * (cote + marge + 14) + marge), (236, 233, 226))
    d = ImageDraw.Draw(im)
    try:
        police = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 16)
        petite = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 10)
    except OSError:
        police = petite = ImageFont.load_default()
    d.text((marge, 12), titre, fill=(47, 44, 51), font=police)
    for i, b in enumerate(liste):
        k = PLANCHES[b['id'][0]][5]
        hexa = GRIS[sum(map(ord, b['id'])) % len(GRIS)]
        bulle = teinter(b['chemin'], k, hexa, cote)
        x, y = marge + (i % colonnes) * (cote + marge), 40 + (i // colonnes) * (cote + marge + 14)
        im.paste(bulle, (x, y), bulle)
        d.text((x, y + cote), f"{b['id']}  {b.get('ecartees', '')}", fill=(120, 116, 122), font=petite)
    im.save(chemin)
    print('planche', chemin.name, im.size)


def main():
    tri = json.loads((RACINE / 'design' / 'tri-bulles.json').read_text(encoding='utf-8'))
    gardees = {i for i, g in tri['gestes'] if g}
    bulles = []
    for lettre, (num, dossier, fichier, cle_famille, cle_nom, k) in PLANCHES.items():
        index = json.loads((HD / dossier / 'index.json').read_text(encoding='utf-8'))
        for d in index:
            ident = f"{lettre}{d['n']}"
            if ident not in gardees:
                continue
            chemin = HD / dossier / fichier(d)
            poids, bille, bord = mesurer(chemin, k)
            bulles.append(dict(id=ident, planche=num, n=d['n'], nom=d[cle_nom], famille=d[cle_famille], chemin=str(chemin), poids=poids, bille=bille, bord=bord))
    poids = np.array([b['poids'] for b in bulles])
    bas, haut, mediane = np.percentile(poids, 8), np.percentile(poids, 92), float(np.median(poids))
    for b in bulles:
        b['ecartees'] = 'bille' if b['bille'] > 0.45 else 'trop pâle' if b['poids'] < bas else 'trop lourde' if b['poids'] > haut else ''
    print(f"{len(bulles)} gardées par Tom ; poids médian {mediane:.3f}, bande {bas:.3f}–{haut:.3f}")
    for raison in ('bille', 'trop pâle', 'trop lourde'):
        print(' ', raison, sorted(b['id'] for b in bulles if b['ecartees'] == raison))
    choix = []
    quotas = {2: 33, 3: 33, 4: 34}
    for num, quota in quotas.items():
        familles = defaultdict(list)
        for b in bulles:
            if b['planche'] == num and not b['ecartees']:
                familles[b['famille']].append(b)
        for f in familles.values():
            f.sort(key=lambda b: abs(b['poids'] - mediane))
        pris = []
        while len(pris) < quota and any(familles.values()):
            # un tour sur chaque famille, la plus proche du poids médian d'abord
            for nom in sorted(familles, key=lambda n: abs(familles[n][0]['poids'] - mediane) if familles[n] else 9):
                if familles[nom] and len(pris) < quota:
                    pris.append(familles[nom].pop(0))
        choix.extend(pris)
    ids = {b['id'] for b in choix}
    for b in bulles:
        b['choisie'] = b['id'] in ids
    print('choisies :', {p: sum(1 for b in choix if b['planche'] == p) for p in quotas})
    autres = [b['poids'] for b in bulles if not b['choisie']]
    print('poids des choisies : %.3f ± %.3f ; des autres : %.3f ± %.3f' % (
        np.mean([b['poids'] for b in choix]), np.std([b['poids'] for b in choix]), np.mean(autres), np.std(autres)))
    sel = dict(
        date='2026-11-04', regle='un tiers par planche, familles à tour de rôle, poids le plus proche de la médiane, sans bille ni extrême',
        planche2=sorted(b['n'] for b in choix if b['planche'] == 2),
        planche3=sorted(b['n'] for b in choix if b['planche'] == 3),
        planche4=sorted(b['n'] for b in choix if b['planche'] == 4),
        bulles=[dict(id=b['id'], planche=b['planche'], n=b['n'], nom=b['nom'], famille=b['famille'], poids=round(b['poids'], 3)) for b in choix],
    )
    (RACINE / 'design' / 'selection-bulles.json').write_text(json.dumps(sel, ensure_ascii=False, indent=1), encoding='utf-8')
    SORTIE.mkdir(parents=True, exist_ok=True)
    (SORTIE / 'mesures.json').write_text(json.dumps([{k: v for k, v in b.items() if k != 'chemin'} for b in bulles], ensure_ascii=False, indent=1), encoding='utf-8')
    planche(choix, SORTIE / 'les-100-proposees.png', 'Les 100 proposées (un tiers par planche, même poids à l’écran)')
    planche([b for b in bulles if not b['choisie']], SORTIE / 'les-190-ecartees.png', 'Les 190 écartées (raison en gris quand il y en a une)')


if __name__ == '__main__':
    main()
