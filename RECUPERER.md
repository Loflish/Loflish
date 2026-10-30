# Récupérer le site sauvegardé

Le code, les images et les fichiers de progression sont conservés dans le dépôt
[Loflish/Loflish](https://github.com/Loflish/Loflish), sur la branche
refonte-octobre.

L'[état sauvegardé](PROGRESSION.md) relie le suivi historique du 8 octobre et
la [progression du 19 octobre](design/suivi/2026-10-19/README.md), avec les essais
visuels, leurs sources, les décisions récentes et les étapes restantes.

Les deux nouveaux comparateurs autonomes sont dans
`design/suivi/2026-10-19/outputs/`. Ils s'ouvrent directement dans un navigateur.
Les instructions de serveur local et de reconstruction sont dans le
[guide de cette sauvegarde](design/suivi/2026-10-19/README.md#reprendre-et-reconstruire).

## Télécharger une copie

Le [ZIP du dépôt](https://github.com/Loflish/Loflish/archive/refs/heads/refonte-octobre.zip)
contient les fichiers de cette branche. Le dépôt étant public, sa lecture et son
téléchargement ne nécessitent pas de connexion à un compte.

Une copie avec l'historique est également accessible par Git :

~~~sh
git clone -b refonte-octobre https://github.com/Loflish/Loflish.git nos-mots-memoriaux
~~~

L'[historique des versions](https://github.com/Loflish/Loflish/commits/refonte-octobre)
conserve les enregistrements précédents.

## Aperçu local

Dans le dossier de la copie téléchargée :

~~~sh
npm ci
npm run dev -- --host 127.0.0.1
~~~

Les planches de matières sont également accessibles par un serveur local :

~~~sh
npm exec -- vite design/suivi/2026-10-08 --host 127.0.0.1 --port 5180
~~~

Le comparatif du dernier lot est alors disponible à l'adresse
http://127.0.0.1:5180/Resultats_matieres_lot_04.html.

Les dépendances installées sont absentes du dépôt ; les fichiers package-lock.json
permettent leur réinstallation. Le serveur du site nécessite Node.js 22 ou plus
récent et PostgreSQL. Son fonctionnement et le déploiement sont décrits dans
[DEPLOIEMENT.md](DEPLOIEMENT.md).

## Périmètre

Cette sauvegarde contient les sources du site et du serveur, les ressources
visuelles, les neuf originaux des lots 02 à 04, les comparatifs et les avis
enregistrés. Elle ne contient pas les conversations privées, les identifiants,
les données locales du navigateur ni les données d'un service en production.
