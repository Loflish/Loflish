# Nos mots mémoriaux — premier jet du site

Un musée vivant où chacun peut laisser sa trace : ses dernières volontés, ses mots, ses souvenirs.
Ce dépôt contient le **premier jet front-end** construit à partir du cahier des charges maître
(conversation de conception) et de la **nouvelle direction artistique**.

> Prototype : les présences affichées sont des **données de démonstration**. En production,
> aucune fausse bulle (cahier des charges, Bloc 3A).

## Lancer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build statique dans dist/ (chemins relatifs, hébergeable partout)
```

## Ce qui est en place

| Surface | Contenu |
| --- | --- |
| **Explorer** (`/`) | Constellation plein écran : fond pictural vivant, bulles qui se promènent, survol = nom seul, clic = aperçu (les 200 caractères), « Entrer dans sa mémoire » = transition douce vers le profil, retour au même endroit. Recherche et filtres discrets. |
| **Se perdre** | Une présence à la fois, hasard équitable, glisser / boutons / flèches, aucun signal de popularité. |
| **Profil** (`/trace/:id`) | Architecture « Proposition A révisée » : une seule zone bulle, identité, type de trace, pays, dates clés ; les 4 questions obligatoires ; les 12 fragments d'existence ; médias & documents ; historique des versions ; paramètres non publics (vue auteur). Chaque rubrique s'ouvre en « salle » (5 éléments mis en avant, puis « Tout voir »). Profil de référence : `/trace/sakinah`. |
| **Ma trace** (`/ma-trace`) | L'espace de l'auteur : voir son profil, retrouver sa bulle dans le musée, compléter ses 12 rubriques (texte, dates, lieux, photos). Dans la constellation, sa propre bulle est entourée d'un fil « ta trace », visible uniquement sur son appareil. |
| **Créer ma trace** | Choisir → Compte (18+) → Identité (couleur GRIS au choix) → 4 questions (1200 / 200 caractères, sans texte d'accompagnement) → Aperçu → Enrichir → Vérifier → Publier. Brouillon privé enregistré automatiquement. Parcours distinct « mémoire pour une personne décédée » (sans les 4 questions). |
| **Menu** | Dock centré en bas : Explorer · Se perdre · Créer ma trace (devient « Ma trace » une fois publiée) · Menu → Le projet, Archives, Carte du monde, Ressources & aide, Soutenir, Juridique & confidentialité, Compte. |

## Direction artistique — où elle vit dans le code

- **Couleurs des bulles : GRIS uniquement** — `src/lib/palette.ts`, 30 teintes reprises telles
  quelles de [GRIScolors](https://github.com/scpederzani/GRIScolors) (5 familles × 6).
- **Bulles** (aquarelle + papier + tissu + fil fusionnés) — `src/engine/bubbleSprite.ts`.
  Même taille pour toutes, chaque bulle unique et reproductible.
- **Mouvement** (promenade autonome, évitement doux, pas d'orbite ni de rebond, espace sans bords) —
  `src/engine/constellation.ts`.
- **Fond vivant** (lin + nappes de pigment façon Monet, très lent) — `src/engine/atmosphere.ts`.
- **Aplats nabis** (couleur plate au bord irrégulier) — composant `Aplat` dans `src/components/Media.tsx`.
- **Typographies** : Newsreader (expressive) + Manrope (fonctionnelle) — `src/styles/tokens.css`.
- **Logo brodé** : détouré depuis la photo du tableau, fibres et points conservés, bordeaux
  réservé au logo. Version sur une ligne recomposée lettre par lettre (`design/logo/logo_ligne.py`),
  version trois lignes d'origine conservée dans `design/logo/`. À refaire depuis le scan définitif.

## Matières HD (Higgsfield)

Couche optionnelle, activée par `HD` dans `src/lib/hd.ts` (mettre `false` pour revenir au rendu
entièrement procédural). Si un fichier manque, le site revient seul au rendu procédural.

- **Fonds peints 4K**, un par espace (Explorer, profil, Créer ma trace, pages de texte), en format
  ordinateur et téléphone, en fondu enchaîné sous l'atmosphère vivante.
- **Lin HD** raccordable, par-dessus tout, très discret.
- **Bulles** : leur matière vient de vraies taches d'aquarelle (planches générées en 4K, plusieurs
  techniques : mouillé, granulation, sur lin, auréole séchée, fleurs d'eau, glacis, pinceau sec),
  teintées dans la couleur GRIS exacte de chaque personne.
- **Carte** : les océans sont une aquarelle d'eau peinte.
- **Fond vivant d'Explorer** : boucle vidéo (Kling) qui part du fond peint et y revient, lumière qui
  respire à peine ; image fixe sur téléphone ou en mode économie de données.
- **Entrer dans sa mémoire** : une vraie tache filmée (Kling), réduite à un masque
  (`design/hd/masque_encre.py`), s'ouvre depuis la bulle cliquée dans sa couleur GRIS exacte.
- **Matière des bulles** : tirée au hasard pour chaque personne, jamais choisie, et fixe.

Préparation des images : `python3 design/hd/preparer.py fond|lin|taches …` (voir l'en-tête du script).

## Accessibilité & performance

- Constellation et mouvement toujours présents (choix du projet) ; si le système demande de réduire
  les animations, les bulles ralentissent sans s'arrêter.
- Au clavier : Tab jusqu'à la constellation, flèches pour se déplacer,
  `+`/`-` pour s'approcher, Entrée pour rencontrer la présence la plus proche du centre.
- Fond rendu en basse résolution à cadence réduite ; bulles générées progressivement avec un budget
  de temps par image ; moins de bulles sur mobile.

## Suite prévue (cahier des charges, Bloc 10)

Le cahier retient Next.js / TypeScript + PixiJS + PostgreSQL. Ce premier jet est en React + Vite
pour pouvoir être prévisualisé partout sans serveur ; les composants se portent tels quels dans
Next.js lorsque l'API, les comptes et le stockage des médias seront branchés.
