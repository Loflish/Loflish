# Planche 5 : les filaments de lumière

**Direction de Tom (4 novembre 2026).** « Une nouvelle direction menée de filaments et comme Beksiński, mais avec le côté joyeux, vif, constellation, et GRIS. » Les filaments fumés de la planche 4 lui plaisent ; ce qui manquait, c'est la couleur vive et joyeuse qui s'accorde à la constellation. Deux causes trouvées le même jour : la matière gothique est transparente (masses allégées à 0,38, le papier passe à travers) et son fond est une nuit d'encre. Réponse : le papier est la lumière, les fils gardent le drame.

**La recette.** `planche-5-lumiere.json` (gabarit, 18 fils, 8 fonds, 6 mouvements, 100 bulles et leurs prompts). Google Flow n'étant pas joignable (compte non connecté), les bulles sont peintes par code dans `hd/lumiere.py` : un lavis clair mouillé dans mouillé (les lignes de marée naissent du gradient d'un bruit), des filaments tirés dans un champ tourbillonnant (rotationnel d'un bruit, normalisé), la main qui varie largeur et pression, le tout en 4 096 px réduits à 2 048, matière en 1 024. Rendu dans le site : couverture renforcée (3 couches) et encre à 1,5 (rang F de la planche `reports/Bulles 2026-11-04/planche-4-couverture.png`).

## Ce qui vient de GRIS (sources lues le 4 novembre)

| Fait | Source |
|---|---|
| Cinq chapitres, une couleur par étape du deuil : gris (déni), rouge (colère, désert aux moulins et rafales), vert (marchandage, forêt), bleu (dépression, cavernes sous l'eau, cristaux de glace), jaune (acceptation, bâtiments de lumière, oiseaux d'or, lucioles) | [GRIS Wiki, chapitres 1 à 5](https://gris.fandom.com/wiki/Chapter_1) |
| Les étoiles collectées forment des ponts de constellations ; le monde retrouve sa couleur statue après statue ; une créature d'encre noire ; un océan de boue noire d'où monte une tour ; le chant qui fait revivre | [Wikipedia](https://en.wikipedia.org/wiki/Gris_(video_game)) |
| Les couleurs racontent un parcours psychologique, de l'oppression à la force, conçu avec un psychothérapeute (Héctor Fuster) ; références : Journey et Ori | [GamesIndustry.biz, 15 janvier 2019](https://www.gamesindustry.biz/the-beauty-and-meaning-of-gris) |
| « The most important thing in the game are the colours » ; on commence en noir et blanc ; chaque image dessinée à la main en numérique, puis colorée | [Gamereactor, 4 décembre 2018](https://www.gamereactor.eu/news/715353/What+does+GRIS+mean+We+talk+to+Nomada+Studio/) |
| Premières zones composées comme des aquariums Iwagumi (peu d'éléments, une masse, du vide) | Wikipedia, section Development |

Non trouvé : la technique personnelle de Conrad Roset (son site parle de « different techniques » sans les nommer). The Verge et Polygon sont payants ou refusés.

Ce que ça devient ici, en cinq familles de 20 bulles : *Poussière de lumière* (étoiles reliées, poussière, lucioles), *L'encre dans l'eau* (le chapitre bleu, sans la noirceur), *Le vent* (le chapitre rouge : rafales, moulins, rubans de sable), *Les fragments* (le monde qui se défait : cubes, escaliers, fissures de lumière), *Ce qui s'ouvre* (voûtes claires, éventails, le chant en ondes, le retour de la couleur).

## Ce qui reste de Beksiński

La manière, jamais un tableau (voir `planche-4-gothique.md`) : tout est tissé de lignes, les bords se perdent, une seule présence, le silence. Ce qui s'en va : la masse noire, la lueur unique dans la nuit. Le drame passe dans les fils, la joie dans le papier.

## Réglages

- Fils : `FILS` dans `hd/lumiere.py` (nombre, longueur, largeur, force, flou de fumée, tremblement, courbure).
- Fonds : `lavis()` ; disque irrégulier `disque()` ; marée inégale, absente par endroits (pas de bord noir, pas de bille).
- Matière : `ENCRE = 0,1`, `VOILE = 0,36`, format des encres (`MATIERE_ENCRE`), 82 % de la vignette.
