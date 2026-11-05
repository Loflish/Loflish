# 100 améliorations du 3 novembre 2026

Branche `ameliorations-fable-2026-11-03`, partie de `refonte-octobre` (00ac316). Rien n'est poussé sur GitHub.
Tout est retirable : chaque point est un petit bloc de code, et la direction artistique n'a pas bougé
(aucune couleur dans l'interface, Newsreader seule, pas de refonte, l'atelier des bulles intact).

**Vérifier tout d'un coup :** `npm run verifier` (types, lint, tests du site, tests du serveur, build).
Le 3 novembre : tout vert, 24 tests du site, 32 tests du serveur, build 17 Mo.

---

## A. Outillage et qualité (1 à 16)

| N° | Amélioration | Où | Vérifier |
| --- | --- | --- | --- |
| 1 | ESLint (TypeScript + React) : `npm run lint`, 0 erreur | `eslint.config.js` | `npm run lint` |
| 2 | Prettier, réglé sur le style du code (guillemets simples, 160 colonnes) ; appliqué aux fichiers nouveaux seulement, pour que la relecture reste lisible (le reformatage de tout le code attendra l'accord de Tom : 71 fichiers bougeraient) | `.prettierrc`, `.prettierignore` | `npm run format:check` |
| 3 | `.editorconfig` : mêmes retraits et fins de ligne dans tout éditeur | `.editorconfig` | ouvrir un fichier dans VS Code |
| 4 | Version de Node fixée (22) pour le PC, la CI et Docker | `.nvmrc`, `engines` de `package.json` | `cat .nvmrc` |
| 5 | Vitest pour le site (tests sans navigateur) | `vitest.config.ts`, `npm run test:site` | `npm run test:site` |
| 6 | Tests du hasard reproductible (même graine, même bulle) | `src/lib/random.test.ts` | idem |
| 7 | Tests de la palette GRIS (30 teintes, 5 familles, jamais de bordeaux) | `src/lib/palette.test.ts` | idem |
| 8 | Tests des liens et fichiers (YouTube sans cookies, Vimeo, tailles) | `src/lib/fichiers.test.ts` | idem |
| 9 | Tests des rubriques et de leurs limites (7, 10, 15) | `src/data/types.test.ts` | idem |
| 10 | Tests de l'œuvre commune (tous les fils ont la même longueur) | `src/data/oeuvre-regles.test.ts` | idem |
| 11 | Tests de la liste des pays (français, triée, sans code brut) | `src/lib/pays.test.ts` | idem |
| 12 | Test serveur de l'en-tête `Range` (avancer dans une vidéo) | `server/test/plage.test.ts` | `npm run serveur:test` |
| 13 | `npm run verifier` : tout dans l'ordre, avec ✓ / ✗ et la durée de chaque étape | `scripts/verifier.mjs` | `npm run verifier` |
| 14 | GitHub Actions : à chaque envoi, types, lint, tests et build | `.github/workflows/verifier.yml` | onglet Actions après un push |
| 15 | `npm test` lance les tests du site puis ceux du serveur | `package.json` | `npm test` |
| 16 | Lint : une affectation inutile corrigée dans le partage | `src/components/Partager.tsx` | `npm run lint` |

## B. Chargement et performance (17 à 30)

| N° | Amélioration | Où | Vérifier |
| --- | --- | --- | --- |
| 17 | Chaque page arrive à la demande (profil, Créer, œuvre, pages, compte) : le JS d'accueil passe de 402 Ko à 162 Ko | `src/App.tsx` | `npm run build`, lire la liste des fichiers |
| 18 | React et le routeur dans leur propre fichier : le navigateur le garde d'une version à l'autre | `vite.config.ts` (`manualChunks`) | `dist/assets/react-*.js` |
| 19 | Une phrase « Un instant… » pendant qu'une page arrive, jamais d'écran vide | `App.tsx` (`Attente`), `finitions.css` | connexion lente (outils du navigateur) |
| 20 | La vidéo d'encre (170 Ko) ne se charge qu'au premier survol ou toucher d'une bulle | `src/components/Backdrop.tsx` | onglet Réseau : `encre.webm` absent au chargement |
| 21 | Économiseur de données activé : pas de vidéo d'encre du tout | `Backdrop.tsx` | `navigator.connection.saveData` |
| 22 | La bulle sous la souris est cherchée dans 9 cases de la grille, plus parmi les 380 bulles | `src/engine/constellation.ts` (`hit`) | survol fluide, même à 380 bulles |
| 23 | Onglet caché : la constellation ne calcule ni ne dessine plus rien (batterie) | `constellation.ts` (`start`) | aucun `step` quand `document.hidden` |
| 24 | Le logo passe devant les autres images (`fetchpriority=high`, décodage asynchrone) | `src/components/Chrome.tsx` | onglet Réseau, ordre des images |
| 25 | Toutes les bulles en image (profil, Se perdre, Créer) se décodent sans bloquer la page | `Chrome.tsx` (`BubbleImage`) | attribut `decoding="async"` |
| 26 | Les 21 icônes brodées se chargent paresseusement, hors écran | `src/components/Icon.tsx` | onglet Réseau sur une trace longue |
| 27 | Les photos des médias se décodent sans bloquer | `src/components/Media.tsx` | attribut `decoding` |
| 28 | Un appel au serveur a un délai (20 s ; 10 min pour un fichier) : plus jamais d'attente infinie | `src/lib/api.ts` | couper le réseau, message clair |
| 29 | Une lecture qui échoue sur le réseau est retentée une fois après 0,8 s (changement d'antenne) | `api.ts` | idem |
| 30 | Deux messages distincts : « ne répond pas » et « met trop de temps » | `api.ts` | idem |

## C. Accessibilité (31 à 44)

| N° | Amélioration | Où | Vérifier |
| --- | --- | --- | --- |
| 31 | Lien d'évitement « Aller au contenu », visible au clavier seulement | `App.tsx`, `finitions.css` | Tab dès l'arrivée |
| 32 | Mouvement réduit (réglage du système) : plus de respiration des bulles ni des fonds, panneaux posés sans glisser | `finitions.css` | Windows > Accessibilité > Effets d'animation |
| 33 | La tabulation reste dans une salle ouverte (piège de focus), Échap la ferme | `src/components/Panneau.tsx` | Tab en boucle dans une rubrique |
| 34 | La tabulation reste dans la visionneuse d'un média | `Media.tsx` (`MediaVue`) | ouvrir une photo, Tab |
| 35 | Le menu signale la page où l'on est (`aria-current`) | `Chrome.tsx` (`Dock`) | lecteur d'écran, ou inspecter |
| 36 | La recherche est un vrai formulaire (`role="search"`), sans autocomplétion parasite | `src/pages/Explorer.tsx` | inspecter |
| 37 | Raccourcis annoncés aux aides techniques (`aria-keyshortcuts`) | `Explorer.tsx`, `OeuvreCommune.tsx` | inspecter |
| 38 | La toile de l'œuvre commune est atteignable au clavier, avec sa description | `OeuvreCommune.tsx` | Tab jusqu'à la toile |
| 39 | Plus aucun texte sous 11 px (durées, dépôt, valeurs) | `finitions.css` | mesurer `.media-duree` |
| 40 | Le compteur de caractères s'affirme sous les 10 % restants | `Creer.tsx`, `FragmentEditor.tsx`, `finitions.css` | écrire 1 080 caractères |
| 41 | Les champs de réponse grandissent avec le texte : on relit tout, sans petite boîte à faire défiler | `src/lib/autogrow.ts` | écrire 10 lignes |
| 42 | Le pays se propose avec l'autocomplétion du navigateur (`country-name`) | `Creer.tsx` | inspecter le `select` |
| 43 | Défilement doux vers un élément mis au point, sauf si le système refuse le mouvement | `finitions.css` | Tab puis Entrée sur « Aller au contenu » |
| 44 | Plus de rectangle bleu au toucher sur téléphone | `finitions.css` | téléphone |

## D. Typographie et finitions (45 à 52)

| N° | Amélioration | Où | Vérifier |
| --- | --- | --- | --- |
| 45 | Newsreader en taille optique automatique : le dessin suit la taille du texte | `finitions.css` (`font-optical-sizing`) | comparer un titre et une note |
| 46 | Titres en lignes équilibrées (`text-wrap: balance`) | `finitions.css` | « Que souhaites-tu créer ? » sur téléphone |
| 47 | Paragraphes sans mot orphelin (`text-wrap: pretty`) | `finitions.css` | page Le projet |
| 48 | Césure française des longs textes sur écran étroit (`hyphens: auto`) | `finitions.css` | une réponse longue à 360 px |
| 49 | Tirer la page vers le bas ne la recharge plus pendant une promenade (`overscroll-behavior`) | `finitions.css` | téléphone, constellation |
| 50 | Chaque nouvelle page s'ouvre en haut : un lien du pied de page n'ouvrait pas la suivante déjà défilée (bug corrigé) | `App.tsx` (`EnHaut`) | Le projet, défiler, « Ressources & aide » |
| 51 | La page en panne rassure (« rien n'est perdu ») et propose le retour au musée | `src/components/Panne.tsx` | provoquer une erreur de rendu |
| 52 | Aucune feuille de style existante modifiée : tout vit dans `finitions.css` et `print.css`, retirables d'un import | `src/main.tsx` | retirer les deux imports |

## E. Imprimer et partager (53 à 62)

| N° | Amélioration | Où | Vérifier |
| --- | --- | --- | --- |
| 53 | Feuille d'impression : le papier seul, la bulle, le nom, les quatre réponses, sans interface | `src/styles/print.css` | Ctrl+P sur une trace |
| 54 | À l'impression, tous les fragments de toutes les rubriques, à la suite (invisibles à l'écran) | `TracePage.tsx` (`Impression`) | aperçu avant impression |
| 55 | Bouton « Imprimer » sur chaque trace (ou enregistrer en PDF) | `TracePage.tsx` | en haut d'une trace |
| 56 | Lien profond vers une salle : `#/trace/sakinah?salle=souvenirs` ouvre directement la rubrique | `TracePage.tsx` | ouvrir l'adresse |
| 57 | `?salle=medias` ouvre les photos, sons et documents | `TracePage.tsx` | idem |
| 58 | « Partager » au bas de chaque rubrique ouverte : le lien de cette salle précise | `TracePage.tsx` (`RubriqueDetail`) | ouvrir Souvenirs |
| 59 | « Sa bulle » : depuis une trace, revenir dans la constellation sur cette bulle | `TracePage.tsx` | en haut d'une trace |
| 60 | Aperçu de partage complet : image, adresse, langue, nom du site, carte Twitter | `index.html` | coller le lien dans une messagerie |
| 61 | Données structurées `WebSite` (schema.org) pour les moteurs | `index.html` | code source |
| 62 | Message sans JavaScript, en français, au lieu d'une page blanche | `index.html` (`noscript`) | désactiver JavaScript |

## F. Application installable et métadonnées (63 à 67)

| N° | Amélioration | Où | Vérifier |
| --- | --- | --- | --- |
| 63 | Manifeste d'application : « Ajouter à l'écran d'accueil », plein écran, couleur du lin | `public/manifest.webmanifest` | Chrome > Installer |
| 64 | Icônes 192 et 512 px (dérivées de l'icône existante ; une source nette en 512 ferait mieux) | `public/icone-192.png`, `icone-512.png` | idem |
| 65 | Nom court sous l'icône sur iPhone (« Nos Mots ») | `index.html` | Safari > Sur l'écran d'accueil |
| 66 | `color-scheme: light` déclaré : plus de fond noir en mode sombre avant le chargement | `index.html` | mode sombre du système |
| 67 | `.dockerignore` complété : ni `.claude`, ni `CLAUDE.local.md`, ni les essais visuels dans l'image | `.dockerignore` | `docker compose build` |

## G. La constellation (68 à 78)

| N° | Amélioration | Où | Vérifier |
| --- | --- | --- | --- |
| 68 | « Une bulle au hasard » : la vue glisse vers une présence tirée au sort et l'ouvre | `Explorer.tsx`, `constellation.ts` (`auHasard`) | bouton en haut à droite |
| 69 | « Revenir au centre » apparaît dès qu'on s'est promené ou approché | `Explorer.tsx` | glisser, puis cliquer |
| 70 | « Revenir au centre » ramène aussi au point de départ, plus seulement au zoom d'origine | `constellation.ts` (`resetView`) | idem |
| 71 | Touche Début (ou 0) : retour au centre | `constellation.ts` | clavier sur la constellation |
| 72 | Un second clic sur la bulle ouverte entre dans sa mémoire (sans viser le bouton) | `constellation.ts`, `Backdrop.tsx` | double-clic sur une bulle |
| 73 | `/` ou Ctrl+K ouvre la recherche, Échap la ferme de n'importe où | `Explorer.tsx` | clavier |
| 74 | La recherche montre le passage trouvé, le mot surligné, sous chaque nom | `Explorer.tsx` (`extrait`) | chercher « coquelicot » |
| 75 | « Parmi 422 présences » : le total, pour situer une recherche | `Explorer.tsx` | ouvrir la recherche |
| 76 | « Effacer la recherche » remet tous les filtres à zéro d'un clic | `Explorer.tsx` | après une recherche |
| 77 | Entrée avec une seule présence trouvée : on va la voir | `Explorer.tsx` | chercher un nom précis |
| 78 | Deux avertissements React (nettoyage d'effet) corrigés dans Explorer et Backdrop | `Explorer.tsx`, `Backdrop.tsx` | `npm run lint` |

## H. Créer sa trace et déposer (79 à 88)

| N° | Amélioration | Où | Vérifier |
| --- | --- | --- | --- |
| 79 | Le brouillon retient l'étape : fermer l'onglet et revenir reprend à la même étape | `src/pages/Creer.tsx` | avancer, recharger |
| 80 | « Ton brouillon a été retrouvé » : Continuer, ou Repartir de zéro | `Creer.tsx` | idem |
| 81 | Fermer l'onglet pendant l'enregistrement du brouillon demande confirmation | `Creer.tsx` (`beforeunload`) | écrire puis fermer aussitôt |
| 82 | Ctrl+Entrée (Cmd+Entrée) passe à l'étape suivante sans lâcher le clavier | `Creer.tsx` | clavier |
| 83 | Les quatre réponses et le souvenir d'une mémoire grandissent avec le texte | `Creer.tsx` | écrire |
| 84 | Ce qu'on écrit dans une rubrique est gardé le temps de l'onglet : fermer la salle par mégarde ne perd plus le texte | `src/components/FragmentEditor.tsx` | écrire, fermer, rouvrir |
| 85 | Le champ d'un fragment grandit avec le texte | `FragmentEditor.tsx` | écrire |
| 86 | Navigateur plein : l'auteur le sait (bandeau sur sa trace) au lieu de perdre son dépôt en silence | `src/data/store.ts` (`save`) | remplir `localStorage` |
| 87 | « Emporter mes traces (fichier) » : un JSON de ses traces, dans l'aperçu autonome | `store.ts` (`exporterLocal`), `Pages.tsx` | page Compte |
| 88 | « Reprendre un fichier » : retrouver ses traces sur un autre appareil, ou après un navigateur qui a tout oublié (le 26 octobre) | `store.ts` (`importerLocal`) | page Compte |

## I. Se perdre et l'œuvre commune (89 à 94)

| N° | Amélioration | Où | Vérifier |
| --- | --- | --- | --- |
| 89 | Le fil de la promenade tient le temps de l'onglet : ouvrir une trace puis revenir reprend à la même carte | `src/pages/SePerdre.tsx` | Suivant ×3, ouvrir, retour |
| 90 | À la première visite, un mot sur les gestes (flèches, glisser), qui s'efface | `SePerdre.tsx` | première visite |
| 91 | « Revenir au cœur » dans l'œuvre commune, dès qu'on s'en est éloigné | `src/pages/OeuvreCommune.tsx` | glisser la toile |
| 92 | Touches `+`, `-` et Début sur la toile de l'œuvre | `OeuvreCommune.tsx` | clavier |
| 93 | Le cadrage d'ouverture est mémorisé, retrouvé d'un clic ou d'une touche | `OeuvreCommune.tsx` | idem |
| 94 | Se perdre : hasard toujours équitable (mélange à graine, jamais la popularité) | `SePerdre.tsx` | lire le code |

## J. Serveur et déploiement (95 à 100)

| N° | Amélioration | Où | Vérifier |
| --- | --- | --- | --- |
| 95 | `/api/sante` donne la version et le temps de fonctionnement, jamais mis en cache | `server/src/app.ts` | `curl /api/sante` |
| 96 | `/api/moi` n'est jamais gardé par un cache : après une déconnexion, la réponse change | `server/src/auth.ts` | en-tête `cache-control` |
| 97 | Caddy n'ouvre la porte qu'une fois le musée en bonne santé : plus d'erreur 502 au démarrage | `docker-compose.yml` | `docker compose up` |
| 98 | Les tests du serveur restent verts sous Windows (PGlite) : 32 tests | `server/test/` | `npm run serveur:test` |
| 99 | La CI fait tourner les tests du serveur sur une vraie base PostgreSQL 16 | `.github/workflows/verifier.yml` | onglet Actions |
| 100 | Point de reprise écrit : ce fichier, `PROGRESSION.md`, `README.md`, la mémoire de Claude | racine | lire |

---

## Ce qui n'a pas été vérifié

- Un vrai téléphone (le navigateur intégré a été réduit à 518 px de large : les retours tactiles sont déduits du code).
- L'installation de l'application (manifeste) sur un vrai appareil ; les icônes 192 et 512 sont agrandies depuis 180 px.
- L'impression réelle : la feuille a été relue, pas imprimée.
- GitHub Actions : le fichier est écrit, la CI ne tourne qu'au premier envoi.
- Docker : `docker compose up` n'a pas été relancé (Docker n'est pas lancé sur ce PC).

## Ce que Tom peut corriger ou retirer

- Les textes ajoutés (« Une bulle au hasard », « Revenir au centre », « Sa bulle », l'aide de Se perdre, le bandeau du brouillon) sont provisoires : Tom réécrit tous les textes.
- Tout retirer d'un coup : `git switch refonte-octobre`. Retirer un point : supprimer son bloc (chaque point est commenté dans le code avec sa raison).
- L'adresse `nosmotsmemoriaux.org` est écrite dans `index.html` (aperçu de partage) : à changer si le nom de domaine change.

---

## Second commit du même jour : « Design Fable »

Mesures d'abord, retouches ensuite, remesures : tout est dans `Desktop/Claude Code/reports/Design Fable 2026-11-03.md`
(planches avant/après, Lighthouse, axe-core, images par seconde, cahier des charges confronté au site). En bref :

| N° | Amélioration | Où | Vérifier |
| --- | --- | --- | --- |
| 101 | Spécification de mouvement : l'interface répond en 120 ms, une surface se pose en 420 ms, part en 260 ms (cahier §58.1 et §58.3) | `src/styles/design-fable.css` | survoler, ouvrir une salle |
| 102 | Les quatre réponses en deux colonnes de lecture, question discrète, l'essentiel en épigraphe (§55.6) | `design-fable.css` | une trace à 1920 px |
| 103 | Le fil se coud au survol de « Entrer dans sa mémoire », et sous le titre d'une salle, dans la couleur de la bulle (§56.10, §58.4) | `design-fable.css` | survol, salle |
| 104 | Boutons de papier : ombre d'un pixel, s'enfoncent à la pression (§55.8) | `design-fable.css` | presser « Continuer » |
| 105 | Mode Lecture sur une trace : une colonne, les mots seuls, retenu sur l'appareil | `src/pages/TracePage.tsx` | bouton « Lecture » |
| 106 | Loader : une bulle de pigment qui respire ; squelette beige sur une trace qui arrive du serveur (§56.7, §59.3) | `App.tsx`, `TracePage.tsx` | connexion lente |
| 107 | Filtre « Arrivée dans le musée » (année) dans la recherche (§12.4) | `src/pages/Explorer.tsx` | ouvrir la recherche |
| 108 | Les deux shaders (fond vivant, eau) compilent en parallèle : 2,5 s de blocage en moins au premier lancement | `src/engine/atmosphere.ts`, `eau.ts` | `performance.getEntriesByType('measure')` |
| 109 | L'eau se prépare après les deux premières images : la peinture fixe est déjà là | `src/components/Backdrop.tsx` | onglet Performance |
| 110 | Les taches des bulles (jusqu'à 3 Mo) ne se téléchargent que dans la constellation, et après la peinture | `Backdrop.tsx` | onglet Réseau sur une trace |
| 111 | Une bulle n'attend que sa propre matière, plus les 30 ou 100 taches | `src/lib/hd.ts`, `Chrome.tsx` | trace sur téléphone |
| 112 | Six matières PNG servies en WebP sans perte : 1,8 → 0,8 Mo, pixels identiques (vérifié) | `public/hd/taches/*-sans-perte.webp` | `python scripts/planches.py` n'y touche pas ; voir le rapport |
| 113 | Le lin (410 Ko) arrive quand le navigateur est libre, jamais devant la peinture | `Backdrop.tsx` | onglet Réseau |
| 114 | Le papier des pages est préchargé dès l'adresse lue (1,2 s plus tôt sur une trace) | `src/main.tsx` | onglet Réseau |
| 115 | La première peinture apparaît sans fondu | `Backdrop.tsx`, `design-fable.css` | recharger l'accueil |
| 116 | Le monde de la constellation se redimensionne quand l'écran change de classe (fenêtre agrandie, téléphone tourné) | `src/engine/constellation.ts` | réduire puis agrandir la fenêtre |
| 117 | Essai `?toucher=1` : compression au contact et micro-réaction au curseur (§54.4, §54.6), inactif sans l'adresse | `constellation.ts` | `/?toucher=1` |
| 118 | Les changements de page passent par `startTransition` (React Router v7) | `main.tsx` | — |
| 119 | Marques de performance au démarrage (`nmm:atmosphere`, `nmm:constellation`, `nmm:eau`) | `Backdrop.tsx` | onglet Performance |
| 120 | Trois juges rejouables : `scripts/lighthouse.mjs` (`HEADLESS=0` avec la carte graphique), `scripts/mesures.mjs` (images par seconde, latence, axe), `scripts/planches.py` | `scripts/` | les lancer |

`?fable=0` rend le site d'avant ces retouches, pour comparer.

## Lot « Atelier 8K » (3 novembre, soir) — chantiers 1, 2, 5, 6 validés par Tom

| N° | Amélioration | Fichiers | Vérifier |
| --- | --- | --- | --- |
| 121 | La peinture de l'eau passe en 5 120 × 2 880 px quand le navigateur est libre (écran ≥ 1 400 px, texture ≥ 5 120, pas d'économie de données) ; même mélange que le fond servi (écart moyen 3,4 / 255), 1,3 Mo | `src/engine/eau.ts` (`chargerHD`), `src/lib/hd.ts` (`FONDS.largeHD`), `public/hd/essais/fond-feutre-16x9-5120.webp` | `__nmmDebug.eau.image` après quelques secondes |
| 122 | Résolution adaptative de l'eau : sous 45 images/s deux fois de suite, l'échelle tombe à 0,7 | `src/engine/eau.ts` (`surveiller`, `qualite`) | `__nmmDebug.eau.qualite` sur une machine lente |
| 123 | Les bulles sont peintes hors du fil principal (OffscreenCanvas dans un travailleur, sprites en ImageBitmap transférés) ; l'ancien chemin reste si le navigateur ne peut pas ou avec `?travailleur=0` | `src/engine/bulles.worker.ts`, `src/engine/peintre.ts`, `constellation.ts`, `bubbleSprite.ts`, `hd.ts` (`matieresTransferables`) | `__nmmDebug.engine.peintre.actif` |
| 124 | 94 matières recoupées en 1 024 px depuis les planches 4K d'origine (`design/hd/matieres_1024.py`), servies aux bulles ≥ 120 px (page d'une trace, Créer) ; la constellation garde 512 ; repli automatique sur la petite | `public/hd/taches/1024/` (30 Mo), `hd.ts` (`tacheFor(n, grande)`), `bubbleSprite.ts`, `Chrome.tsx` | onglet Réseau sur une trace : `taches/1024/tache-NN.webp` |
| 125 | Derrière les pages éditoriales et les profils, les nappes continuent de respirer aux aplats des Nabis (sauge, rose ancien, miel, lilas, tilleul) au lieu de s'arrêter ; formulaires et juridique restent sur le papier seul ; `?nappes=0` rend les pages d'avant | `src/engine/atmosphere.ts` (`uPage`, `setPage`), `Backdrop.tsx` (`AVEC_NAPPES`), `design-fable.css` | ouvrir une trace, regarder le fond bouger |

Non faits (choix de Tom) : 3 (fil de Ruth Rae) et 4 (tapis tufté). En attente : l'adresse de son tableau Pinterest pour accorder les cinq couleurs du 125.

## Lot « Bulles » (4 novembre) — le choix de Tom après la grande comparaison

| N° | Amélioration | Fichiers | Vérifier |
| --- | --- | --- | --- |
| 126 | Planche 5 « filaments de lumière » : 100 matières peintes par code (lavis clair à réserves, filaments dans un champ tourbillonnant), 512 px pour la constellation, 1 024 px pour la page d'une trace et Créer ; c'est le catalogue du site (palette L, `CATALOGUE`) ; `?bulles=anciennes` rend les 100 taches ; les matières déjà choisies (numéros A) restent servies | `design/hd/lumiere.py`, `design/planche-5-lumiere.{json,md}`, `public/hd/taches-lumiere/`, `src/lib/hd.ts`, `bubbleSprite.ts` (posée deux fois), `Creer.tsx` | ouvrir le site, zoomer ; `reports/Bulles 2026-11-04/` |
| 127 | Le mélange : 100 bulles choisies à poids égal parmi les 290 gardées au tri (planches 2, 3, 4), `?melange=1` en développement | `design/hd/selection_bulles.py`, `design/selection-bulles.json` | `/?melange=1&bulles=anciennes` |
| 128 | Le travailleur reçoit la matière décidée par la page (drapeaux d'adresse) et ses sprites sont acceptés (ils étaient jetés quand la matière n'était pas choisie : les bulles restaient provisoires) | `constellation.ts` | `__nmmDebug.engine.bubbles` : des ImageBitmap |
| 129 | Outils de comparaison à égalité : `design/hd/comparaison.py` (mêmes couleurs, 38 / 96 / 190 px, vrai fond), `scripts/capturer.mjs` (constellation en 1920 avec zoom) | `design/hd/`, `scripts/` | les lancer |

## 5 novembre

| N° | Amélioration | Fichiers | Vérifier |
| --- | --- | --- | --- |
| 130 | Le drap coloré derrière toutes les pages sauf la constellation : les nappes des Nabis étaient cachées par le papier ivoire (ordre d'empilement) ; elles passent au-dessus, multipliées, à 0,7, pigments plus francs et nappes plus larges sur les pages ; validé par Tom ; `?nappes=0` rend le papier seul | `design-fable.css`, `Backdrop.tsx`, `atmosphere.ts` | ouvrir Le projet ou Créer |
| 131 | Atelier des bulles sur les planches 2 et 3 (détails de vie, autre conversation) pour le choix de Tom ; l'atelier Comparer montre la planche 5 à côté des autres ; les grandes matières (1 024 px) servent à partir de 150 px | `AtelierBulles.tsx`, `AtelierComparer.tsx`, `planches.ts`, `Chrome.tsx` | `/#/atelier/bulles`, `/#/atelier/comparer` |
| 132 | Catalogue des bulles = les 183 aimées des planches 2 et 3, sans les 13 doublons retirés (palette M, `design/hd/catalogue.py`) ; `?bulles=lumiere` et `?bulles=anciennes` pour comparer ; atelier des doublons (`/#/atelier/doublons`, `design/hd/doublons.py`) | `hd.ts`, `public/hd/taches-catalogue/`, `AtelierDoublons.tsx` | ouvrir le site |
| 133 | « Après moi » (loi 78-17, art. 85) : dans le compte, le sort de ses données à sa mort, personne désignée, consentement distinct, horodaté, révocable ; export inclus ; demande liée à un décès (`POST /api/deces`, gardée, e-mail au fondateur) ; 2 tests serveur | `server/migrations/005_apres_moi.sql`, `routes/auteur.ts`, `routes/public.ts`, `courriel.ts`, `store.ts`, `Pages.tsx` | `npm run serveur:test` (34) ; compte en ligne |
| 134 | Juridique : six rubriques ajoutées (données après la mort, après un décès, vie privée des vivants, signalements et retraits, durées de conservation, fermeture du musée) et mentions légales structurées à compléter (LCEN art. 1-1 et 1-2) ; registre des traitements provisoire | `Pages.tsx`, `docs/registre-des-traitements.md` | `/#/juridique` |
| 135 | Droits au dépôt : un fichier (photo, son, vidéo, document) ne compte qu'une fois la case « j'ai les droits et l'accord des personnes » cochée ; le serveur refuse sans déclaration (`droits`), garde `droits_le` | `Media.tsx`, `store.ts`, `routes/auteur.ts`, migration 006 | test « un fichier sans déclaration de droits est refusé » |
| 136 | Retrait motivé : à chaque retrait d'une bulle, l'auteur reçoit les motifs et la voie de réclamation (DSA art. 17) ; `retiree_le` | `routes/admin.ts`, `courriel.ts` | journal du serveur sans SMTP |
| 137 | Opposition d'une personne concernée : motif « Il s'agit de moi, ou d'un proche » dans Signaler, adresse de réponse exigée, gardée | `Signaler.tsx`, `routes/public.ts`, migration 006 | test « une personne concernée s'oppose » |
| 138 | Données d'identification des auteurs (LCEN art. 6 V) : empreinte de l'adresse à la création de chaque trace, fragment, média ; le ménage applique les durées annoncées (journal 1 an, signalements traités 1 an, bannissements 1 an, demandes de décès 3 ans, comptes vides inactifs 3 ans) | `routes/auteur.ts`, `app.ts` (`menage`) | test « le ménage passe » |
| 139 | Vidéo d'un service tiers (YouTube, Vimeo) : avertissement et clic avant le chargement du lecteur | `Media.tsx` | ouvrir un média « lien » vidéo |
| 140 | Page « introuvable » : une adresse qui ne mène nulle part le dit et ramène à la constellation (la route `*` renvoyait à l'accueil sans un mot) | `Pages.tsx` (`Introuvable`), `App.tsx` | `/#/nulle-part` |
| 141 | Juridique : rubrique « Images et musique du musée » (images décoratives faites à la main ou par IA, règlement IA art. 50) | `Pages.tsx` | `/#/juridique` |
| 142 | `server/scripts/dev-pglite.ts` : le musée en ligne sur une base PGlite jetable (sans PostgreSQL), pour voir le vrai parcours avec `npm run dev:en-ligne` ; Après moi, décès et Juridique vérifiés ainsi | `server/scripts/` | `cd server && npx tsx scripts/dev-pglite.ts` |
| 143 | Le fond des pages : le coton ivoire « aura-37 » (détail subtil, très léger passage de couleur, pliures ; aura-31, plus coloré, gardé derrière `?tissu=aura-31`), fait dans Google Flow (Nano Banana 2.1, six séries de prompts, 38 tirages, choix de Tom), posé en 16:9 et 9:16 ; le papier ivoire des pages s'allège (0,3) et un voile dégradé protège la colonne de lecture (axe : 0 défaut de contraste) ; `?tissu=coton` rend le coton d'avant, `?tissu=<nom>` un essai | `public/hd/fond-tissu-*.webp`, `design/fond-tissu-aura-31.jpg`, `hd.ts`, `design-fable.css` | ouvrir Le projet, une trace, Créer |
