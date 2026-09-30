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
| **Créer ma trace** | Choisir → Compte (18+) → Identité (couleur GRIS au choix) → 4 questions (1200 / 200 caractères, sans texte d'accompagnement) → Aperçu → Enrichir → Vérifier → Publier. Brouillon privé enregistré automatiquement. Parcours distinct « mémoire pour une personne décédée » (sans les 4 questions). |
| **Menu** | Dock centré en bas : Explorer · Se perdre · Créer ma trace · Menu → Le projet, Archives, Carte du monde, Ressources & aide, Soutenir, Juridique & confidentialité, Compte, Accessibilité & affichage. |

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
  réservé au logo — `public/brand/`. Script de détourage et PNG haute définition : `design/logo/`.
  À remplacer par le scan définitif du tableau en relançant le script.

## Accessibilité & performance

- `prefers-reduced-motion` respecté, plus un réglage manuel (Menu → Accessibilité & affichage).
- Constellation désactivable ; au clavier : Tab jusqu'à la constellation, flèches pour se déplacer,
  `+`/`-` pour s'approcher, Entrée pour rencontrer la présence la plus proche du centre.
- Fond rendu en basse résolution à cadence réduite ; bulles générées progressivement avec un budget
  de temps par image ; moins de bulles sur mobile.

## Suite prévue (cahier des charges, Bloc 10)

Le cahier retient Next.js / TypeScript + PixiJS + PostgreSQL. Ce premier jet est en React + Vite
pour pouvoir être prévisualisé partout sans serveur ; les composants se portent tels quels dans
Next.js lorsque l'API, les comptes et le stockage des médias seront branchés.
