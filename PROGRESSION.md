# Nos Mots Mémoriaux : état sauvegardé

## Point de reprise — 11 novembre 2026

Refonte visuelle « Le linge écrit » sur la branche `claude/vibrant-galileo-h4yjfn` : interface de la
constellation et toutes les pages intérieures, téléphone d'abord. Aucune fonctionnalité ni aucun texte
modifié ; le moteur (feutre, eau, bulles) est inchangé. Charte, sources et vérifications :
[design/linge-ecrit/CHARTE.md](design/linge-ecrit/CHARTE.md).
La version du 30 octobre reste intacte sur `refonte-octobre`.
Prochaine étape : Tom regarde la refonte sur son téléphone et dit ce qu'il garde.

## Point de reprise — 11 novembre 2026, après-midi

- La version du PC et le linge écrit sont **fusionnés** sur `claude/vibrant-galileo-h4yjfn` (voir
  `design/linge-ecrit/CHARTE.md`, « Fusion… »). `npm run controles` couvre le site fusionné.
- Essais derrière un drapeau d'adresse : `?fils=1` / `?fils=2` (filaments), `?tissu=aura-37` (tissu des pages).
- À trancher par Tom : garder ou non les filaments par défaut ; « Se perdre » avec ou sans panneau ;
  les 20 points juridiques (voir le rapport remis le 11 novembre).

## Point de reprise — 5 novembre 2026

Catalogue des bulles choisi par Tom : 183 bulles aimées des planches 2 et 3, sans doublons (palette M). Drap coloré
derrière les pages validé. Audit « tics de l'IA et droit » (`reports/Audit tics et droit 2026-11-05.md`) : trois manques
nets traités ce jour (écran « Après moi » art. 85, mentions légales structurées à compléter, registre des traitements
provisoire) ; restent les points partiels (droits au dépôt des médias, motivation des retraits, opposition des proches,
IP à la création, vidéos tierces, cadre des dons) et les huit points à confirmer par un avocat.

## Point de reprise — 4 novembre 2026

Chantier des bulles : Tom a trié (290 gardées sur 300), puis voulu une nouvelle direction « filaments comme Beksiński, mais
joyeux, vifs, constellation, GRIS ». La planche 5 « filaments de lumière » est peinte par code (`design/hd/lumiere.py`,
Flow refusant la connexion) et, après la grande comparaison (`reports/Bulles 2026-11-04/`), Tom l'a choisie : c'est le
catalogue du site (`CATALOGUE` dans `src/lib/hd.ts`, `?bulles=anciennes` pour l'ancien). Points 126 à 129 de
`AMELIORATIONS-2026-11-03.md`. Reste : relecture de Tom, fusion, mise en ligne avec son accord.

## Point de reprise — 3 novembre 2026

Sur la branche `ameliorations-fable-2026-11-03` (partie de `refonte-octobre`, 00ac316) : 100 améliorations
d'outillage, de chargement, d'accessibilité, d'impression, de partage et de robustesse, sans toucher à la direction
artistique ni à l'atelier des bulles. Liste point par point et façon de vérifier chacune :
[AMELIORATIONS-2026-11-03.md](AMELIORATIONS-2026-11-03.md). `npm run verifier` est vert (24 tests du site,
32 tests du serveur). Rien n'est poussé sur GitHub : Tom relit d'abord, corrige s'il veut, puis décide.
Prochaine étape : reprendre le chantier des bulles (planche 4, tri dans `/#/atelier/tri`, catalogue de Créer).

Même jour, second commit « Design Fable » : mesures d'abord (Lighthouse, axe-core, images par seconde, traces), cahier des
charges v1.1 confronté au site, puis retouches : spécification de mouvement (120 / 420 ms), quatre réponses en deux colonnes
de lecture avec l'essentiel en épigraphe, fil cousu au survol et sous les titres de salle, boutons de papier, mode Lecture,
loader-bulle, filtre par année, shaders compilés en parallèle (2,5 s de blocage en moins), taches chargées seulement dans la
constellation, six matières en WebP sans perte. Rapport et planches avant/après :
`Desktop/Claude Code/reports/Design Fable 2026-11-03.md`. `?fable=0` rend le site d'avant ; `?toucher=1` essaie les
collisions et le curseur (cahier §54).

## Point de reprise — 3 novembre 2026

Branche `ameliorations-fable-2026-11-03` (partie de `refonte-octobre`), non poussée, à relire par Tom : trois commits,
« 100 améliorations » (`AMELIORATIONS-2026-11-03.md`, points 1 à 100), « Design Fable » (101 à 120, mesuré : rapport
`reports/Design Fable 2026-11-03.md` hors dépôt) et « Atelier 8K » (121 à 125 : peinture 5 120 px, bulles peintes dans un
travailleur, matières 1 024 px pour les grandes bulles, nappes des Nabis derrière les pages). Chaque lot est retirable
par adresse (`?fable=0`, `?travailleur=0`, `?nappes=0`). Reste ensuite : relecture de Tom, fusion dans `refonte-octobre`
avec son accord, puis le chantier des bulles (planche 4, tri `/#/atelier/tri`, catalogue de Créer).

## Point de reprise — 30 octobre 2026

La version préférée de Tom (fond feutre, eau, entrée) est devenue la version par défaut du site.
Audit complet fait et corrigé : tests du serveur exécutables sur Windows (28 réussis), parcours en ligne
essayé de bout en bout sur une base locale, site publié réduit de 96 à 17 Mo. L'abonnement Higgsfield est
terminé : les images et vidéos se génèrent maintenant avec fal, payé à l'usage.
Prochaine étape : Tom finit la coupe des bulles (`/#/atelier/coupe`), puis les 48 bulles C restantes.

## Point de reprise — 27 octobre 2026

Toutes les décisions et l'avancement d'octobre (fond feutre, eau, accroche, bulles A/B/C,
coupe des bulles en duels, crédits Higgsfield) sont dans
[la mémoire de Claude copiée le 27 octobre](design/suivi/2026-10-27/memoire-claude.md).
La direction artistique est le skill `.claude/skills/nmm-direction-artistique`.
Prochaine étape : Tom finit la coupe des bulles (`/#/atelier/coupe`), puis les 48 bulles C
restantes après le renouvellement des crédits du 29 octobre.

## Dernière sauvegarde de progression — 19 octobre 2026

Les comparateurs visuels, leurs sources, neuf captures et les documents de l'étude
sont conservés dans [le dossier de progression du 19 octobre](design/suivi/2026-10-19/README.md).
Ce dossier contient le point de reprise, les choix artistiques, les étapes restantes,
des outils de reconstruction et les empreintes des fichiers copiés.

**Dernier choix : fond à 90 %, mouvements plus rapides et plus amples des taches,
avec davantage de mouvement global. Cette variante reste à réaliser.** Le prototype
archivé démarre encore à 100 %, avec une boucle locale de 72 secondes et un cadre fixe.
Les matières préférées sont 00, 81 et 95. Aucun crédit Higgsfield n'a été consommé
dans cette étude et aucun changement artistique n'a été intégré au site.

L'audit complet et la préparation de la démonstration pour la famille et les amis
restent à poursuivre. Le [point de reprise actuel](design/suivi/2026-10-19/README.md)
prime sur les anciennes orientations ; les historiques restent conservés.

## État historique du site au 8 octobre 2026

La section qui suit décrit la sauvegarde précédente.

Le dépôt contient le code du site, le code du serveur, les ressources visuelles
et les documents factuels de suivi. Les conversations privées, les identifiants,
les données du navigateur et les données d'un service en production ne sont pas
inclus. Le travail artistique est arrêté à cette date.

## Matières intégrées

Les six créations suivantes ont été validées, ainsi que leurs correspondances
de remplacement. Elles sont présentes dans le catalogue du site.

| Numéro | Matière | Validation enregistrée |
| --- | --- | --- |
| 70 | Voile superposé | Création et remplacement validés le 5 octobre |
| 81 | Pastel frotté | Création et remplacement validés le 5 octobre |
| 85 | Papier gaufré | Création et remplacement validés le 5 octobre |
| 15 | Fibres libres | Création et remplacement validés le 8 octobre |
| 50 | Encre capillaire | Création et remplacement validés le 8 octobre |
| 95 | Coton froissé | Création et remplacement validés le 8 octobre |

Les six fichiers utilisés sont des PNG transparents de 512 × 512 pixels, dans
`public/hd/taches/`. Le moteur les charge dans un canvas. Les anciens WebP sont
conservés. Le catalogue comporte 100 textures et la matière procédurale 0,
soit 101 choix. La palette GRIS et le fil brodé du site sont présents.

## Essais conservés, sans intégration

| Numéro envisagé dans le comparatif | Essai | Avis enregistré | État dans le site |
| --- | --- | --- | --- |
| 01 | Réserves diffuses | Garder sous condition de distinction avec les autres matières | Non intégré |
| 19 | Feutre nuagé | Garder sous condition de distinction avec les autres matières | Non intégré |
| 76 | Pigment sédimenté | Garder sous condition de distinction avec les autres matières | Non intégré |

Les correspondances de ce dernier lot n'ont pas été validées. La comparaison
complète de singularité n'a pas été achevée. Les trois images originales sont
conservées, avec celles des deux lots précédents : neuf originaux de
2048 × 2048 pixels au total.

## Avis et documents enregistrés

Les 101 avis initiaux sont conservés. Le bilan du catalogue actuel, après les six
remplacements validés, est de 60 matières à garder, 30 à affiner et 11 qui plaisent
moins. Les essais non intégrés ne changent pas ces comptes.

- [État et fichiers structurés](design/suivi/2026-10-08/etat.json).
- [Les 101 avis initiaux](design/suivi/2026-10-08/avis-initiaux.json).
- [Bilan du catalogue](design/suivi/2026-10-08/Bilan_matieres_2026-10-08.html).
- [Avant/après du lot 02](design/suivi/2026-10-08/Remplacements_matieres_lot_02.html).
- [Avant/après du lot 03](design/suivi/2026-10-08/Remplacements_matieres_lot_03.html).
- [Comparatif des essais du lot 04](design/suivi/2026-10-08/Resultats_matieres_lot_04.html).
- [Constats de l'audit initial](design/suivi/2026-10-08/CONSTATS_AUDIT_2026-10-02.md).
- [Inventaire des fichiers de suivi](design/suivi/2026-10-08/inventaire.json).
- [Vérifications enregistrées](design/suivi/2026-10-08/verification.json).

Les planches de comparaison sont des documents distincts du site. Leurs contrôles
de couleur et de zoom affectent uniquement l'affichage de ces planches.

## Vérifications et limites enregistrées

| Contrôle | Résultat |
| --- | --- |
| Types de l'interface | Réussi |
| Construction de l'interface autonome | Réussie |
| Construction de l'interface en mode en ligne | Réussie |
| Types du serveur | Réussi |
| Tests d'intégration du serveur | Non exécutés : initialisation PostgreSQL Linux absente sur cet ordinateur Windows |
| Téléphone réel, connexion, e-mails et restauration de données en production | Non validés de bout en bout |

Les animations d'entrée, de sélection et de respiration appliquent encore des
variations individuelles de taille. Le zoom commun des comparatifs ne modifie
pas ces animations.

Les constats de l'audit initial portent sur la version du 2 octobre. Ils ne
constituent pas une liste de corrections effectuées. La sauvegarde du dépôt
n'est pas un déploiement du service.
