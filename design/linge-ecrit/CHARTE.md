# Le linge écrit : charte visuelle de Nos Mots Mémoriaux

Refonte du 11 novembre 2026. Le moteur de la constellation (fond en feutre, eau, bulles) n'a pas changé :
cette charte décrit l'interface posée dessus et toutes les pages intérieures.

## L'idée

Tout le site est une seule pièce de mousseline écrue sur laquelle on a écrit au fil.
Les cinq références de Tom disent la même chose : une surface plane où le texte est l'ornement.

| Couche | Ce que c'est | D'où ça vient |
| --- | --- | --- |
| La toile | Écru passé au thé, jamais blanc. Les encadrés sont des morceaux de tissu au bord effiloché. | Ruth Rae : mousseline non blanchie, bain de thé, couches superposées ([blog, 2010](https://ruthrae.blogspot.com/2010/07/sewing-mends-soul-story-dress.html)) |
| Le fil | Un seul fil, le bordeaux du logo. Il coud les séparations, les cadres, les soulignés, au point avant. | Le vêtement de référence de Tom ; les marquoirs au fil rouge ([V&A](https://www.vam.ac.uk/articles/embroidery-a-history-of-needlework-samplers)) |
| La peinture | Un lavis d'aquarelle dans la couleur GRIS de la personne, dans le coin de la page. | GRIS (le monde retrouve sa couleur) ; Monet (une même lumière sur tout, pas d'horizon) |
| La mise en page | Panneaux verticaux, aplats mats, compositions décentrées, aucune ombre grise. | Les Nabis ([Orsay, Vuillard](https://www.musee-orsay.fr/fr/oeuvres/jardins-publics-la-conversation-les-nourrices-lombrelle-rouge-8015)) |

## Les règles

1. **Le fil décore, l'encre se lit.** Le bordeaux (`--fil-rouge`, #64303d) sert aux coutures, aux chiffres
   d'ornement et aux états actifs. Le texte reste à l'encre (`--encre`).
2. **Aucun filet gris, aucune ombre grise.** Une séparation est une couture (`--couture`). Un encadré est un
   morceau de tissu. Les seuls filets fins qui restent séparent les lignes d'une liste.
3. **Une couleur par page.** Chaque page porte `--bulle` : la couleur de la personne sur un profil, une teinte
   GRIS fixe ailleurs (`src/styles/pages.css`, en tête). Le lavis et les états choisis en découlent.
4. **Une seule police, Newsreader.** Titres très grands et légers (taille optique 72). Les mots des personnes
   en italique. Les étiquettes en petites capitales espacées (cartel), comme les lettres d'un marquoir.
5. **Les pages arrivent posées, sans fondu** (choix de Tom). Seuls les ornements prennent vie : le lavis
   s'étale, les coutures se cousent quand elles entrent dans l'écran. Si le système demande moins de
   mouvement, tout est simplement là.
6. **Téléphone d'abord.** Navigation au pouce (ruban cousu en bas), cibles de 44 px, panneaux en feuille
   qui montent du bas. Les largeurs supérieures ajoutent des colonnes, jamais l'inverse.
7. **Rien n'est tout à fait droit.** Les points ont des longueurs inégales, les morceaux de tissu penchent
   d'un demi-degré. Seul le tissu penche : le texte reste droit et net.

## Où ça vit dans le code

| Élément | Fichier |
| --- | --- |
| Couleurs, typographie, mouvement | `src/styles/tokens.css` |
| Points avant, cadre cousu, bord effiloché, cœur brodé, fils pendants | `design/linge-ecrit/coutures.cjs` → `src/styles/coutures.css` (généré) |
| Liens, boutons, pastilles, champs, morceau de tissu | `src/styles/base.css` |
| Interface de la constellation, ruban, menu, recherche, Se perdre | `src/styles/museum.css` |
| Profil et salles | `src/styles/trace.css` |
| Création, compte, pages de texte, œuvre commune, fondateur, ateliers | `src/styles/pages.css` |
| Coutures qui se cousent à l'écran | `src/lib/couture.ts` (la liste des parties est la même qu'à la fin de `pages.css`) |
| Trame de la mousseline et tache du lavis | `src/lib/hd.ts` (`--lin-tissu`, `--tache-lavis`) |

Pour changer la couleur ou la longueur des points : modifier `coutures.cjs`, puis `node design/linge-ecrit/coutures.cjs`.

## Vérifications du 11 novembre 2026

Mêmes contrôles sur la version du 30 octobre (`refonte-octobre`) et sur celle-ci.

| Contrôle | Avant | Après |
| --- | --- | --- |
| Parcours de 32 gestes (Playwright), 390 px et 1440 px | 32 / 32 | 32 / 32 |
| Textes, liens, contrôles, titres identiques, 12 pages × 2 largeurs | référence | 24 / 24 |
| axe-core (WCAG 2 A et AA), 12 pages × 4 largeurs | 0 violation | 0 violation |
| Contenu qui dépasse de l'écran | 2 pages à 320 px | aucune |
| Cibles tactiles de moins de 24 px | 108 | 12 (adresses e-mail dans le texte) |
| Lighthouse téléphone, accessibilité | 100 | 100 |
| Lighthouse téléphone, performance | 35 à 66 | 35 à 66 |

Une relecture indépendante du code a relevé douze points ; tous sont corrigés. Cinq étaient des défauts de la
version précédente, rejoués sur les deux versions par `controles/correctifs.cjs` :

| Défaut (présent le 30 octobre) | Maintenant |
| --- | --- |
| Se perdre, petit écran (375 × 553) : « Ouvrir la trace » passait sous les boutons | toujours visible, le texte défile dans le panneau |
| Se perdre : la carte ne suivait pas le doigt pendant le glisser | elle suit, sans retard |
| Téléphone : un aperçu ouvert couvrait 4 des 6 liens du menu | les 6 liens se touchent |
| Très grand écran (1920 px) : le voile d'une salle ne couvrait que 1280 px | il couvre tout l'écran |
| Archives à 320 px : la ligne de l'édition passait sous les boutons | elle s'arrête avant |

Les scripts sont dans `design/linge-ecrit/controles/` (Playwright et axe-core ; ancienne version servie sur le
port 5175 ou 4175, nouvelle sur le 5174) : `parcours.cjs` (32 gestes), `textes.cjs` (parité des contenus),
`mesurer.cjs` (accessibilité, débordements, cibles), `correctifs.cjs` (les défauts ci-dessus).

Non vérifié : le rendu sur un vrai téléphone, sur Safari et sur Firefox (les contrôles tournent dans Chromium).
La performance mesurée est celle d'un navigateur sans carte graphique : à refaire sur un téléphone réel.

## Retour en arrière

La version précédente est intacte sur la branche `refonte-octobre` et sous l'étiquette `version-preferee-2026-10-27`.
