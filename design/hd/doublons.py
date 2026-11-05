"""
Les bulles qui se ressemblent (5 novembre 2026). Parmi les bulles que Tom aime (design/atelier-bulles.json, planches 2
et 3), chaque paire est comparée telle que le site la peint (couverture et densité, 48 px, disque), au mieux de 24
rotations et du miroir (une aquarelle est tournée au hasard dans la constellation). Les paires au-dessus du seuil
forment des groupes ; Tom tranche dans /#/atelier/doublons.

  python design/hd/doublons.py [seuil]      (seuil par défaut 0,84, lien moyen)
  → design/doublons-bulles.json et reports/Bulles 2026-11-04/doublons.png
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

RACINE = Path(__file__).resolve().parents[2]
HD = RACINE / 'public' / 'hd'
SORTIE = RACINE.parent / 'reports' / 'Bulles 2026-11-04'
MELANGE, CLAUDE = 3000, 4000
N = 48


def aimees():
    avis = json.loads((RACINE / 'design' / 'atelier-bulles.json').read_text(encoding='utf-8'))
    melange = {d['n']: d for d in json.loads((HD / 'taches-melange' / 'index.json').read_text(encoding='utf-8'))}
    claude = {d['n']: d for d in json.loads((HD / 'taches-claude' / 'index.json').read_text(encoding='utf-8'))}
    out = []
    for k, v in avis.items():
        n = int(k)
        if v.get('avis') != 'aime':
            continue
        if MELANGE < n <= MELANGE + 100:
            d = melange[n - MELANGE]
            out.append(dict(n=n, planche=2, nom=d['fr'], chemin=HD / 'taches-melange' / f"melange-{d['n']:03d}.webp"))
        elif CLAUDE < n <= CLAUDE + 100:
            d = claude[n - CLAUDE]
            out.append(dict(n=n, planche=3, nom=d['nom'], chemin=HD / 'taches-claude' / d['f']))
    return sorted(out, key=lambda b: b['n'])


def signal(chemin):
    """ce que l'œil voit : la couverture et, dedans, la densité (paintTache : multiplication à 0,28)"""
    a = np.asarray(Image.open(chemin).convert('RGBA').resize((N, N), Image.LANCZOS)).astype(float) / 255
    alpha, gris = a[..., 3], a[..., 0]
    return 0.6 * alpha + 0.4 * alpha * (1 - gris)


def variantes(s):
    """24 rotations × miroir, masquées au disque, centrées et normées : prêtes pour une corrélation"""
    yy, xx = np.mgrid[0:N, 0:N]
    disque = np.hypot(xx - (N - 1) / 2, yy - (N - 1) / 2) < N / 2 * 0.95
    im = Image.fromarray((s * 255).astype(np.uint8))
    out = []
    for miroir in (False, True):
        base = im.transpose(Image.FLIP_LEFT_RIGHT) if miroir else im
        for k in range(24):
            r = np.asarray(base.rotate(k * 15, resample=Image.BILINEAR)).astype(float) / 255
            v = r[disque]
            v = v - v.mean()
            out.append(v / (np.linalg.norm(v) + 1e-9))
    return np.array(out)


def main():
    seuil = float(sys.argv[1]) if len(sys.argv) > 1 else 0.84
    bulles = aimees()
    print(len(bulles), 'bulles aimées')
    X = np.array([variantes(signal(b['chemin'])) for b in bulles])  # (B, 48, P)
    ref = X[:, 0, :]  # chaque bulle dans sa position d'origine
    # similarité = meilleure corrélation entre A (toutes variantes) et B (origine)
    S = np.max(np.einsum('avp,bp->abv', X, ref), axis=2)
    S = np.maximum(S, S.T)
    np.fill_diagonal(S, 0)
    paires = [(S[i, j], i, j) for i in range(len(bulles)) for j in range(i + 1, len(bulles)) if S[i, j] >= seuil]
    paires.sort(reverse=True)
    print(len(paires), 'paires au-dessus de', seuil, '; quantiles de S :', np.round(np.percentile(S[np.triu_indices(len(bulles), 1)], [50, 90, 99, 99.9]), 3))
    # groupes : lien moyen (scipy), pour qu'une chaîne de voisins ne colle pas tout le monde ensemble
    from scipy.cluster.hierarchy import fcluster, linkage
    from scipy.spatial.distance import squareform

    D = 1 - S
    np.fill_diagonal(D, 0)
    etiquettes = fcluster(linkage(squareform(D, checks=False), 'average'), t=1 - seuil, criterion='distance')
    groupes = {}
    for i, e in enumerate(etiquettes):
        groupes.setdefault(int(e), []).append(i)
    groupes = [g for g in groupes.values() if len(g) > 1]
    # un score par groupe : la plus forte ressemblance qu'il contient ; les plus flagrants d'abord
    def score(g):
        return max(S[i, j] for i in g for j in g if i != j)

    groupes.sort(key=score, reverse=True)
    out = dict(
        date='2026-11-05',
        seuil=seuil,
        methode='corrélation normalisée de la couverture et de la densité, 48 px, meilleure de 24 rotations et du miroir',
        groupes=[dict(id=k + 1, score=round(float(score(g)), 3), bulles=[dict(n=bulles[i]['n'], planche=bulles[i]['planche'], nom=bulles[i]['nom']) for i in sorted(g, key=lambda i: bulles[i]['n'])]) for k, g in enumerate(groupes)],
    )
    (RACINE / 'design' / 'doublons-bulles.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    dans = sum(len(g) for g in groupes)
    print(len(groupes), 'groupes,', dans, 'bulles concernées ; tailles :', sorted((len(g) for g in groupes), reverse=True)[:12])
    # la planche de contrôle : un groupe par ligne, en gris sur papier
    cote, marge = 96, 8
    f = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 14)
    lignes = groupes[:40]
    larg = max(len(g) for g in lignes) if lignes else 1
    im = Image.new('RGB', (40 + larg * (cote + marge) + 60, 30 + len(lignes) * (cote + marge + 16)), (236, 233, 226))
    d = ImageDraw.Draw(im)
    for r, g in enumerate(lignes):
        y = 20 + r * (cote + marge + 16)
        d.text((8, y + cote // 2 - 8), f'{score(g):.2f}', fill=(120, 116, 122), font=f)
        for c, i in enumerate(g):
            b = Image.open(bulles[i]['chemin']).convert('RGBA').resize((cote, cote), Image.LANCZOS)
            arr = np.asarray(b).astype(float)
            gris = 1 - 0.28 * (arr[..., 3:4] / 255) * (1 - arr[..., :3] / 255)
            col = (np.array([80, 100, 160]) / 255 * gris * 255).astype(np.uint8)
            bulle = Image.fromarray(np.dstack([col, arr[..., 3].astype(np.uint8)]), 'RGBA')
            x = 50 + c * (cote + marge)
            im.paste(bulle, (x, y), bulle)
            d.text((x, y + cote), str(bulles[i]['n']), fill=(120, 116, 122), font=f)
    SORTIE.mkdir(parents=True, exist_ok=True)
    im.save(SORTIE / 'doublons.png')
    print('planche', SORTIE / 'doublons.png', im.size)


if __name__ == '__main__':
    main()
