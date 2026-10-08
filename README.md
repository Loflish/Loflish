# Nos mots mémoriaux

**État sauvegardé au 8 octobre 2026 : [PROGRESSION.md](PROGRESSION.md).**
Le site contient les six matières validées des lots 02 et 03. Les trois essais du
lot 04, les avis et les fichiers de suivi sont conservés dans `design/suivi/2026-10-08/`.

Un musée vivant où chacun peut laisser sa trace : ses dernières volontés, ses mots, ses souvenirs.
Ce dépôt contient **le site** (React + Vite, construit à partir du cahier des charges maître et de
la direction artistique) et **le serveur du musée** (`server/` : comptes, traces, médias, règles,
modération, archives, sauvegardes).

> Deux modes. Le **prototype** (`npm run dev`, `npm run build`) garde tout dans le navigateur et
> montre des présences de démonstration : c'est l'aperçu publié sur claude.ai. Le mode **en ligne**
> (`npm run build:en-ligne`) parle au serveur : aucune fausse bulle (cahier des charges, Bloc 3A).
>
> Mettre le musée en ligne, gérer ses données, sauvegarder : **[DEPLOIEMENT.md](DEPLOIEMENT.md)**.

## Lancer

```bash
npm install
npm run dev              # le prototype autonome, http://localhost:5173
npm run build            # build statique dans dist/ (chemins relatifs, hébergeable partout)

# avec le serveur (voir DEPLOIEMENT.md § 8)
npm --prefix server install
npm run serveur          # l'API, http://localhost:8787 (PostgreSQL requis)
npm run dev:en-ligne     # le site relié à l'API
npm run serveur:test     # les tests du serveur, sur une vraie base jetable
docker compose up -d --build   # tout le musée en production (site, API, base, HTTPS, sauvegardes)
```

## Ce qui est en place

| Surface | Contenu |
| --- | --- |
| **Explorer** (`/`) | Constellation plein écran : fond pictural vivant, bulles qui se promènent, survol = le nom seul, posé à côté de la bulle, clic = aperçu (les 200 caractères, ou les 500 d'une mémoire), « Entrer dans sa mémoire » = l'encre s'ouvre vers le profil, retour au même endroit. Recherche et filtres discrets (tous les résultats, par séries). Un lien partagé (`#/bulle/…`, en ligne `/b/…`) ouvre la constellation sur l'aperçu de la bulle. Le logo brodé n'apparaît en grand qu'ici. |
| **Archives** (`/archives`, `/archives/:edition`) | Chaque édition (`src/data/archives.ts`, titre renommable : « 2026 », « 2028 »…) s'ouvre sur sa propre constellation, identique à l'accueil, avec les présences déposées jusqu'à la fin de son année. |
| **Se perdre** | Une présence à la fois, hasard équitable, glisser / boutons / flèches, aucun signal de popularité ; « Signaler » dans le coin de chaque carte. |
| **Profil** (`/trace/:id`) | Architecture « Proposition A révisée » : la bulle, le nom tel que la personne a choisi d'apparaître, type de trace, pays, dates clés ; les 4 questions, réponses en entier ; pour une mémoire, « Que peux-tu me dire sur cette personne ? » (500 caractères) ; les 18 rubriques de fragments d'existence (dites à propos de la personne pour une mémoire), dont les 5 sens côte à côte. Chaque tuile montre les trois premiers fragments, dans l'ordre choisi par l'auteur (flèches ↑ ↓) ; la rubrique s'ouvre en « salle » avec tous ses fragments. Limites : 10, 7 (souvenirs, ce que je n'ai jamais dit, parole libre) ou 15 (personnes, lieux). Photos, vidéos, sons & documents : 20 au plus, trois montrés ; documents en simple téléchargement. Vue auteur : bandeau du scellement et de la protection des données, choix de confidentialité en un clic, et, après cinq ans, un clic pour modifier une réponse ou un fragment. « Signaler » (trois motifs). Deux profils de démonstration : `/trace/sakinah` et `/trace/jeannot`. |
| **L'œuvre commune** (`/oeuvre-commune`) | Chaque personne coud un seul trait, de la même longueur que tous les autres, sur une toile immense (16 × 10) : un clic pour le départ, un clic pour la direction, une confirmation (définitif), puis le trait se coud point par point, au point avant, dans le fil bordeaux du logo. Tous les traits forment une broderie immense. Publié sur claude.ai, les traits sont partagés en direct (stockage partagé de l'Artifact : un document par personne) ; en ligne, le serveur garde les traits (un par compte et par appareil) ; ailleurs, le trait reste sur l'appareil. Dans l'aperçu seulement, des traits d'exemple en pâle. Le fondateur reproduira ce tracé sur de grands tableaux brodés. |
| **Créer ma trace** | Choisir → Compte (18+, e-mail et code à six chiffres en ligne, un mot du créateur du musée et findahelpline.com) → Identité (nom affiché, pays choisi dans la liste de tous les pays, couleur GRIS, matière avec les flèches ← →) → 4 questions (1200 / 200 caractères, « Qui ? » facultatif pour la deuxième) → Aperçu → Enrichir → Vérifier (scellement, protection des données) → **Sceller et publier**. Parcours « mémoire pour une personne décédée » : la personne, ton prénom et ton lien avec elle, « sa bulle », puis « Que peux-tu me dire sur cette personne ? » (500 caractères). Avec deux bulles déjà publiées : « Tu as déjà tes deux bulles ». |
| **L’espace du fondateur** (`/admin`, en ligne) | État du musée, signalements (reçus aussi par e-mail), traces (retirer la bulle, bannir, retirer un fragment ou un fichier ; les choix de confidentialité de chacun), œuvre commune, comptes et rôles, adresses bannies, éditions d’archives (figer), journal, export. |
| **Compte** (`/compte`) | Entrer avec son e-mail et un code à six chiffres (en ligne) ; « Mes traces » (sa trace, puis la mémoire) et leurs rubriques à compléter ; l'adresse e-mail et son changement (confirmé par un code) ; les choix de confidentialité (jamais scellés, un clic) ; la protection des données (écrire au fondateur pour consulter, modifier ou supprimer). |
| **Menu** | Dock centré en bas : Explorer, Se perdre, Créer ma trace, L'œuvre commune (la page où l'on est disparaît du dock), Menu → Le projet, Compte, Archives, Ressources & aide, Soutenir, Juridique. |

## Direction artistique — où elle vit dans le code

- **Couleurs des bulles : GRIS uniquement** — `src/lib/palette.ts`, 30 teintes reprises telles
  quelles de [GRIScolors](https://github.com/scpederzani/GRIScolors) (5 familles × 6).
- **Bulles** (aquarelle + papier + tissu + fil fusionnés) — `src/engine/bubbleSprite.ts`.
  Même taille pour toutes, chaque bulle unique et reproductible.
- **Mouvement** (promenade autonome, évitement doux, pas d'orbite ni de rebond, espace sans bords) —
  `src/engine/constellation.ts`.
- **Fond vivant** (lin + nappes de pigment façon Monet, très lent) — `src/engine/atmosphere.ts`.
- **Typographie** : une seule police, Newsreader ; la hiérarchie vient de la taille, de la graisse et de
  l'italique (les mots des personnes en italique). Les écritures qu'elle ne dessine pas prennent IBM Plex
  (arabe, hébreu, devanagari, thaï, cyrillique, grec) ou la police du système (japonais, chinois, coréen) :
  `src/styles/tokens.css`.
- **Alphabet brodé** (les 200 caractères) : les lettres d'IBM Plex Sans cousues en contour au point avant
  (planches Higgsfield découpées par `design/hd/alphabet.py … plex` → `public/hd/alphabet.webp` +
  `src/data/alphabet.json`), composant `TexteBrode` : minuscules, capitales, chiffres, ponctuation et les
  lettres accentuées des langues latines (é è ê ë à â ä á ã å ç î ï í ô ö ó õ û ü ú ù ñ ß œ æ ø). Toute autre
  écriture (arabe, hébreu, cyrillique, grec, hindi, thaï, chinois…) s'écrit en IBM Plex Sans, couleur du fil,
  un mot toujours d'un seul tenant (liaisons et sens de lecture respectés). Le premier abécédaire, écrit à
  la main, reste reproductible (`alphabet.py … main`). Un mot sans fin se coupe : rien ne sort du cadre.
- **Icônes brodées** : les symboles des rubriques et des questions (`public/hd/icones`) ; les icônes
  d'interface restent au trait.
- **Logo brodé** : détouré depuis la photo du tableau, fibres et points conservés, bordeaux
  réservé au logo. Version sur une ligne recomposée lettre par lettre (`design/logo/logo_ligne.py`),
  version trois lignes d'origine conservée dans `design/logo/`. À refaire depuis le scan définitif.

## Matières HD (Higgsfield)

Couche optionnelle, activée par `HD` dans `src/lib/hd.ts` (mettre `false` pour revenir au rendu
entièrement procédural). Si un fichier manque, le site revient seul au rendu procédural.

- **Fond d'Explorer** : peinture 4K (et sa boucle vivante, ci-dessous). **Partout ailleurs** (profil, salles,
  Se perdre, Créer, pages) : le papier de la carte d'aperçu, ivoire dense avec les fibres du papier chiffon,
  posé sur un tissu de coton qui transparaît à peine ; aucune bulle derrière. La constellation s'efface par
  un fondu et son moteur (comme le shader des nappes) s'arrête hors de l'Explorer.
- **Lin HD** raccordable, par-dessus tout, très discret.
- **Bulles** : leur matière vient de vraies taches d'aquarelle, rien d'autre (planches 3 × 3 générées en
  4K, découpées par `design/hd/matieres.py`) : 92 comportements de l'eau tous différents — lavis et
  dégradés, auréoles et lignes de marée, mouillé sur mouillé, granulation et sel, glacis, retraits de
  lumière, lavis presque blancs, fleurs d'eau, aquarelle bue par le coton —, teintés dans la couleur
  GRIS exacte de chaque personne. Chaque bulle se reconnaît d'un coup d'œil, même en petit.
- **Fond vivant d'Explorer** : boucle de 15 s générée en 4K (Kling) qui part du fond peint et y
  revient, raccord fondu sur une demi-seconde ; les nappes coulent et respirent, lentement mais
  visiblement. Livrée en 2560 ou 1920 px selon l'écran, en AV1, VP9 puis H.264 ; la peinture fixe
  s'affiche d'abord, la vidéo ne se charge qu'une fois la page prête et se met en pause quand
  l'onglet est caché ; image fixe sur téléphone ou en mode économie de données.
- **Entrer dans sa mémoire** : une vraie goutte d'aquarelle filmée en 4K sur papier (Kling), réduite
  à un masque de 1440 px (`design/hd/masque_encre.py` : papier soustrait, intérieur en lavis égal,
  bord capillaire, tache recentrée), s'ouvre depuis la bulle cliquée dans sa couleur GRIS exacte.
- **Matière des bulles** : chacun la choisit en créant sa trace, avec les flèches de chaque côté de sa
  bulle : l'**aquarelle cousue** (matière 0, la première bulle du musée, peinte par le moteur : voiles
  d'aquarelle, papier, fil au point avant sur le bord), puis les 100 taches d'aquarelle (planches
  Higgsfield découpées par `design/hd/matieres.py`) : 101 façons de donner une matière à son âme.
  Une matière est proposée d'avance au hasard ; les présences sans choix gardent une matière tirée de
  leur identifiant, fixe.
- **Papier fait main** (chiffon de coton) : seules les fibres, en calque translucide, sur les pages et les
  panneaux qui s'ouvrent (aperçu, menu, recherche, Se perdre, salles des rubriques, visionneuse).

Préparation des images : `python3 design/hd/preparer.py fond|lin|papier …`, matières des bulles :
`python3 design/hd/matieres.py 1 planche.png[:cases écartées] …` (voir l'en-tête des scripts).

## Accessibilité & performance

- Constellation et mouvement toujours présents (choix du projet) ; si le système demande de réduire
  les animations, les bulles ralentissent sans s'arrêter.
- Au clavier : flèches pour se déplacer dans la constellation, `+`/`-` pour s'approcher.
- Fond rendu en basse résolution à cadence réduite ; bulles générées progressivement avec un budget
  de temps par image ; moins de bulles sur mobile.

## Le serveur (`server/`)

Fastify + PostgreSQL + stockage des fichiers sur disque ou S3, en TypeScript. Entrée par un code
à six chiffres envoyé par e-mail (sans mot de passe), règles du musée appliquées côté serveur (18+, deux bulles, scellement
de cinq ans, limites par rubrique, un trait par personne et par appareil, vérification du type
réel des fichiers), signalements et modération, éditions d'archives figées, journal de toutes les
décisions, export et effacement des données, retrait de bulle et bannissement. L'espace du fondateur est dans le site, à
`/admin`. Tout est décrit dans [DEPLOIEMENT.md](DEPLOIEMENT.md).
