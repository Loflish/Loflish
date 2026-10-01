# Nos Mots Mémoriaux : mémoire du projet (à lire au début de chaque session)

Ce fichier garde les décisions prises avec le créateur du musée, pour qu'une nouvelle session
reprenne le travail sans rien casser. Le site et ses textes sont en français ; on lui répond en
français.

## Le projet

Un musée vivant des dernières volontés : chacun dépose sa « trace » (quatre questions, puis des
fragments d'existence) et devient une bulle dans une constellation. Pas de popularité, pas de
classement, pas de compteur : toutes les bulles ont la même taille, le hasard est équitable.

- `src/` : le site (Vite + React + TypeScript, HashRouter).
- `server/` : le serveur (Fastify + PostgreSQL + stockage disque/S3) ; guide : `DEPLOIEMENT.md`.
- `design/hd/` : les outils de préparation des matières (découpe des planches Higgsfield).
- `public/hd/` : les images HD (matières des bulles `taches/tache-01..100.webp`, icônes brodées…).
- Récupérer le travail, reprendre après une limite : `RECUPERER.md`.

## Direction artistique — ne pas s'en écarter

- Émotions : joie, calme, poésie, douceur, nostalgie. Jamais funéraire ni sombre.
- Matières : aquarelle, papier, tissu, fil, broderie (référence : Ruth Rae ; le tableau brodé réel
  du créateur a donné le logo).
- **Bulles** : uniquement des couleurs de la palette GRIS (`src/lib/palette.ts`). Toutes de la même
  taille. Les matières sont de l'aquarelle pure, distinctes (style « C » validé) : 100 matières
  Higgsfield + la matière 0 (aquarelle cousue, procédurale). On choisit sa matière avec les
  flèches seulement (pas de feuille des matières). Le créateur veut en reparler. Chaque bulle porte un fil cousu sur
  son pourtour. Les teintes sont appliquées par multiplication (`paintTache`).
- **Bordeaux** : réservé au logo brodé et au fil de l'œuvre commune (`rgb(113, 42, 57)`). Nulle part
  ailleurs.
- Le logo brodé tient sur une seule ligne.
- **Une seule police : Newsreader** (choix validé par l'audit). La hiérarchie vient de la taille, de
  la graisse et de l'italique : titres en romain, mots des personnes (réponses, citations) en
  italique, interface en romain plus petit. IBM Plex ne sert qu'aux écritures que Newsreader ne
  dessine pas (arabe, hébreu, cyrillique…). Les 200 caractères ont la même typographie que les
  autres réponses. Le créateur n'aime pas le lettrage brodé : ne pas le remettre. Seul le logo est brodé.
- **Pas de « traits IA »** : aucun tiret cadratin (—, –), aucun petit rond (·), ni dans les textes
  ni comme séparateur ; pas d'écriture inclusive à point médian. Aucune mention « prototype ».
  Le nom s'écrit « Nos Mots Mémoriaux ». Le site tutoie partout.
- Pas d'arrivée en fondu sur les pages ; seules les bulles apparaissent puis se promènent.
- Pas de flaques / aplats de couleur derrière les textes. Fond tissu sur toutes les pages sauf la
  constellation.
- Le frontend se modifie avec beaucoup de précaution : le créateur tient à chaque détail visuel.
  Proposer avant de changer quelque chose de visible.
- **Higgsfield** : ne pas gaspiller les crédits. Vérifier l'historique avant de relancer une
  génération qui a expiré. Une image 1k coûte autant qu'une 4k.

## Règles du musée (appliquées par le site ET par le serveur)

- 18 ans ou plus. Deux bulles au plus par compte : sa propre trace, et une mémoire pour une
  personne décédée.
- Publier scelle les quatre réponses pendant cinq ans. Chaque fragment et chaque fichier est scellé
  au moment où il est déposé. Après cinq ans, un clic sur une réponse ou un fragment permet de le
  modifier (il est scellé de nouveau).
- **Plus de « mettre en avant »** : l'auteur range ses fragments avec les flèches ; les **trois
  premiers** se montrent sur la vue d'ensemble du profil, le reste en ouvrant la rubrique (même
  règle pour les 20 photos, vidéos, sons et documents libres).
- Limites par rubrique (`limiteDe` dans `src/data/types.ts`, source unique partagée avec le
  serveur) : 10 en général, 7 pour souvenirs / ce que je n'ai jamais dit / parole libre, 15 pour
  personnes et lieux.
- **Mémoire** : pas de « premier souvenir » ni « d'où viennent ces souvenirs ». Une question
  obligatoire, « Que peux-tu me dire sur cette personne ? », **500 caractères**, qui sert aussi
  d'aperçu (constellation, Se perdre). On dit « sa bulle » ; les rubriques sont dites à propos de
  la personne (« Ce qu'elle aimait voir »…).
- Pays : liste de tous les pays + « Autre », jamais de texte libre. Question 2 : « Qui ? » facultatif.
- **Connexion** : l'e-mail, puis un **code à six chiffres** envoyé par e-mail (15 min, 5 essais) ;
  changer d'adresse se confirme aussi par un code. Plus de lien magique.
- **Signaler** : trois motifs (danger ; haine, harcèlement, violence ; autre chose), sur le profil
  et sur chaque carte de Se perdre. Le fondateur reçoit chaque signalement par e-mail.
  On parle de « moi, le fondateur », jamais d'« équipe du musée ».
- **Modération** : pas de masquage. Selon la gravité, le fondateur **retire la bulle** (raison
  lue par l'auteur) ou **bannit** (bulles retirées, compte suspendu, empreinte de l'IP refusée).
  Il voit les choix de confidentialité de chacun dans `/admin`.
- « Protection des données », jamais « RGPD » ; contact unique `nosmots@memoriaux.org`
  (`src/lib/contact.ts`, modifiable par `VITE_CONTACT`). Chacun peut écrire pour consulter,
  modifier ou supprimer toutes ses données.
- Les 5 sens (voir, entendre, sentir, manger (identifiant « gouter »), toucher) sont 5 rubriques séparées.
- « Les questions, les fragments et l'essence du profil ne doivent jamais être brisés. »
- L'œuvre commune : un seul trait par personne inscrite et par appareil, dans le fil bordeaux du
  logo, **tous de la même longueur**, sur une toile immense (16 × 10, `src/data/oeuvre-regles.ts`).
  Le fondateur en fera de grands tableaux brodés.
- Aucune fausse bulle en production (les traces de démonstration n'existent qu'en prototype).

## Navigation

- Dock : Explorer, Se perdre, Créer ma trace, L'œuvre commune, Menu ; la page où l'on est
  disparaît du dock. Menu (deux colonnes égales) : Le projet, Compte, Archives, Ressources & aide,
  Soutenir, Juridique. Le pied de page ne propose jamais la page où l'on est.
- Les traces de chacun (sa trace, puis la mémoire) sont dans la page Compte (« Mes traces »).
- Ressources = l'aide (suicide) seulement ; « comment fonctionne le musée » et « signaler » sont
  sur la page Le projet.
- Le lien partagé ouvre la constellation sur l'aperçu de la bulle (`#/bulle/…`, en ligne `/b/…`).
- Page Le projet : la photo du fondateur se dépose dans `public/objets/fondateur.webp` (sans
  légende) ; tant qu'elle manque, rien ne s'affiche à sa place.

## Deux modes du site

- Prototype (`npm run dev`, `npm run build`) : tout dans le navigateur, traces de démonstration.
  C'est ce mode qui est publié en aperçu sur claude.ai (l'œuvre commune y utilise le stockage
  partagé de l'Artifact).
- En ligne (`npm run dev:en-ligne`, `npm run build:en-ligne`, `VITE_API=/api`) : relié au serveur.

## Façon de travailler

- Branche de travail : `claude/practical-newton-r1t0oq`. Pousser après chaque étape terminée
  (le conteneur des sessions est éphémère : ce qui n'est pas poussé peut être perdu).
- Pas de pull request sans demande explicite.
- Vérifier avant de pousser : `npx tsc -b`, `npm run build`, et pour le serveur
  `npm --prefix server run typecheck` et `npm --prefix server test` (base PostgreSQL jetable).
- Le dépôt GitHub est public : n'y mettre ni conversation, ni e-mail, ni secret.
