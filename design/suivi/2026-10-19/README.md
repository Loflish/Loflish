# Sauvegarde de l'étude du musée — 19 octobre 2026

Cette sauvegarde conserve les fichiers disponibles et les décisions de l'étude menée à partir du commit `33956a0b7f6a065b5179373d2f4f16d90a44ffdb`, sur la branche `claude/practical-newton-r1t0oq`. Elle complète le suivi du 8 octobre sans le remplacer. Le code du site et du serveur n'a pas été modifié pendant cette étude.

## Point de reprise prioritaire

**Dernier choix du créateur : fond à 90 %, mouvements plus rapides, taches plus animées et davantage de mouvement du fond entier.** Cela remplace la validation provisoire précédente de 100 % avec pigments seuls.

La dernière demande n'a pas encore été appliquée aux fichiers. Le créateur a ensuite demandé de sauvegarder la progression. L'interface permet déjà de sélectionner 90 %, mais le fichier conservé démarre à **100 %, boucle locale de 72 secondes et cadre immobile**. Ne pas confondre une sélection temporaire dans le navigateur avec un réglage enregistré dans le fichier.

La réponse annonçait un essai plus rapide et plus ample avec une légère dérive et des réglages séparés. C'est une proposition à réaliser, pas un résultat livré. Aucun chiffre de vitesse ou d'amplitude n'a été approuvé par le créateur. La prochaine étape de création consiste à préparer cette variante réversible, puis à l'évaluer avant une intégration dans la constellation.

## Décisions et contraintes conservées

- Site : musée virtuel de profils de dernières volontés et de paroles à explorer, avec participation envisagée ensuite.
- Premier lancement : démonstration pour la famille et les amis ; les contributions réelles et persistantes ne sont pas requises pour ce premier jalon.
- Garder la direction artistique actuelle : couleurs de GRIS, Monet, les Nabis, travail de Ruth Rae. Priorités : constellation, matières des bulles et couleurs.
- Matières préférées explicitement : **00, 81 et 95**. Les autres plaisent moins, sans demande de suppression. Les surnoms « touches peintes » et « plis » employés dans cette étude décrivent les matières 81 et 95 ; ils ne renomment pas les fichiers du catalogue.
- Progression du fond : référence 70 % ; demande de 80–85 % avec pigments et dérive ; comparaison 90/95/100 ; préférence provisoire 100 % et pigments seuls ; demande de mouvement dans davantage de taches et d'une boucle lente ; puis choix actuel 90 % et mouvement accru.
- Les quantités 70–100 % désignent l'opacité, pas la saturation.
- Travailler dans cette conversation ; ne pas consulter d'autres conversations. Les anciens fichiers déjà présents dans le dépôt restent des documents historiques distincts.
- Processus accepté : ressources → cadrage → état initial → essais visuels → audit complet → corrections et vérifications → lancement.
- Domaine, hébergement et budget d'exploitation restent ouverts. Les règles métier détaillées consignées dans la feuille de route sont des éléments du cadrage, pas des fonctions certifiées par cette étude.

## Livrables conservés

| Fichiers | Contenu et état |
|---|---|
| [Comparateur des matières](outputs/Comparateur_des_matieres.html) | 101 matières, palette existante et trois tailles. Les marques dans l'interface sont temporaires ; la préférence 00/81/95 est conservée dans ce document. |
| [Essai du fond et des matières 00/81/95](outputs/Essai_lisibilite_00_81_95.html) | Intensités 70/80/85/90/95/100 ; vidéo existante et variantes de mouvement ; nouvelle boucle locale de 72 s réglable de 48 à 120 s ; affichage optionnel des bulles. |
| [Feuille de route](outputs/Feuille_de_route_du_musee.md) | Sources, ressources présélectionnées, cadrage, étapes, inconnues et historique des points de reprise. |
| [État initial](outputs/Etat_initial_du_musee.md) | Référence du dépôt, vérifications initiales et inventaire visuel limité. |
| [Diagnostic visuel](outputs/Diagnostic_visuel_et_prochains_essais.md) | Matières, évolutions des essais et premiers problèmes d'affichage. |
| [Fond, mouvements et Higgsfield](outputs/Fond_mouvements_et_budget_Higgsfield.md) | Raison des essais, coûts historiques, briefs non envoyés et limites. |
| Neuf captures JPG dans `outputs/` | Références ordinateur/mobile et étapes des comparateurs. Les captures ne prouvent pas la qualité d'une animation. |
| Huit fichiers dans `sources-originales/` | Copies exactes des sources et fragments disponibles avant cette sauvegarde. |
| Six fichiers dans `outils/` | Sources adaptées aux chemins du dépôt pour reconstruire les deux comparateurs et outil de vérification d'intégrité. Aucune modification artistique. |

Les documents copiés sont historiques et peuvent contenir des recommandations dépassées. **Le présent point de reprise prime sur leurs anciennes orientations.** Leur contenu a été conservé tel quel pour maintenir la trace des étapes.

## Affichage et limites du prototype

Un fond invisible a été signalé plusieurs fois. Un premier correctif d'empilement n'a pas suffi. La version sauvegardée garde une image fixe de secours et dessine la vidéo dans une surface 2D. La nouvelle boucle utilise une autre surface WebGL à partir de l'image fixe d'origine.

La boucle locale déplace légèrement les masses de couleur selon un champ périodique, avec des phases différentes selon les régions, puis réapplique les détails fins à leur emplacement initial. Elle ne suit pas chaque tache individuellement et ne simule pas physiquement l'aquarelle. Son caractère naturel reste à juger. La vidéo originale de référence dure environ 14,54 secondes ; son attribut de répétition ne garantit pas un raccord imperceptible.

Cette planche n'est pas la constellation complète : atmosphère, fibres supplémentaires, masque autour du logo et déplacement des bulles ne sont pas reproduits. La lisibilité, les performances sur appareils réels et la cohérence finale doivent encore être vérifiées dans le musée.

## Higgsfield : historique, sans autorisation de dépense

Aucune génération, aucun achat et aucun crédit consommé dans cette étude. Le compte a été consulté précédemment ; les chiffres consignés dans le document de budget datent du **9 octobre**, ils ne constituent pas une vérification au 19 octobre. Le solde, les avantages, les tarifs et l'échéance devront être actualisés avant utilisation.

Un premier lot d'environ 20 crédits avait été proposé, sans accord de dépense. Il n'a pas été lancé. L'annonce « de nouveau du crédit » concernait le quota ChatGPT/Codex. Les briefs d'animation restent des propositions. Aucun identifiant, mot de passe, code de connexion, cookie ou donnée de paiement n'est inclus.

## Reprendre et reconstruire

Les HTML conservés dans `outputs/` embarquent leurs ressources et peuvent être ouverts directement dans un navigateur. Un serveur local peut aussi être lancé depuis la racine du dépôt, après installation des dépendances :

```sh
npm ci
npm exec -- vite design/suivi/2026-10-19/outputs --host 127.0.0.1 --port 4318
```

Puis ouvrir `http://127.0.0.1:4318/Essai_lisibilite_00_81_95.html` ou `http://127.0.0.1:4318/Comparateur_des_matieres.html`. Ce sont des adresses locales, pas des liens publics pour les proches.

Reconstruction des comparateurs depuis la racine du dépôt :

```sh
node design/suivi/2026-10-19/outils/construire-atelier.cjs
node design/suivi/2026-10-19/outils/construire-essai.cjs
```

Les fichiers produits vont dans `reconstruits/`, sans écraser les exemplaires archivés dans `outputs/`. Les outils utilisent le moteur et les médias du dépôt ; pour retrouver exactement cet état, employer le commit de cette sauvegarde. Les trois fragments TXT dans `sources-originales/` sont anciens et conservés pour traçabilité : ils ne sont pas la source actuelle de construction.

## Couverture et vérification de la sauvegarde

[copies-verifiees.json](copies-verifiees.json) inventorie les **23 fichiers originaux** copiés avec taille et empreinte SHA-256. [inventaire.json](inventaire.json) recense les fichiers du dossier de sauvegarde, hors lui-même. [verification.json](verification.json) contient les contrôles de copie et de reconstruction.

Les deux comparateurs reconstruits ont les mêmes empreintes que les exemplaires archivés : ils sont identiques octet pour octet. La vérification des fichiers peut être relancée depuis la racine du dépôt, sans dépendance externe :

```sh
node design/suivi/2026-10-19/outils/verifier-integrite.cjs
```

Cette sauvegarde conserve tous les livrables et sources de travail disponibles au moment de l'inventaire, plus une synthèse des décisions de la conversation. Elle n'est pas un export intégral du chat. Les anciennes versions des HTML remplacées au cours de l'étude ne sont pas toutes récupérables ; leurs captures et descriptions disponibles sont conservées. Les sessions du navigateur, sélections temporaires non consignées, dépendances réinstallables et processus locaux ne sont pas sauvegardés.

Le contrôle de la sauvegarde ne remplace pas l'audit du site. L'audit intégral frontend/backend, les essais PostgreSQL de cette étude, les contrôles d'accessibilité, de sécurité, de performance et la préparation de la démonstration restent à mener. Aucun déploiement n'est effectué par cette sauvegarde.
