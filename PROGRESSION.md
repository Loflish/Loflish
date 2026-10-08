# Nos Mots Mémoriaux : état sauvegardé

État du site et de sa progression au 8 octobre 2026.

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
