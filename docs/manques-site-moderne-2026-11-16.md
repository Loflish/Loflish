# Ce qui manque à un site moderne de ce genre (16 novembre 2026)

Recherche faite sur des sources de référence (Google Search, web.dev, Chrome, MDN, W3C) et sur des sites comparables
ouverts pour l'occasion. Chaque manque est confronté au code du site : ce qui existait déjà est retiré de la liste.

## Fait pendant cette séance

| Ajout | Ce que ça change | Preuve |
|---|---|---|
| Le code d'une page arrive dès qu'on approche de son lien | La page s'ouvre sans attendre le réseau | `src/lib/prechargement.ts` |
| La recherche se prépare en arrière-plan | Ouverture : 320 ms → 208 à 264 ms selon les passes (processeur ralenti ×4 ; une passe à 424 ms, machine chargée) : encore un peu au-dessus du seuil « bon » de 200 ms | `npm run controles:fluidite` |
| L’œuvre commune ne recoud plus tous les traits à chaque toucher | Poser un point : 208 ms → 48 à 64 ms | idem |
| Mode « couleurs forcées » de Windows | Boutons, champs et panneaux gardent un bord quand le système retire les images de fond | `src/styles/linge-fusion.css` |

Déjà en place, vérifié dans le code : champ du code de connexion (`autocomplete="one-time-code"`), mise en page
qui tient à 320 px, cibles tactiles d'au moins 24 px, texte de remplacement des photos déposées (légende ou titre),
réglage « contraste renforcé » du système.

## À décider par Tom (classé du plus utile au moins utile)

| N° | Manque | Ce que ça apporte | Effort | Ce que ça te demande | Source |
|---|---|---|---|---|---|
| 1 | De vraies adresses par page, au lieu du « # », avec un aperçu de partage par personne | Un lien partagé montre le nom et la bulle de la personne ; les pages peuvent être trouvées par Google | Moyen | Une décision : les mémoires doivent-elles être trouvables par un moteur de recherche ? | [Google, JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) |
| 2 | Lecture hors ligne des mémoires déjà ouvertes | Relire une trace sans réseau (train, campagne) | Moyen | Rien | [MDN, applications web progressives](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) |
| 3 | Transcription des sons et sous-titres des vidéos déposés | Les mémoires deviennent accessibles aux personnes sourdes | Moyen | Un texte : la consigne au moment du dépôt | [WCAG 2.2, 1.2.1 et 1.2.2](https://www.w3.org/WAI/WCAG22/quickref/) |
| 4 | Inviter un proche à compléter une mémoire | Une mémoire écrite à plusieurs | Grand | Une décision et des textes | Vu sur forevermissed.com (page d'accueil seulement) |
| 5 | Une carte imprimable de sa bulle, un guide « retrouver une bulle » | Un objet à garder, à offrir | Petit à moyen | Un texte | Vu sur [aidsmemorial.org](https://www.aidsmemorial.org/interactive-aids-quilt) |
| 6 | Plan du site et données structurées par page | Meilleure présentation dans Google | Petit | Dépend du n° 1 | [Google, plans de site](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) |
| 7 | Une seconde langue d'interface | Les familles non francophones | Grand | Des traductions | WCAG 3.1.1 |
| 8 | Mesurer la réactivité réelle chez les visiteurs | Corriger les lenteurs qu'on ne voit pas ici | Petit | Une décision : c'est une exception à « aucune mesure d'audience » | [web.dev, INP](https://web.dev/articles/inp) |

## À ne pas ajouter à un site de mémoire, même si c'est « moderne »

- Notifications et rappels d'anniversaire par défaut : ils ravivent le deuil sans avoir été demandés.
- Compteurs de vues, « j'aime », bulles « populaires » : ils classent les morts.
- Une intelligence artificielle qui fait parler la personne ou résume sa mémoire : elle trahit la parole déposée.
- Lecture automatique des sons et des vidéos.
- Traceurs tiers, boutons de réseaux sociaux embarqués, invite d'installation insistante.

## Ce qui n'a pas pu être vérifié

- Les fonctions exactes de forevermissed.com, inumeraveis.com.br et queeringthemap.com (seules la page d'accueil
  ou les métadonnées ont été lues).
- L'avis sur l'intelligence artificielle qui fait parler les morts n'a pas de source : c'est un jugement.
- La fluidité des fils sur un vrai téléphone : la machine de mesure n'a pas de carte graphique.
