# Audit initial à reprendre

Constats du 2 octobre 2026, sur le commit d54033d81d7080c207c8913cafaa6e302068b9ea. Ce sont des travaux proposés et des limites de vérification, pas des corrections accomplies. Le créateur a ensuite choisi de travailler d’abord les matières, puis le fond et les autres visuels, puis le fonctionnement et le serveur. Les éléments privés du compte Higgsfield et les conversations complètes ne sont pas publiés.

## 3. Périmètre effectivement examiné

| Page ou parcours | Examen effectué | Limite |
| --- | --- | --- |
| Constellation | Rendu local, recherche de Sakinah, ouverture d’un aperçu et entrée dans le profil ; lecture du moteur et du chargement | Pas de mesure sur appareil mobile réel ni sur connexion lente |
| Trace personnelle | Profil Sakinah, quatre questions, rubriques, aperçu de médias, ouverture d’une salle, navigation au clavier | Présence de démonstration ; publication et fichiers réels du serveur non testés |
| Mémoire d’un proche | Profil Jeannot, distinction du type de trace et du déposant | Création de mémoire examinée dans le code, pas publiée |
| Se perdre | Présence aléatoire locale ; essai de la version en ligne avec API indisponible | Hasard non évalué statistiquement sur une population réelle |
| Créer ma trace | Les sept étapes personnelles jusqu’à la vérification, avec données fictives locales | Aucun clic final de publication ; aucune adresse réelle ni aucun e-mail envoyé |
| Compte | Page locale et lecture du flux de connexion, réglages, export et suppression | Connexion réelle, export serveur et effacement non exécutés |
| Projet | Page et promesses éditoriales | Certaines références historiques restent à sourcer |
| Archives | Page et code des éditions, de leur figement et des liens | Pas d’édition de production ni de restauration exécutée |
| Ressources et aide | Page et contrôle de la référence française 3114 | Les autres numéros internationaux n’ont pas tous été revérifiés |
| Soutenir | Page et état annoncé du financement | Aucun paiement ; mécanisme de don encore annoncé comme à venir |
| Juridique et confidentialité | Page, autorisations, paramètres et documentation technique | Audit de cohérence ; aucune certification juridique |
| Œuvre commune | Rendu, consignes et code des interactions et de l’unicité du trait | Aucun trait définitif déposé ; pas de test simultané entre plusieurs comptes |
| Administration et serveur | Lecture ciblée des contrôles d’accès, comptes, fichiers, modération, archives et sauvegardes | Pas de serveur avec base de données opérationnelle dans cet environnement |

Douze vues ou parcours publics ont été ouverts dans le navigateur. Les captures montrent le rendu sur ordinateur ; certaines couvrent la hauteur complète du parcours. La tentative de réglage à 390 × 844 n’a pas modifié les dimensions réelles du navigateur : **le rendu mobile n’est pas validé**. Les règles adaptatives ont été examinées dans le code, ce qui ne remplace pas un essai sur téléphone.

### Vérifications techniques

| Vérification | Résultat |
| --- | --- |
| Contrôle des types de l’interface | Réussi |
| Construction de l’interface autonome | Réussie |
| Construction de l’interface destinée au mode en ligne | Réussie |
| Contrôle des types du serveur | Réussi |
| Tests d’intégration du serveur | Bloqués au démarrage : préparation prévue pour PostgreSQL sous Linux, binaire initdb absent sur cet ordinateur Windows |
| Connexion, stockage, e-mails, restauration réelle | Non validés de bout en bout |
| État du dépôt à la fin de l’analyse | Aucune modification des fichiers suivis |

La compilation réussie montre que le code peut être construit. Elle ne suffit pas à affirmer que le service complet fonctionne en production.

## 4. Analyse artistique

### Une identité déjà construite

Le meilleur aspect du projet est la continuité entre la forme et le sujet : matière, fragilité, trace et transmission se répondent. La signature brodée apporte un ancrage humain ; les bulles gardent une individualité sans créer de hiérarchie ; l’œuvre commune donne un geste collectif concret.

Le catalogue actuel contient 100 textures d’aquarelle, auxquelles s’ajoute la matière cousue d’origine. Une [planche des 100 sources](Catalogue_matieres_actuelles.html) accompagne ce rapport. Elle permet de comparer les constructions sans la teinte GRIS. Les huit matières du dernier enregistrement sont repérées.

### Là où la qualité peut encore gagner

**La diversité perçue est inférieure au nombre de fichiers.** À l’examen de la planche, plusieurs familles se ressemblent : anneaux 20, 24, 48 et 70 ; superpositions 22 et 62 ; bandes 25, 27, 60, 65, 67, 71 et 86. Ce sont des ressemblances visuelles, pas des doublons techniques. Dans une petite bulle, les différences peuvent devenir difficiles à voir. Il faut vérifier cette déduction à la taille d’affichage avant de remplacer une matière.

**Certaines matières sont très pâles.** Les sources 6, 21, 58 et 92 constituent de bons candidats pour un contrôle de visibilité sur les couleurs les plus claires. Une transparence délicate peut être belle, mais une présence doit rester repérable. Il faut apprécier le résultat teinté dans la constellation, pas uniquement l’image source.

**Les huit nouvelles matières diversifient réellement les constructions.** Dentelle, plumes, papier froissé, contours naturels et ricochets apportent des différences plus identifiables que de nouvelles variations d’anneaux. C’est une piste à prolonger, à condition de conserver une cohérence de lumière, de grain et de bord.

**L’aquarelle du fond et le tissu des pages intérieures forment une bonne transition.** Le danger serait une texture trop contrastée derrière la lecture ou une animation qui réclame autant d’attention que les mots. La qualité supplémentaire doit se voir surtout dans la douceur, la profondeur et l’absence d’artifices visibles.

**La typographie présente une petite incohérence interne.** Les consignes indiquent que les mots déposés doivent être en italique ; les trois premières réponses du profil apparaissent en romain, la quatrième en italique. Le code de trace.css confirme cette différence. Je propose de choisir ensemble la règle qui sert le mieux la lecture, puis de la documenter. Il n’est pas nécessaire de rétablir les anciens textes brodés, déjà rejetés.

## 5. Les corrections prioritaires

P1 désigne une correction nécessaire avant une ouverture fiable à de vrais contributeurs. P2 désigne une amélioration importante de l’expérience ou de l’exploitation. P3 désigne une finition ou une décision de produit. Ces niveaux sont des priorités de travail, pas des notes de gravité juridique.

### A01. Distinguer musée vide et service indisponible — P1

**Établi et reproduit.** Quand l’API est inaccessible, le chargement convertit l’échec en liste vide. L’accueil annonce alors que le musée attend sa première présence. En ouvrant « Se perdre », le composant lit les propriétés d’une présence inexistante et la page devient vide.

**Impact :** un incident technique ressemble à un musée désert, puis empêche de naviguer. Cette situation peut aussi se produire lors d’une première ouverture réellement vide.

**Correction proposée :** prévoir trois états distincts : chargement, musée vide, chargement impossible. Ajouter une action pour réessayer et une protection générale contre une erreur d’affichage.

**Critère de réussite :** API coupée, aucune page vide ; un message compréhensible et une possibilité de retour ou de reprise. Musée réellement vide, « Se perdre » reste utilisable et propose de déposer une première trace.

Sources : [chargement du musée](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/data/store.ts), [SePerdre.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/SePerdre.tsx).

### A02. Rendre l’exploration équitable au-delà des premières présences — P1

**Établi dans le code.** La constellation prend les premières présences de sa liste : au maximum 150 sur petite largeur, 260 sur largeur intermédiaire, 380 sur grand écran. Les suivantes ne sont pas intégrées à cette constellation. La recherche et « Se perdre » peuvent les rendre accessibles autrement ; elles restent exclues de la promenade libre tant que ce sous-ensemble ne change pas.

**Impact :** l’égalité de taille ne garantit pas l’égalité de rencontre. Avec un musée qui grandit, une partie des personnes devient durablement absente du mode principal.

**Correction proposée :** conserver la limite d’affichage pour la fluidité, mais renouveler les présences par une sélection équitable, sans popularité. Préserver les repères de navigation et éviter des remplacements visibles brusques.

**Critère de réussite :** avec une population supérieure à la limite, toutes les présences sont éligibles à la promenade ; un lien partagé et une recherche amènent correctement à n’importe quelle bulle.

Source : [constellation.ts, lignes 155 et 170](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/engine/constellation.ts#L155).

### A03. Protéger les brouillons et retirer la purge automatique des essais — P1

**Établi dans le code.** Lorsqu’un marqueur local manque, une fonction exécutée au chargement efface les traces locales, le brouillon et la base des fichiers du navigateur. C’est documenté comme un nettoyage des anciens essais. Par ailleurs, un échec d’enregistrement du brouillon est ignoré ; quitter la page avant le délai de sauvegarde peut perdre la dernière modification.

**Impact :** une personne peut perdre son travail sans message. La purge est particulièrement incompatible avec une progression que l’on souhaite préserver.

**Correction proposée :** remplacer le nettoyage automatique par une migration conservatrice, sauvegarder les dernières modifications en quittant le parcours et afficher un échec réel de sauvegarde. Ne pas effacer les données actuelles pour réaliser cette correction.

**Critère de réussite :** ancien stockage, stockage saturé, rechargement et sortie rapide du parcours sont testés avec des données jetables ; le contenu est préservé ou l’impossibilité de le préserver est annoncée explicitement.

Sources : [store.ts, purge des essais](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/data/store.ts#L96), [Creer.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Creer.tsx).

### A04. Aligner les autorisations demandées et enregistrées — P1

**Établi dans le code et le parcours.** Les choix facultatifs d’archivage, de broderie et de réseaux sociaux sont décochés, ce qui est cohérent. Cependant, feedbackPrive est fixé à true lors de la création sans choix correspondant à cette étape. La page juridique affirme que les messages privés exigent un accord. La mise à jour des paramètres conserve l’état actuel sans enregistrer un historique explicite de chaque accord et de son retrait.

**Impact :** il existe une divergence entre ce que la personne choisit et ce que le système retient. Le champ ne prouve pas que des messages sont déjà envoyés ; ce risque concerne la cohérence et l’usage futur de cette autorisation.

**Correction proposée :** désactiver par défaut tout usage facultatif non choisi ; préciser séparément les usages ; garder une preuve datée de la version du texte accepté et des changements. Examiner aussi le regroupement du musée physique et de la broderie.

**Critère de réussite :** les paramètres sauvegardés correspondent exactement aux choix affichés ; les refus permettent de publier ; un retrait peut être suivi et appliqué.

Sources : [création, ligne 195](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Creer.tsx#L195), [paramètres du serveur](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/routes/auteur.ts). Pour les traitements fondés sur le consentement, la CNIL demande un acte clair et une preuve ; elle rappelle que le consentement n’est pas la seule base légale possible. [CNIL, consentement](https://www.cnil.fr/fr/les-bases-legales/consentement).

### A05. Donner aux archives une réalité correspondant à leur promesse — P1

**Établi dans le code.** Figer une édition enregistre une liste d’identifiants de traces. Cela ne constitue pas une copie des textes, médias et traits à cette date. Le figement peut être exécuté à nouveau et modifier cette liste. Le lien vers l’œuvre d’une édition conduit à l’œuvre commune actuelle.

**Impact :** une édition annoncée comme préservée peut montrer des contenus ultérieurement modifiés ou retirés et une œuvre d’une autre période.

**Correction proposée :** décider si une édition conserve un état historique complet ou seulement une liste de présences. Pour une conservation historique complète, versionner textes, références de fichiers et œuvre ; organiser la gestion des demandes de retrait et interdire un nouveau figement silencieux.

**Critère de réussite :** une modification postérieure ne change pas involontairement l’édition ; les droits de retrait restent traitables ; l’œuvre affichée appartient à l’édition choisie.

Source : [administration des éditions, ligne 226](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/routes/admin.ts#L226), [page Archives](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Pages.tsx).

### A06. Vérifier les conditions de lancement du service complet — P1

**Établi dans le code ; production inconnue.** Le serveur exige un secret en production mais peut démarrer sans configuration d’envoi d’e-mails. Dans ce cas, les codes sont écrits dans son journal ; l’interface reçoit néanmoins une réponse indiquant que l’envoi a eu lieu. Une liste vide d’administrateurs est également possible.

**Impact :** un service mal configuré peut laisser les personnes attendre un code qui n’arrive jamais et priver le fondateur des accès de modération prévus. Aucun élément ne prouve que ta production actuelle se trouve dans cet état.

**Correction proposée :** vérifier les réglages indispensables au démarrage en production, l’envoi effectif des codes, la réception des signalements, les accès administrateurs et une restauration des sauvegardes. Réserver l’écriture des codes au développement.

**Critère de réussite :** une configuration incomplète échoue clairement ; un compte de test reçoit et utilise son code ; un signalement arrive au bon destinataire ; une sauvegarde restaure réellement un dépôt et son fichier.

Sources : [config.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/config.ts), [courriel.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/courriel.ts).

### A07. Garder le clavier dans les panneaux ouverts — P1

**Reproduit.** Après ouverture de « Voir 7 fragments », Maj + Tab déplace le focus vers le lien « Juridique & confidentialité » situé derrière le panneau. Le panneau annonce pourtant qu’il est modal.

**Impact :** navigation au clavier désorientante et accès possible à une page censée être inactive. La présence de aria-modal ne règle pas ce comportement à elle seule.

**Correction proposée :** rendre l’arrière-plan inactif pendant l’ouverture, contenir le parcours Tab et Maj + Tab, conserver Échap et restituer le focus au bon élément à la fermeture. Appliquer la règle aux salles et à la visionneuse de médias.

**Critère de réussite :** aucun focus n’atteint l’arrière-plan pendant l’ouverture ; fermeture et retour de focus vérifiés, y compris avec des panneaux imbriqués.

Source : [Panneau.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/components/Panneau.tsx). Le comportement attendu est décrit dans le [guide des dialogues du W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## 6. Améliorations importantes

### A08. Prévoir une reprise quand un profil ne se charge pas — P2

**Établi dans le code.** Une absence de profil est traitée si le serveur répond 404. Les autres erreurs peuvent laisser l’état de chargement actif sans retour utile ni action de reprise. Corriger le parcours avec un message, une possibilité de réessayer et une distinction entre absence et incident. Tester réseau interrompu, délai dépassé et refus du serveur. Source : [useTrace dans store.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/data/store.ts).

### A09. Répercuter les nouvelles présences dans l’exploration — P2

**Risque étayé par le code.** La liste de l’explorateur est mémorisée en fonction de l’édition, et « Se perdre » prépare son ordre une seule fois. Le chargement et certaines mises à jour du stockage n’entraînent pas nécessairement une nouvelle liste pour ces vues. Le délai de démarrage de quatre secondes accentue le risque si les données arrivent tard. Faire dépendre les vues de l’état réellement chargé et tester une publication pendant une session ouverte. Source : [Explorer.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Explorer.tsx), [main.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/main.tsx).

### A10. Rendre la recherche fidèle à la diversité des langues — P2

**Établi dans le code local.** Le texte indexé est réduit aux lettres a à z et aux chiffres. Des écritures non latines disparaissent de cet index, alors que le site prévoit des polices pour les accueillir. En ligne, la recherche est différente et ses résultats sont limités à 1 000, sans pagination correspondante. Une erreur peut également ressembler à zéro résultat. Préserver les caractères Unicode, tester plusieurs écritures et distinguer absence de résultat et échec. Sources : [recherche de l’interface](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Explorer.tsx), [recherche du serveur, ligne 88](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/routes/public.ts#L88).

### A11. Permettre les gestes principaux au clavier — P2

**Établi dans le code.** Le clavier permet de déplacer et de zoomer la constellation, mais ne fournit pas de sélection directe de bulle comparable au clic. L’œuvre commune reçoit les gestes du pointeur sans parcours de placement au clavier. Ajouter une sélection de présence et un placement du trait accessibles, en conservant le même geste artistique et la même longueur pour tous. Le lecteur d’écran n’a pas été testé en situation. Sources : [moteur de constellation](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/engine/constellation.ts), [OeuvreCommune.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/OeuvreCommune.tsx#L305).

### A12. Offrir un contrôle discret du mouvement — P2

**Établi dans le code.** La préférence système de réduction des animations ralentit les bulles, mais ne les arrête pas. Il faut aussi examiner le fond vidéo et les autres animations. Proposer une vue calme ou une pause discrète, à valider artistiquement. Pour les mouvements automatiques longs présentés avec d’autres contenus, le W3C prévoit un mécanisme de contrôle, sauf mouvement essentiel. Cela demande une évaluation de chaque animation ; ce rapport ne certifie pas une conformité globale. Source : [moteur](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/engine/constellation.ts), [W3C, Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).

### A13. Renforcer la lisibilité des petites informations — P2

**Risque mesurable dans les couleurs de référence.** L’encre secondaire #85808b sur le fond uni #ece9e2 donne un contraste d’environ 3,17:1. Cela reste inférieur à 4,5:1 pour du texte ordinaire. Le contraste réel varie avec la texture, les transparences et l’élément ; il faut contrôler les notes, compteurs et libellés concernés, sans assombrir toute l’identité. Source : [tokens.css](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/styles/tokens.css), [W3C, contraste minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

### A14. Verrouiller l’attente d’une publication — P2

**Établi dans le code.** L’état de publication est activé après la réponse positive du serveur. Un double clic peut donc lancer plusieurs demandes pendant l’attente. Les contraintes du serveur limitent les doublons, mais l’interface peut produire un retour confus. Désactiver immédiatement le bouton, afficher l’attente et prévoir une reprise sûre sans nouvelle publication involontaire. Source : [Creer.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Creer.tsx).

### A15. Assurer la cohérence du catalogue aussi sur le serveur — P2

**Établi dans le code.** La création côté serveur accepte un numéro de matière jusqu’à 999 et une couleur qui respecte un format textuel, sans vérifier l’appartenance aux choix artistiques disponibles. Les pays et les paramètres sont également plus ouverts que le formulaire. Faire correspondre les choix autorisés et les règles du serveur, avec une stratégie pour les anciennes traces. L’objectif est d’éviter des présences non reproductibles, pas d’ajouter des restrictions artistiques inutiles. Source : [validation dans auteur.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/routes/auteur.ts).

### A16. Rendre la déconnexion honnête en cas d’incident — P2

**Risque étayé par le code.** Si l’appel de déconnexion échoue, l’interface retire quand même le compte de son état local. La session côté serveur peut rester valide. Annoncer le résultat exact et éviter de présenter une déconnexion locale comme une déconnexion serveur confirmée. Vérifier aussi les données conservées en mémoire après un effacement de compte ; ce cache n’est pas entièrement vidé dans le parcours lu. Source : [store.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/data/store.ts).

### A17. Compléter l’information sur la protection des données — P1 avant ouverture, rédaction à discuter

**Établi sur la page.** Le texte juridique annonce lui-même une version incomplète. L’identité du responsable, les destinataires et les durées réelles doivent correspondre aux choix d’hébergement, d’e-mails, de médias intégrés, de journaux et de sauvegardes. La formule « jamais partagée » mérite une précision si elle vise l’absence de vente ou de diffusion publique tout en utilisant des prestataires.

Préparer une information courte dans le parcours, reliée à une version complète. Distinguer scellement artistique, droit de retrait et conservation historique. Les personnes peuvent aussi publier des informations concernant des proches vivants : ce cas doit être prévu dans les règles et la modération. Ce sont des sujets de validation juridique, pas des conclusions de conformité déjà acquises. La [CNIL décrit les informations et la transparence attendues](https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence).

### A18. Préparer une administration qui reste utilisable quand le musée grandit — P2

**Établi dans le code.** Plusieurs listes de modération, comptes et journaux sont limitées aux entrées récentes sans pagination complète. Ajouter une navigation vers les éléments anciens, des filtres de traitement et une visibilité sur les signalements non résolus. Vérifier le traitement des signalements même si l’e-mail échoue. Les rôles et la journalisation des principales actions constituent déjà de bons fondements. Source : [admin.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/routes/admin.ts).

### A19. Distinguer export lisible, archive éditoriale et sauvegarde complète — P2

**Établi dans le code.** L’export administrateur contient traces, fragments, médias, traits, éditions et signalements. Il ne contient pas toutes les tables nécessaires à une restauration complète, et les références de médias ne sont pas les fichiers eux-mêmes. Les scripts de sauvegarde suivent un autre mécanisme. Nommer précisément chaque livrable et tester une restauration. Vérifier la conservation des copies distantes et des fichiers retirés, en accord avec l’information donnée aux personnes. Source : [export administrateur](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/routes/admin.ts#L249) et dossier [déploiement](https://github.com/Loflish/Loflish/tree/d54033d81d7080c207c8913cafaa6e302068b9ea/deploiement).

## 7. Finitions et décisions de produit

### A20. Corriger la structure de l’en-tête — P3

**Établi dans le code et les vues.** Le lien de retour des pages intérieures contient le composant Logo, qui contient lui-même un lien. Cette imbrication est invalide et crée deux liens superposés dans la représentation accessible. Garder un seul lien avec le même rendu. Source : [Chrome.tsx, ligne 166](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/components/Chrome.tsx#L166).

### A21. Alléger la création sans rendre le dépôt plus pressant — P3

**Proposition.** L’étape « Enrichir » annonce surtout que l’enrichissement pourra se faire plus tard. Elle ajoute un écran et une action. Je propose de comparer le parcours actuel à un parcours qui intègre cette information dans l’aperçu, sans supprimer la vérification finale. Les quatre questions ont aussi besoin de libellés propres à chaque champ ; le champ facultatif de la deuxième question est imbriqué dans le même label que la réponse. Source : [Creer.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Creer.tsx).

### A22. Ajuster le ton du mot du fondateur — P3

**Avis éditorial.** Le message rappelle utilement que le musée célèbre les vies. La formulation qui évoque la conscience du fondateur peut toutefois faire porter un poids supplémentaire au lecteur. Je propose de conserver la sincérité du texte en recentrant cette partie sur l’aide disponible. Une formulation complète doit te rester fidèle et être validée avec toi. La référence française [3114](https://3114.fr/) a été vérifiée : elle est gratuite, accessible 24 h/24 et 7 j/7 en France. Les autres ressources doivent faire l’objet d’un entretien régulier.

### A23. Préciser la promesse d’archive et son coût — P3

**Vérification externe.** Le site présente 139 € comme un coût par personne. La page officielle de l’Arctic World Archive annonce une offre partagée **à partir de 139 €, hors TVA**. Cela ne suffit pas à chiffrer un dépôt collectif du musée. Reformuler le montant, dater la source et distinguer l’intention de financement d’un engagement déjà organisé. Source : [AWA, tarifs](https://arcticworldarchive.org/pricing/).

### A24. Définir la fidélité attendue pour les souvenirs déposés — P3

**Établi dans le code, arbitrage à faire.** Les photographies suffisamment grandes ou lourdes sont réduites jusqu’à 1 600 pixels et réencodées en JPEG. Cela améliore le chargement, mais ne conserve pas toujours le fichier original, sa transparence ou son animation. Pour un musée de mémoire, choisir explicitement entre original conservé et version optimisée seulement. Tester les formats annoncés, notamment ceux que le navigateur décode difficilement. Ne pas utiliser Higgsfield pour réinventer les souvenirs des personnes. Source : [fichiers.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/lib/fichiers.ts).

### A25. Mettre la documentation en accord avec la version actuelle — P3

**Établi.** README.md décrit encore un alphabet brodé pour certains textes alors que le composant actuel affiche du texte ordinaire. Il annonce aussi des propriétés de recherche et d’archives qui doivent être distinguées de leur implémentation complète. Corriger cette documentation pour éviter que le prochain intervenant restaure un effet déjà rejeté ou prenne une intention pour une fonction validée. Source : [README.md](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/README.md).

### A26. Simplifier la reprise du projet sur cet ordinateur — P2 pour notre travail

**Établi.** La préparation des tests suppose des chemins et des outils Linux. Le contrôle des fichiers du stockage disque construit aussi une limite avec un séparateur qui ne correspond pas à Windows. Cela ne prouve pas un défaut du déploiement Linux prévu ; cela complique les validations ici. Préparer un environnement de test reproductible ou adapter les utilitaires nécessaires, sans installer une infrastructure entière avant d’en avoir choisi l’usage. Sources : [test/base.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/test/base.ts), [stockage.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/stockage.ts#L41).

## 8. Lecture des parcours et pistes d’innovation

### Entrer et rencontrer

Le musée peut garder son arrivée immersive. Une aide contextuelle très brève pourrait traduire les gestes selon l’appareil : toucher et rapprocher les doigts sur téléphone, clic et molette sur ordinateur, touches pour le clavier. Le texte actuel évoque la molette ; il ne suffit pas à guider une première visite tactile.

Pour l’égalité de rencontre, une constellation renouvelée discrètement est une innovation plus cohérente qu’une nouvelle liste classée. On peut aussi proposer un parcours de rencontre sans répétition au cours d’une visite, sans catégories de personnes ni mise en concurrence.

### Lire une trace

La hiérarchie entre les questions, les cinq sens et les autres rubriques fonctionne. Un mode de lecture calme pourrait réduire les éléments périphériques et laisser un texte plus large, sans imposer une autre esthétique. Le choix des trois fragments mis en avant doit rester une expression de la personne, pas devenir une optimisation pour attirer des clics.

Les salles gagneraient à conserver le contexte : nom de la personne, rubrique consultée, fermeture claire, puis retour à la même place. La qualité des médias doit se juger avec de vrais fichiers de test, pas uniquement les aperçus de démonstration.

### Déposer sa trace

Le parcours présente correctement la visibilité publique et le scellement avant la publication. Il doit mieux montrer ce qui est réellement sauvegardé et ce qui peut encore être corrigé. Une relecture finale regroupant identité, réponses et choix d’utilisation rassurerait sans ajouter une longue procédure.

Une « préparation tranquille » est une piste compatible avec le projet : revenir à un brouillon, relire ses mots et publier quand on est prêt. Je déconseille des rappels insistants, objectifs de remplissage ou pourcentages qui transformeraient la mémoire en tâche à terminer.

### Participer à l’œuvre commune

Le trait unique et de longueur égale est une idée forte. Son entrée pourrait mieux expliquer le geste avant le choix définitif et permettre un aperçu accessible au clavier. Une vue d’ensemble puis un rapprochement vers son propre trait pourrait donner un sentiment de participation, sans classement ni attribution publique obligatoire.

### Revenir dans le temps

Les éditions annuelles pourraient devenir un vrai rendez-vous artistique : état de la constellation, état de l’œuvre commune, court texte du fondateur et accès aux traces autorisées. Cela exige d’abord un modèle d’archive honnête. Une jolie frise ne remplace pas la conservation des contenus.
