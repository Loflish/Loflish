"""
Transforme la vidéo Higgsfield « goutte d'aquarelle qui s'ouvre sur le papier »
(Kling 4K) en masque d'encre : le papier (immobile) est soustrait, il ne reste
que la tache qui grandit, avec un bord légèrement plus chargé.
Sortie : public/hd/encre.mp4 et encre.webm (blanc = encre).

Usage : python3 masque_encre.py video_source.mp4 [début_en_s] [taille_px] [cadre]
  début : on coupe le papier vide avant la chute de la goutte (défaut 0.6)
  taille : côté du masque (défaut 1440)
  cadre : part centrale de l'image gardée (défaut 0.62)
(dépendances : numpy, scipy, imageio-ffmpeg)
"""
import sys
import subprocess
from pathlib import Path
import numpy as np
import imageio_ffmpeg
from scipy import ndimage as ndi

FF = imageio_ffmpeg.get_ffmpeg_exe()
SRC = sys.argv[1]
DEBUT = float(sys.argv[2]) if len(sys.argv) > 2 else 0.6
W = int(sys.argv[3]) if len(sys.argv) > 3 else 1440
K = W / 720  # les réglages d'origine étaient pensés pour 720 px
OUT = Path(__file__).resolve().parents[2] / 'public' / 'hd'


CADRE = float(sys.argv[4]) if len(sys.argv) > 4 else 0.62  # la tache finale ne remplit qu'une partie de l'image filmée


def lire(avant=(), apres=()):
    vf = f'crop=iw*{CADRE}:ih*{CADRE},scale={W}:{W}'  # recadrage à pleine résolution : la tache remplit le masque
    p = subprocess.run([FF, '-loglevel', 'error', *avant, '-i', SRC, *apres, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                       capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.uint8).reshape(-1, W, W)


papier = ndi.gaussian_filter(lire(apres=('-frames:v', '1'))[0].astype(np.float32) / 255, 1.5 * K)
frames = lire(avant=('-ss', str(DEBUT)))


def difference(f):
    # papier lisse : un lissage léger suffit, les bords capillaires restent nets
    d = np.clip(papier - ndi.gaussian_filter(f.astype(np.float32) / 255, 0.8 * K), 0, 1)
    return ndi.gaussian_filter(d, 1.2 * K)


fin = difference(frames[-1])
hi = float(np.percentile(fin, 99.5))
cy, cx = ndi.center_of_mass(fin > hi * 0.3)
y, x = np.mgrid[0:W, 0:W]
rr = np.hypot(x - cx, y - cy).astype(np.float32)

enc = subprocess.Popen([FF, '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', f'{W}x{W}', '-r', '24', '-i', '-',
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', '-an',
                        str(OUT / 'encre.mp4')], stdin=subprocess.PIPE)
for i, f in enumerate(frames):
    m0 = np.clip((difference(f) - 0.01) / (hi - 0.01), 0, 1)
    # l'intérieur de la tache est un lavis égal : ni reflets ni ondes de la goutte d'eau filmée ;
    # le bord garde tout le détail capillaire, avec un liseré plus chargé comme une aquarelle qui sèche
    inside = ndi.gaussian_filter(ndi.binary_fill_holes(m0 > 0.2).astype(np.float32), 2.5 * K)
    interieur = np.maximum(ndi.gaussian_filter(m0, 10 * K), 0.7) * inside
    m = np.maximum(m0 * (1 - inside), interieur)
    m = np.clip(m + np.clip(ndi.gaussian_gradient_magnitude(inside, 2 * K) * 9 * K, 0, 1) * 0.3, 0, 1)
    if i < 6:  # la goutte elle-même, le temps qu'elle touche le papier
        m = np.maximum(m, np.clip(1 - rr / ((8 + i * 3) * K), 0, 1) ** 0.5 * 0.9)
    # la tache est recentrée : elle doit s'ouvrir exactement depuis la bulle cliquée
    m = ndi.shift(m, (W / 2 - cy, W / 2 - cx), order=1, mode='constant')
    enc.stdin.write((m * 255).astype(np.uint8).tobytes())
enc.stdin.close()
enc.wait()
subprocess.run([FF, '-loglevel', 'error', '-y', '-i', str(OUT / 'encre.mp4'), '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34',
                '-row-mt', '1', '-an', str(OUT / 'encre.webm')], check=True)
print('écrit', OUT / 'encre.mp4', OUT / 'encre.webm', f'centre=({cx:.0f},{cy:.0f})')
