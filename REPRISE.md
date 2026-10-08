# Reprendre Nos Mots Mémoriaux

Point de reprise du 8 octobre 2026. Ce dépôt contient le site actuel, son serveur,
les six matières déjà intégrées et les fichiers nécessaires pour retrouver la
progression artistique. Il ne constitue pas un export complet des conversations
privées ni des données d'un éventuel service en ligne.

## Commencer une nouvelle conversation

Donne le dépôt `https://github.com/Loflish/Loflish` et ce message :

> Reprends Nos Mots Mémoriaux depuis la dernière version de la branche
> claude/practical-newton-r1t0oq. Lis REPRISE.md, AGENTS.md et CLAUDE.md avant de
> travailler. Retrouve les décisions dans design/suivi/2026-10-08/etat.json.
> Propose-moi la suite ; je tranche les décisions.

Lire le dépôt public ne nécessite pas de connexion au compte. Pour y envoyer une
nouvelle version, la session qui travaille doit avoir un accès autorisé à GitHub.
La connexion à GitHub ne remplace pas la lecture de ces fichiers.

## Objectif et décisions à préserver

Le prochain jalon est une version personnelle très aboutie. La direction
artistique actuelle plaît au créateur : aquarelle, papier, textile, douceur,
palette GRIS, logo et fil brodés. Chaque bulle garde le fil actuel, qui est une
signature. Le créateur souhaite une taille commune et un zoom global.

Ordre décidé : matières des bulles, puis fond et autres éléments visuels,
puis fonctionnement et serveur. Proposer des comparatifs et de petites séries
de questions pour que le créateur puisse trancher sans se perdre.

Les nouvelles matières doivent apporter davantage de singularité sans diminuer
la qualité ou la douceur. Les motifs figuratifs explicites tels qu'une feuille
de ginkgo ont été peu appréciés dans les propositions ; cela ne prouve pas le
rejet de toutes les matières appartenant à une même famille.

Le travail artistique a été arrêté le 8 octobre parce que le créateur se sentait
perdu dans la conversation. La nouvelle demande autorise la sauvegarde sur
GitHub. Le projet n'est ni achevé ni déclaré satisfaisant. Attendre une nouvelle
demande avant de reprendre les évolutions artistiques.

## Ce qui est déjà intégré dans le site

| Numéro | Matière | Validation |
| --- | --- | --- |
| 70 | Voile superposé | Résultat et remplacement validés le 5 octobre |
| 81 | Pastel frotté | Résultat et remplacement validés le 5 octobre |
| 85 | Papier gaufré | Résultat et remplacement validés le 5 octobre |
| 15 | Fibres libres | Résultat et remplacement validés le 8 octobre |
| 50 | Encre capillaire | Résultat et remplacement validés le 8 octobre |
| 95 | Coton froissé | Résultat et remplacement validés le 8 octobre |

Les PNG transparents de 512 pixels sont dans `public/hd/taches/`. Les anciens
WebP sont conservés. Le moteur lit ces six PNG dans un canvas pour préserver le
rendu approuvé. Le catalogue garde 100 textures et la matière procédurale 0,
soit 101 choix. La palette, le fil et les autres dessins ne sont pas modifiés.

## Lot 04, conservé mais pas intégré

| Candidate proposée | Essai conservé | État actuel |
| --- | --- | --- |
| 01 | Réserves diffuses | Garder sous condition de singularité |
| 19 | Feutre nuagé | Garder sous condition de singularité |
| 76 | Pigment sédimenté | Garder sous condition de singularité |

Dernier choix : garder les trois à condition qu'ils se distinguent aussi des
autres matières. La comparaison complète de singularité a été interrompue.
Les correspondances ci-dessus restent des propositions de remplacement.
Ne pas les intégrer automatiquement et ne pas reprendre une génération payante.

Les originaux de 2048 × 2048 pixels, les briefs et les comparatifs sont dans
`design/suivi/2026-10-08/`. Les neuf originaux des lots 02, 03 et 04 sont conservés.
Le fil des aperçus est celui du site. Réserves diffuses contient également un
bord cousu produit dans l'image originale ; ce détail a été signalé au créateur.

## Documents utiles

- [État et décisions structurés](design/suivi/2026-10-08/etat.json).
- [Les 101 avis initiaux](design/suivi/2026-10-08/avis-initiaux.json).
- [Bilan actuel](design/suivi/2026-10-08/Bilan_matieres_2026-10-08.html).
- [Comparatif du lot 04](design/suivi/2026-10-08/Resultats_matieres_lot_04.html).
- [Audit initial à reprendre](design/suivi/2026-10-08/AUDIT_A_REPRENDRE.md).
- [Inventaire vérifiable](design/suivi/2026-10-08/inventaire.json).
- [Contrôles avant sauvegarde](design/suivi/2026-10-08/verification.json).

Le bilan des matières actives est de 60 à garder, 30 à affiner et 11 qui plaisent
moins. Les trois essais non intégrés du lot 04 ne changent pas ces nombres.
Les avis initiaux sont historiques et ne suffisent pas à déduire la cause précise
de chaque préférence.

## Limites et questions encore ouvertes

- Les animations de sélection, d'entrée et de respiration du site appliquent
  encore des variations individuelles de taille. Les comparatifs utilisent un
  zoom commun ; ils ne corrigent pas ces animations. Ce point reste à proposer.
- Le rendu sur téléphone réel, la connexion, les e-mails, les données de
  production et une restauration réelle de base ne sont pas validés.
- Les tests d'intégration du serveur ne démarrent pas sur cet ordinateur : leur
  préparation attend PostgreSQL sous Linux, absent de l'environnement Windows.
- Les constats de l'audit du 2 octobre restent des travaux proposés, pas une liste
  de corrections effectuées. L'ordre choisi ensuite par le créateur prévaut.
- Les offres et le coût Higgsfield doivent être revérifiés avant toute future
  génération. Une ancienne autorisation ne couvre pas un nouveau lot.

## Lancer la copie récupérée

Node.js 22 ou plus récent est requis pour le serveur. Pour l'aperçu autonome :

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Pour consulter les fiches de comparaison après cette installation :

```sh
npm exec -- vite design/suivi/2026-10-08 --host 127.0.0.1 --port 5180
```

Ouvrir ensuite `http://127.0.0.1:5180/Resultats_matieres_lot_04.html`.
Les dépendances installées ne sont pas sauvegardées dans Git : les fichiers
`package-lock.json` permettent de les réinstaller. Pour une vraie mise en ligne,
lire `DEPLOIEMENT.md` ; une sauvegarde du code n'est pas un déploiement du service.
