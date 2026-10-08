# Constats enregistrés lors de l’audit du 2 octobre 2026

Version examinée : d54033d81d7080c207c8913cafaa6e302068b9ea.

Ce document conserve le périmètre, les limites et les constats datés de l’audit. Les vérifications de cette version ne prouvent pas un fonctionnement actuel en production.

## Périmètre effectivement examiné

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

## Constats datés

### A01. API inaccessible

L’échec de chargement devient une liste vide dans la constellation. Dans le parcours reproduit, « Se perdre » lit une présence inexistante et la page devient vide.

Sources enregistrées dans l’audit : [chargement du musée](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/data/store.ts), [SePerdre.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/SePerdre.tsx).

### A02. Sous-ensemble de la constellation

Le code retient les premières présences : 150, 260 ou 380 selon la largeur. Les autres présences restent accessibles par certains autres parcours.

Sources enregistrées dans l’audit : [constellation.ts, lignes 155 et 170](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/engine/constellation.ts#L155).

### A03. Données locales et brouillons

L’absence d’un marqueur local déclenche l’effacement des traces, du brouillon et de la base de fichiers du navigateur. Certains échecs de sauvegarde du brouillon sont ignorés.

Sources enregistrées dans l’audit : [store.ts, purge des essais](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/data/store.ts#L96), [Creer.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Creer.tsx).

### A04. Autorisations

Le parcours initialise feedbackPrive à true sans choix correspondant à cette étape. Aucun historique explicite des accords et retraits n’a été identifié dans les paramètres examinés.

Sources enregistrées dans l’audit : [création, ligne 195](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Creer.tsx#L195), [paramètres du serveur](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/routes/auteur.ts). Pour les traitements fondés sur le consentement, la CNIL demande un acte clair et une preuve ; elle rappelle que le consentement n’est pas la seule base légale possible. [CNIL, consentement](https://www.cnil.fr/fr/les-bases-legales/consentement).

### A05. Figement des archives

Le figement stocke une liste d’identifiants, sans copie datée de tous les contenus. Un nouvel appel peut modifier cette liste. Le lien de l’œuvre renvoie vers l’œuvre commune actuelle.

Sources enregistrées dans l’audit : [administration des éditions, ligne 226](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/routes/admin.ts#L226), [page Archives](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Pages.tsx).

### A06. Configuration du serveur

Le serveur peut démarrer sans configuration d’e-mails ni liste d’administrateurs. Dans cette configuration, les codes apparaissent dans les journaux. La configuration de production était inconnue.

Sources enregistrées dans l’audit : [config.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/config.ts), [courriel.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/courriel.ts).

### A07. Focus des panneaux

Après ouverture de « Voir 7 fragments », Maj + Tab a placé le focus sur un lien situé derrière le panneau modal.

Sources enregistrées dans l’audit : [Panneau.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/components/Panneau.tsx). Le comportement attendu est décrit dans le [guide des dialogues du W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### A08. Chargement de profil

Le cas 404 est traité. D’autres erreurs peuvent laisser le profil dans son état de chargement.

Sources enregistrées dans l’audit : [useTrace dans store.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/data/store.ts).

### A09. Actualisation des présences

Certaines listes de l’explorateur et de « Se perdre » sont mémorisées sans actualisation systématique après chargement ou modification du stockage.

Sources enregistrées dans l’audit : [Explorer.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Explorer.tsx), [main.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/main.tsx).

### A10. Recherche

L’index local retire les écritures non latines. Le parcours en ligne a une limite de 1 000 résultats sans pagination correspondante.

Sources enregistrées dans l’audit : [recherche de l’interface](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Explorer.tsx), [recherche du serveur, ligne 88](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/routes/public.ts#L88).

### A11. Interactions au clavier

Le code permet le déplacement et le zoom de la constellation, sans sélection de bulle comparable au clic. Le placement du trait de l’œuvre utilise le pointeur.

Sources enregistrées dans l’audit : [moteur de constellation](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/engine/constellation.ts), [OeuvreCommune.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/OeuvreCommune.tsx#L305).

### A12. Réduction des animations

La préférence système ralentit les bulles sans les arrêter. Aucune conformité globale de l’accessibilité n’a été établie.

Sources enregistrées dans l’audit : [moteur](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/engine/constellation.ts), [W3C, Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).

### A13. Contraste de référence

L’encre secondaire #85808b sur le fond uni #ece9e2 donne environ 3,17:1. Le contraste réel dépend des textures et transparences ; il n’a pas été contrôlé pour chaque élément.

Sources enregistrées dans l’audit : [tokens.css](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/styles/tokens.css), [W3C, contraste minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

### A14. Attente de publication

L’état de publication est activé après la réponse du serveur. Plusieurs clics pendant l’attente peuvent lancer plusieurs demandes.

Sources enregistrées dans l’audit : [Creer.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Creer.tsx).

### A15. Validation du catalogue sur le serveur

La création accepte un numéro de matière jusqu’à 999 et une couleur au format textuel, sans vérification complète de leur appartenance au catalogue artistique.

Sources enregistrées dans l’audit : [validation dans auteur.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/routes/auteur.ts).

### A16. Déconnexion

En cas d’échec de l’appel, le compte peut être retiré de l’interface alors que la session du serveur reste valide.

Sources enregistrées dans l’audit : [store.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/data/store.ts).

### A17. Texte de protection des données

La page juridique examinée annonce elle-même une version incomplète. Aucune certification juridique du site n’a été effectuée.

### A18. Listes d’administration

Plusieurs listes de comptes, de modération et de journaux présentent les entrées récentes sans pagination complète.

Sources enregistrées dans l’audit : [admin.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/routes/admin.ts).

### A19. Export administrateur

L’export contient des contenus éditoriaux et leurs références, sans toutes les tables ni tous les fichiers nécessaires à une restauration complète. Les scripts de sauvegarde sont distincts.

Sources enregistrées dans l’audit : [export administrateur](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/routes/admin.ts#L249) et dossier [déploiement](https://github.com/Loflish/Loflish/tree/d54033d81d7080c207c8913cafaa6e302068b9ea/deploiement).

### A20. Liens de l’en-tête

Le lien de retour des pages intérieures contient le composant Logo, lui-même doté d’un lien. Deux liens superposés figurent dans la représentation accessible.

Sources enregistrées dans l’audit : [Chrome.tsx, ligne 166](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/components/Chrome.tsx#L166).

### A21. Étape Enrichir

Le parcours contient une étape annonçant un enrichissement ultérieur. Le champ facultatif de la deuxième question est imbriqué dans le même label que sa réponse.

Sources enregistrées dans l’audit : [Creer.tsx](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/pages/Creer.tsx).

### A22. Mot du fondateur

Le texte examiné évoque la conscience du fondateur et les ressources d’aide. Son appréciation éditoriale était un avis, pas un défaut technique établi.

### A23. Montant d’archive affiché

Le site examiné affiche 139 € par personne. Le contrôle de la page tarifaire au 2 octobre n’a pas établi le coût réel d’un dépôt collectif du musée. Ce constat est daté et ne vaut pas tarif actuel.

Sources enregistrées dans l’audit : [AWA, tarifs](https://arcticworldarchive.org/pricing/).

### A24. Transformation des photographies

Les grandes photographies sont réduites jusqu’à 1 600 pixels et réencodées en JPEG. L’original, la transparence et l’animation ne sont pas systématiquement conservés.

Sources enregistrées dans l’audit : [fichiers.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/src/lib/fichiers.ts).

### A25. Documentation et texte brodé

Le README décrit un alphabet brodé pour certains textes alors que le composant examiné affiche du texte ordinaire.

Sources enregistrées dans l’audit : [README.md](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/README.md).

### A26. Environnement Windows

La préparation des tests utilise des outils et chemins Linux. Le contrôle du stockage disque contient aussi une limite de chemin incompatible avec Windows. Le déploiement Linux n’a pas été validé par ce constat.

Sources enregistrées dans l’audit : [test/base.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/test/base.ts), [stockage.ts](https://github.com/Loflish/Loflish/blob/d54033d81d7080c207c8913cafaa6e302068b9ea/server/src/stockage.ts#L41).
