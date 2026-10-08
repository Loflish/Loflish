# Récupérer le site sauvegardé

Le code, les images et les fichiers de progression sont conservés dans le dépôt
[Loflish/Loflish](https://github.com/Loflish/Loflish), sur la branche
claude/practical-newton-r1t0oq.

L'[état sauvegardé](PROGRESSION.md) décrit les matières intégrées, les essais
conservés et les vérifications enregistrées au 8 octobre 2026.

## Télécharger une copie

Le [ZIP du dépôt](https://github.com/Loflish/Loflish/archive/refs/heads/claude/practical-newton-r1t0oq.zip)
contient les fichiers de cette branche. Le dépôt étant public, sa lecture et son
téléchargement ne nécessitent pas de connexion à un compte.

Une copie avec l'historique est également accessible par Git :

~~~sh
git clone -b claude/practical-newton-r1t0oq https://github.com/Loflish/Loflish.git nos-mots-memoriaux
~~~

L'[historique des versions](https://github.com/Loflish/Loflish/commits/claude/practical-newton-r1t0oq)
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
