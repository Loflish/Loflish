# Nos mots mémoriaux — feuille de route

Version 0.2 du 8 octobre 2026 — cadrage confirmé et premier état initial. Ce document concerne uniquement cette conversation et le dépôt indiqué par son propriétaire. Aucun autre chat n'a été consulté.

## 1. Cadrage de la recherche

**But :** sélectionner les ressources adaptées au musée, définir le parcours jusqu'au premier lancement et rendre explicites les décisions manquantes. La recherche est exploratoire ; la sélection est étayée par des sources primaires, mais les outils proposés n'ont pas été installés ni évalués sur le site.

**Périmètre / objet / sujets :** préparation d'un musée participatif sur le web / qualité artistique et technique de Loflish/Loflish / ressources de conception, documentation, tests et sécurité compatibles avec son architecture déclarée.

**Questions :** Q1 : quelle compatibilité avec le projet ? Q2 : quel bénéfice concret et comment le vérifier ? Q3 : quels accès et coûts restent à établir ? Q4 : quels ajouts seraient inutiles ou prématurés ?

### Décisions exprimées dans cette conversation

- Le musée doit permettre de partager ses derniers mots de plusieurs façons, de découvrir les paroles des autres et de participer.
- Le créateur précise que « matérialiser » signifie ici proposer des profils de dernières volontés que l'on peut visiter dans le musée. Une réalisation physique n'est pas un objectif demandé dans cette conversation.
- La direction artistique actuelle plaît au créateur et constitue la base à affiner.
- Références : couleurs de GRIS, peintures de Claude Monet, mouvement des Nabis, travail de Ruth Rae.
- Ordre demandé : ressources et clarification ; rendement des visuels Higgsfield ; audit et optimisation du frontend et du backend ; préparation du lancement.
- Le travail et les échanges restent dans cette conversation.
- Le processus en sept étapes est accepté.
- Priorités visuelles confirmées : constellation, variété des matières des bulles et couleurs ; les autres pages restent dans le périmètre.
- Premier jalon confirmé : démonstration à faire découvrir à la famille et aux amis, avant l'ouverture aux contributions réelles.
- Les règles de la question 7 sont confirmées comme actuelles : contribution réservée aux majeurs, trace personnelle et mémoire d'un défunt, scellement de cinq ans.
- Hébergement, domaine et budget d'exploitation : pas encore décidés.

### État des vérifications

- Lecture du dépôt public : réalisée sur le Web pour son README, les deux manifestes de dépendances et son guide de déploiement.
- Copie locale récupérée sur la branche `claude/practical-newton-r1t0oq`, commit `33956a0b7f6a065b5179373d2f4f16d90a44ffdb`. Aucun fichier AGENTS.md ou CLAUDE.md présent dans cette copie ; le dernier commit a retiré les consignes destinées à une IA.
- Dépendances frontend installées depuis le verrouillage existant ; vérification TypeScript et compilation du prototype réussies. La connexion au registre a nécessité les certificats de confiance de Windows, sans désactivation de TLS.
- Prévisualisation locale ouverte ; constellation observée sur ordinateur et à 390 × 844 ; parcours « Se perdre → Ouvrir la trace » parcouru sur petit écran. Aucune erreur ou alerte relevée dans le relevé de console initial. Cela ne vaut pas audit exhaustif.
- Revue exhaustive, essais du serveur, mesures de performance et contrôles d'accessibilité : à faire.
- Ressources externes : documentations et dépôts officiels consultés ; bénéfice pratique à vérifier sur le projet.
- Aucun changement du code produit, installation de plugin, génération Higgsfield ou déploiement public réalisé. Des dépendances locales ont été installées pour la prévisualisation.
- Higgsfield accessible dans le navigateur intégré : formule Plus, 574 crédits affichés lors de la consultation. Échéance et plafond affecté au musée non confirmés ; zéro génération soumise.

## 2. Sources de référence

| Priorité | Sources | Utilité |
|---|---|---|
| 1 | Dépôts et documentation des mainteneurs : Microsoft, Vercel, Anthropic, Upstash, GitHub, Fastify, Deque, Google | Capacités déclarées et limites des outils |
| 2 | OWASP ASVS | Référentiel de vérification de la sécurité |
| 3 | Fichiers accessibles de Loflish/Loflish et inventaire des outils de cette session | Compatibilité et accès effectivement disponibles |
| 1, artistique | Écrits de Ruth Rae sur son propre blog | Comprendre une référence fournie par le créateur |

Les classements de popularité et les promesses de qualité sans preuve ne déterminent pas la sélection.

## 3. Registre des constats

| Réf. | Constat étayé | Source | Portée |
|---|---|---|---|
| F1 | Le frontend déclare React 18, Vite et TypeScript. | [Manifeste frontend](https://github.com/Loflish/Loflish/blob/claude/practical-newton-r1t0oq/package.json) | Dépendances déclarées, installation non exécutée ; Q1 |
| F2 | Le serveur déclare Fastify, PostgreSQL via pg, et Vitest pour les tests. | [Manifeste serveur](https://github.com/Loflish/Loflish/blob/claude/practical-newton-r1t0oq/server/package.json) | Présence d'un dispositif déclarée, résultats inconnus ; Q1 |
| F3 | Le dépôt décrit deux modes, prototype et connecté au serveur, ainsi que des ressources visuelles et des scripts de préparation existants. | [README](https://github.com/Loflish/Loflish) | Documentation du projet, fonctionnement non vérifié ; Q1, Q4 |
| F4 | Vercel propose des guides de performance React/Next.js et de qualité des interfaces. | [Agent Skills](https://github.com/vercel-labs/agent-skills) | Filtrer les conseils selon le framework et la version ; Q1, Q2 |
| F5 | Le skill frontend-design demande de partir du sujet et de respecter la direction donnée dans le brief. | [Frontend Design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | Aide à la conception, aucun résultat esthétique garanti ; Q2 |
| F6 | Playwright permet les tests dans Chromium, Firefox et WebKit. | [Playwright](https://github.com/microsoft/playwright) | Les scénarios et critères doivent être écrits pour ce musée ; Q2 |
| F7 | axe-core automatise une partie des contrôles d'accessibilité ; une revue manuelle reste nécessaire. | [axe-core](https://github.com/dequelabs/axe-core) | Un résultat automatique ne certifie pas l'accessibilité complète ; Q2 |
| F8 | Lighthouse produit des audits automatisés de qualité web, dont la performance. | [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) | Mesures dans les conditions du test, pas une validation de tous les usages ; Q2 |
| F9 | ASVS fournit un référentiel de vérification de la sécurité des applications. | [OWASP ASVS](https://owasp.org/projects/asvs) | Référentiel à appliquer ; ce n'est pas un scanner ni un résultat d'audit ; Q2 |
| F10 | Fastify documente le test des applications, notamment l'injection de requêtes. | [Tests Fastify](https://fastify.dev/docs/latest/Guides/Testing/) | Méthode à adapter à la version installée et à la base réelle de test ; Q1, Q2 |
| F11 | Context7 fournit un accès à de la documentation de bibliothèques et propose une sélection par version. | [Context7](https://github.com/upstash/context7) | Couverture de chaque version à vérifier ; accès non connecté ici ; Q2, Q3 |
| F12 | Le serveur MCP officiel GitHub peut limiter ses outils et fonctionner en lecture seule. | [Configuration GitHub MCP](https://github.com/github/github-mcp-server/blob/main/docs/server-configuration.md) | Option d'intégration, inutile pour simplement lire ce dépôt public ; Q3, Q4 |
| F13 | Superpowers organise cadrage, plans, tests et développement avec des agents. | [Superpowers](https://github.com/obra/superpowers) | Méthode supplémentaire, bénéfice propre à ce projet non démontré ; Q4 |
| F14 | Le serveur Playwright MCP utilise notamment des représentations structurées des pages ; ses auteurs décrivent aussi une alternative CLI avec skills. | [Playwright MCP](https://github.com/microsoft/playwright-mcp) | Éviter d'ajouter plusieurs systèmes de contrôle du navigateur sans besoin identifié ; Q4 |
| F15 | Ruth Rae décrit des poèmes et des passages de journal cousus dans une robe. | [Red Thread Journal Dress](https://ruthrae.blogspot.com/2012/04/red-thread-journal-dress.html) | Référence artistique consultée ; préférence pour cette œuvre précise non confirmée |
| F16 | Le guide du projet décrit comptes, publication, médias, modération, sauvegardes et restauration. | [Déploiement](https://github.com/Loflish/Loflish/blob/claude/practical-newton-r1t0oq/DEPLOIEMENT.md) | Points à auditer, pas fonctions certifiées opérationnelles ; Q1 |

**Accès et coûts ouverts :** les skills locaux de recherche, Higgsfield et revue React sont accessibles. Aucun connecteur autonome Higgsfield, GitHub MCP, Context7 ou de recherche du catalogue des plugins n'est exposé dans cette session. Le navigateur intégré permet cependant d'accéder au compte Higgsfield, dont le menu affiche Plus et 574 crédits. Des capacités WebMCP de navigation créative y ont également été observées, sans soumission. L'échéance, les avantages applicables et les prix des essais ne sont pas encore confirmés. Le dépôt a été récupéré par Git après autorisation réseau ; aucun refus d'approbation n'a été reçu.

## 4. Filtre de périmètre

La sélection se limite aux ressources capables d'aider ce musée. Les constructeurs de sites complets et les changements d'hébergement ne sont pas retenus à ce stade : aucun besoin établi ne justifie une reconstruction. Les scans automatisés sont des composants de l'audit et ne remplacent pas la lecture du code, les essais réels ou l'appréciation artistique.

## 5. Filtre propre au projet

- F4 est limité aux règles compatibles avec React 18 et Vite. Les recommandations propres à Next.js, à son hébergement ou à des API React plus récentes ne s'appliquent pas automatiquement.
- F5 sert à affiner l'identité aimée par le créateur. Les préférences génériques d'un skill ne priment pas sur cette identité.
- F6 à F8 doivent couvrir la constellation animée et les parcours du musée, avec des inspections visuelles et manuelles en complément des contrôles du HTML.
- F10 doit compléter le dispositif déjà déclaré en F2, après lecture des tests existants.
- F11 et F12 restent des options de connexion. L'accès aux documentations officielles et au dépôt public permet déjà d'avancer.
- F13 n'est pas recommandé comme prérequis. Ajouter une méthode d'orchestration complète exige un bénéfice concret et une compatibilité avec ce cadre de travail.

## 6. Sélection recommandée

| Ressource | Usage proposé | Condition d'adoption |
|---|---|---|
| Guides React et web-design-guidelines de Vercel | Performance, formulaires, navigation, clavier, états de l'interface | Seulement les règles compatibles et utiles ; F1, F4 |
| Frontend Design d'Anthropic | Relecture artistique et cohérence des composants | Respect du brief et comparaison visuelle avec l'existant ; F5 |
| Playwright + axe-core | Tests des parcours, captures de comparaison et contrôles d'accessibilité | Scénarios représentatifs, contrôles manuels complémentaires ; F6, F7 |
| Lighthouse | Mesurer chargement, ressources et régressions de performance | Conditions reproductibles, comparaison avant/après ; F8 |
| Tests existants, Fastify, base PostgreSQL de test, ASVS | Vérifier règles métier, autorisations, fichiers et conservation des données | Lecture du serveur puis matrice de tests adaptée ; F2, F9, F10, F16 |
| Context7 | Faciliter la consultation des bonnes documentations | Option utile si l'intégration fonctionne dans cette conversation ; F11 |
| GitHub MCP | Faciliter ultérieurement l'examen des changements et contrôles GitHub | Accès limité au besoin ; lecture publique déjà suffisante pour le cadrage ; F12 |

**Higgsfield :** la première ressource à exploiter est la bibliothèque déjà présente et ses méthodes de préparation (F3). Le choix des modèles, résolutions et lots dépendra du besoin visuel et des conditions réelles du compte. Aucun classement universel de modèles ni quota arbitraire n'est fixé.

## 7. Parcours complet et critères de fin

| Étape | Travail | Livrable et critère de sortie | État |
|---|---|---|---|
| 1. Ressources | Comparer les outils et identifier les accès | Sélection motivée, limites connues, compléments à préparer | Présélection réalisée ; connexions à vérifier selon le besoin |
| 2. Cadrage | Fixer V1, règles métier, références, budgets et cible de lancement | Liste claire des décisions, inconnues et critères de réussite | Objectif et démonstration confirmés ; budget des essais à fixer |
| 3. État initial | Figer une référence du dépôt, inventorier pages, routes, données et médias ; observer le site | Carte du projet et état initial mesuré | Copie, compilation et premiers parcours réalisés ; inventaire à approfondir |
| 4. Visuels Higgsfield | Trier l'existant, repérer les manques, préparer puis comparer de petits essais, intégrer les meilleurs | Visuels validés en contexte ; coûts et réutilisations tracés | Après cadrage artistique et budgétaire |
| 5. Audit complet | Examiner frontend, backend, infrastructure et parcours ; qualifier chaque défaut | Rapport relié aux fichiers et aux preuves, avec couverture et priorités | À faire |
| 6. Corrections | Corriger par lots cohérents et vérifier les régressions | Prévisualisation, résultats des contrôles, changements traçables | Selon résultats de l'audit |
| 7. Lancement | Rejouer les parcours essentiels et préparer exploitation, restauration et retour arrière | Décision de lancement motivée ; points restants explicitement acceptés | Après validation de la version candidate |

Le traitement artistique précède l'audit approfondi conformément à la demande. Si l'état initial révèle un blocage qui rendrait des générations inutiles, il sera expliqué avant d'engager ce budget.

### Méthode de rendement Higgsfield

1. Pour chaque visuel : emplacement, rôle, taille d'affichage, format et nombre d'utilisations.
2. Classer l'existant : conserver, optimiser, retoucher, remplacer, créer.
3. Préparer un brief commun et les critères de rejet : couleur, matière, lisibilité, découpe, raccord, mouvement, poids.
4. Comparer les méthodes pertinentes : réutilisation, déclinaisons, planches à découper, retouches, génération et animation. Une planche est utile seulement si ses éléments sont réellement récupérables avec une qualité suffisante.
5. Avant un lot consommant des crédits : présenter les essais, le coût affiché, le plafond et la règle d'arrêt pour accord.
6. Vérifier les résultats dans l'interface sur ordinateur et mobile avant de poursuivre.
7. Suivre les crédits dépensés par ressource retenue, la qualité, la couverture des besoins et les réutilisations. Le volume produit ne suffit pas à mesurer le rendement.

### Couverture attendue de l'audit

- Frontend : toutes les pages et principaux états, petits écrans, clavier, focus, lecteurs d'écran selon les moyens disponibles, contraste, réduction du mouvement, chargement et erreurs, liens partagés et référencement selon les choix de confidentialité.
- Visuels : cohérence artistique, lisibilité, poids, formats, résolution adaptée, réutilisation, animation et solutions de repli.
- Backend : toutes les routes et rôles recensés, authentification, sessions, validation, autorisations, règles métier, uploads, concurrence, erreurs, abus, intégrité des données et migrations.
- Exploitation : configuration, dépendances, secrets, e-mails, stockage, journaux utiles, sauvegardes hors serveur, essai de restauration, déploiement et retour arrière.
- Produit : contribution, lecture, signalement, modération, confidentialité, export et suppression selon les règles confirmées ; dispositif de prise en charge des signalements à définir.

**Définition proposée de “prêt” :** parcours essentiels vérifiés, absence de défaut bloquant connu non accepté, exigences artistiques approuvées, conditions de performance et d'accessibilité convenues contrôlées, restauration testée, exploitation et points restants documentés. Aucun pourcentage de perfection n'est promis. Le rapport indiquera précisément ce qui a été lu, exécuté, observé ou non vérifié.

## 8. Questions et risques ouverts

### Pour commencer le cadrage

1. La prévisualisation locale du dépôt représente-t-elle bien la version appréciée par le créateur ? Son origine Claude Code est confirmée ; aucune autre adresse d'aperçu n'a été fournie.
2. Les priorités visuelles sont connues. Les arbitrages esthétiques précis se feront sur des comparaisons visibles, sans demander au créateur de choisir des technologies.
3. Higgsfield : échéance des 574 crédits, avantages du compte et plafond du premier lot à établir. Le solde n'est pas une autorisation de le consommer.
4. Démonstration : date éventuelle, appareils prioritaires et langues. Le choix d'une découverte préalable aux contributions réelles est confirmé.
5. Hébergement, domaine, e-mails, stockage et budget mensuel à décider pour la suite ; ils ne bloquent pas l'examen local.

### À approfondir après les premières réponses

- Public initial, appareils, qualité de connexion et volume de contributions visé.
- Sensibilité des contenus, visibilité par défaut, présence dans les moteurs de recherche, conditions de retrait et organisation de la modération.
- Mise en œuvre de la conservation dans le temps.
- Mesures de réussite du lancement, personnes disponibles pour tester et temps de gestion quotidien.

Les informations de connexion seront demandées uniquement sous forme de liens ordinaires ou de connexion réalisée par le créateur dans l'interface officielle. Aucun mot de passe, code, jeton, cookie de session ni lien contenant un secret ne doit être envoyé dans la conversation.

## 9. Point de reprise

**Décision la plus récente — 9 octobre :** 100 % + pigments seuls sont validés provisoirement par le créateur. Il souhaite un mouvement lent dans toutes les taches et une boucle naturelle. Un nouvel essai local « Boucle douce » anime les zones peintes avec des phases décalées, cadre fixe, cycle de 72 secondes réglable de 48 à 120 secondes. Il utilise l'image du fond et préserve sa palette ; ce n'est pas une nouvelle vidéo Higgsfield. La vidéo originale reste disponible pour comparaison. Contrôles constatés : rendu visible, opacité 1, cadre immobile, absence d'erreurs navigateur, arrêt effectif en pause et réglage du cycle. Son naturel et son rendu dans la constellation complète restent à valider. Aucun crédit consommé et dépôt du site inchangé. Les orientations ci-dessous sont historiques et sont remplacées par cette décision en cas de contradiction.

**Dernier état :** variantes 90/95/100 % et cinq mouvements disponibles dans le prototype. Solde précis revérifié : 574,25 crédits mensuels, renouvellement annoncé le 29 octobre 2026 ; six offres d'image Unlimited actives, aucune vidéo dans la liste. Kling 3.0 en 5 s/720p affiche 10 crédits dans le brouillon consulté. Proposition de deux essais pour environ 20 crédits à confirmer après préparation et approbation, sans dépense à ce stade. Voir `Fond_mouvements_et_budget_Higgsfield.md` pour les briefs, les prix, les limites et les critères d'arrêt.

**Dernière orientation du 9 octobre :** le créateur souhaite un fond plus intense (80–85 %) et davantage de mouvement des pigments ET de dérive. Le prototype propose maintenant 70/80/85 %, la vidéo existante à vitesse normale ou 1,15×, une dérive de 140 ou 90 secondes, et Pause. La piste d'atténuation 55/40 % n'est plus prioritaire. Aucun réglage du site n'est modifié ; confirmation dans la constellation complète après choix sur le prototype.

**Mise à jour du 9 octobre 2026 :** comparateur des 101 matières livré et vérifié ; le créateur choisit 00, 81 et 95 comme références prioritaires. Un essai statique autonome compare ces trois matières sur le fond existant à 70 %, 55 % et 40 %, sans modifier le site. Détails et limites dans `Diagnostic_visuel_et_prochains_essais.md`. Aucun crédit Higgsfield consommé. Le quota renouvelé annoncé par le créateur concerne ChatGPT/Codex. Prochaine décision : intérêt artistique de l'ajustement du fond, à confirmer dans la constellation complète avant intégration.

**Fait :** ressources présélectionnées, processus accepté, cadrage principal confirmé, code récupéré à un commit précis, prototype compilé et ouvert, premiers parcours observés, solde Higgsfield consulté.

**Prochaine étape :** comparer les matières aux tailles réellement affichées, préparer des propositions de raffinement de la constellation et un premier lot Higgsfield chiffré si une génération est justifiée. La production visuelle attend les besoins et le plafond approuvés ; l'audit complet puis le feu vert de lancement viennent ensuite.

**Revue de cohérence effectuée par le même assistant :** capacités des outils distinguées de leur installation, déclarations du dépôt distinguées des tests, choix artistiques distingués des interprétations, coûts et version exécutée laissés inconnus. Il ne s'agit pas d'une revue indépendante.
