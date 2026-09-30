"""
Transforme la vidéo Higgsfield « tache qui imprègne le tissu » en masque d'encre :
le tissu (immobile) est soustrait, il ne reste que la tache qui grandit, avec un
bord légèrement plus chargé. Sortie : public/hd/encre.mp4 (blanc = encre).

Usage : python3 masque_encre.py video_source.mp4
(dépendances : numpy, scipy, imageio-ffmpeg)
"""
import sys
import subprocess
from pathlib import Path
import numpy as np
import imageio_ffmpeg
from scipy import ndimage as ndi

FF = imageio_ffmpeg.get_ffmpeg_exe()
W = 720
OUT = Path(__file__).resolve().parents[2] / 'public' / 'hd' / 'encre.mp4'
p = subprocess.run([FF, '-loglevel', 'error', '-i', sys.argv[1], '-vf', f'scale={W}:{W}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                   capture_output=True, check=True)
fr = np.frombuffer(p.stdout, np.uint8).reshape(-1, W, W).astype(float) / 255
bg = ndi.gaussian_filter(np.median(fr[:3], axis=0), 1.2)
y, x = np.mgrid[0:W, 0:W]
cy, cx = np.unravel_index(np.argmin(ndi.gaussian_filter(fr[0], 4)), fr[0].shape)
rr = np.hypot(x - cx, y - cy)
ring = bg[(rr > 45) & (rr < 70)].mean()  # le tissu sous la goutte de départ
bg = np.where(rr < 45, ring, bg)
bg = np.where((rr >= 45) & (rr < 60), bg * ((rr - 45) / 15) + ring * (1 - (rr - 45) / 15), bg)
# lissage fort : la trame du tissu disparaît (agrandie en plein écran, elle devenait un motif) ;
# le grain de pigment est recréé finement par le shader, à la taille de l'écran
diffs = [ndi.gaussian_filter(np.clip(bg - ndi.gaussian_filter(f, 1.2), 0, 1), 7) for f in fr]
hi = np.percentile(diffs[-1], 99.5)
out = []
for i, d in enumerate(diffs):
    m = np.clip((d - 0.012) / (hi - 0.012), 0, 1)
    edge = np.clip(ndi.gaussian_gradient_magnitude(m, 4) * 9, 0, 1)
    m = np.clip(m * 0.85 + edge * 0.35, 0, 1)
    # l'intérieur de la tache reste chargé de pigment (pas de reflet ni de trou)
    inside = ndi.binary_fill_holes(m > 0.25)
    m = np.where(inside, np.maximum(m, ndi.gaussian_filter(inside.astype(float), 6) * 0.62), m)
    if i < 8:
        m = np.maximum(m, np.clip(1 - rr / (8 + i * 3), 0, 1) ** 0.5 * 0.9)
    out.append((m * 255).astype(np.uint8))
subprocess.run([FF, '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', f'{W}x{W}', '-r', '24', '-i', '-',
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow', '-movflags', '+faststart', '-an', str(OUT)],
               input=np.stack(out).tobytes(), check=True)
print('écrit', OUT)
