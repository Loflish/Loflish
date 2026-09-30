# Nos mots mémoriaux — mémoire du projet (à lire au début de chaque session)

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
- `public/hd/` : les images HD (matières des bulles `taches/tache-01..92.webp`, icônes brodées…).
- Récupérer le travail, reprendre après une limite : `RECUPERER.md`.

## Direction artistique — ne pas s'en écarter

- Émotions : joie, calme, poésie, douceur, nostalgie. Jamais funéraire ni sombre.
- Matières : aquarelle, papier, tissu, fil, broderie (référence : Ruth Rae ; le tableau brodé réel
  du créateur a donné le logo).
- **Bulles** : uniquement des couleurs de la palette GRIS (`src/lib/palette.ts`). Toutes de la même
  taille. Les matières sont de l'aquarelle pure, distinctes (style « C » validé) : 92 matières
  Higgsfield + la matière 0 (aquarelle cousue, procédurale). Chaque bulle porte un fil cousu sur
  son pourtour. Les teintes sont appliquées par multiplication (`paintTache`).
- **Bordeaux** : réservé au logo brodé et au fil de l'œuvre commune (`rgb(113, 42, 57)`). Nulle part
  ailleurs.
- Le logo brodé tient sur une seule ligne.
- Typographies : Newsreader (titres, citations), IBM Plex Sans (interface, toutes écritures).
- Les 200 caractères de la question 4 sont affichés en lettrage brodé.
- Pas de flaques / aplats de couleur derrière les textes. Fond tissu sur toutes les pages sauf la
  constellation.
- Le frontend se modifie avec beaucoup de précaution : le créateur tient à chaque détail visuel.
  Proposer avant de changer quelque chose de visible.
- **Higgsfield** : ne pas gaspiller les crédits. Vérifier l'historique avant de relancer une
  génération qui a expiré. Une image 1k coûte autant qu'une 4k.

## Règles du musée (appliquées par le site ET par le serveur)

- 18 ans ou plus. Deux bulles au plus par compte : sa propre trace, et une mémoire pour une
  personne décédée.
- Publier scelle les quatre réponses pendant cinq ans. Chaque fragment et chaque média est scellé
  au moment où il est déposé. L'auteur garde la main sur l'ordre et les « mis en avant ».
- Limites par rubrique (`limiteDe` dans `src/data/types.ts`, source unique partagée avec le
  serveur) : 10 en général, 7 pour souvenirs / ce que je n'ai jamais dit / parole libre, 15 pour
  personnes et lieux. 5 mis en avant par rubrique. 20 médias & documents libres, 5 mis en avant.
- Les 5 sens (voir, entendre, sentir, goûter, toucher) sont 5 rubriques séparées.
- « Les questions, les fragments et l'essence du profil ne doivent jamais être brisés. »
- L'œuvre commune : un seul trait par personne et par appareil, dans le fil bordeaux du logo.
- Aucune fausse bulle en production (les traces de démonstration n'existent qu'en prototype).

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
