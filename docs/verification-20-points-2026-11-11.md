# Les 20 points juridiques, vérifiés contre le site (11 novembre 2026)

Liste de départ : l'image « 20 choses que Claude doit faire pour que ton app ne finisse pas au tribunal ».
Chaque point est confronté au code du site (branche `claude/vibrant-galileo-h4yjfn`, fusion comprise).
Je ne suis pas avocat : ce document dit ce que le site fait et ce qui manque, il ne remplace pas une relecture
par un juriste avant l'ouverture.

## En bref

| État | Points |
|---|---|
| En place (11) | 2, 3, 7, 8, 9, 10, 14, 15, 16, 17, 20 |
| À compléter (4) | 1, 5, 13, 19 |
| Sans objet aujourd'hui (5) | 4, 6, 11, 12, 18 |

Les quatre choses à faire avant d'ouvrir le site :

1. Remplir les mentions légales (point 1) : trois champs `[À COMPLÉTER]`.
2. Écrire un paragraphe « cookies » dans la page Juridique et corriger le registre (point 5) : le site pose
   deux cookies, le registre n'en annonce qu'un.
3. Faire relire par un juriste les sections 1 à 13 de la page Juridique (la page annonce elle-même que les
   textes complets sont en cours de rédaction).
4. Vérifier tes droits d'usage commercial sur les images faites avec des outils d'intelligence artificielle
   (point 19).

## Point par point

| N° | Point | État | Preuve dans le site | Ce qui manque | Qui |
|---|---|---|---|---|---|
| 1 | Mentions légales | À compléter | Section 13 de Juridique : `src/pages/Pages.tsx:357-358` | Éditeur, directeur de la publication et hébergeur sont encore `[À COMPLÉTER]` | Toi |
| 2 | Confidentialité | En place | Sections « Protection des données », « Durées de conservation », « Tes données après ta mort » ; registre : `docs/registre-des-traitements.md` | Relecture ; la page dit « textes complets en cours de rédaction » (`Pages.tsx:366`) | Juriste |
| 3 | Conditions générales | En place | Sections 1, 3, 4 et 9 de Juridique (conditions, ce que tu autorises, publication, signalements) | Relecture | Juriste |
| 4 | Remboursements | Sans objet | Aucun paiement : « Il n'est pas encore possible de faire un don » (`Pages.tsx:302`) | À reprendre le jour où les dons ouvrent | — |
| 5 | Politique cookies | À compléter | Le registre dit « un seul cookie » (`docs/registre-des-traitements.md:28`) | Le mot « cookie » n'apparaît pas dans la page Juridique. Le serveur pose deux cookies : `nmm_session` (90 jours, `server/src/auth.ts:31-64`) et `nmm_appareil` (10 ans, `server/src/routes/public.ts:272`, un seul trait par appareil dans l'œuvre commune). Le navigateur garde aussi le brouillon et quelques préférences (`localStorage`) | Toi pour le texte, code pour la durée |
| 6 | Bandeau cookies | Sans objet | Aucune mesure d'audience, aucun pixel, polices servies par le site, vidéos tierces chargées seulement après un clic et un avertissement (`src/components/Media.tsx:196`) | Rien tant qu'aucun traceur non nécessaire n'est ajouté. À faire confirmer : `nmm_appareil` et ses 10 ans | Juriste |
| 7 | Consentements | En place | Cases jamais pré-cochées : 18 ans (`src/pages/Creer.tsx:377`), autorisation de publier (`:579`), choix de confidentialité (`:605`), droits sur un fichier (`Media.tsx:261`), « Après moi » (`Pages.tsx:879-881`) | — | — |
| 8 | Zéro donnée inutile | En place | Une adresse e-mail, une déclaration de majorité, une empreinte chiffrée de l'adresse IP (jamais l'adresse) : registre, ligne « Comptes » | — | — |
| 9 | Outils tiers | En place | Aucun outil de mesure dans `src/`, `index.html`, `server/src/`. Tiers réels : YouTube (sans cookie) et Vimeo après clic, lien findahelpline.com | Nommer dans les mentions l'hébergeur, le service d'envoi d'e-mails et le stockage des fichiers | Toi |
| 10 | Zéro piège | En place | Rien de pré-coché, pas de compte à rebours, effacer son compte depuis la page Compte (il faut écrire EFFACER, pour éviter l'accident) | — | — |
| 11 | Zéro frais caché | Sans objet | « Le musée est gratuit » (`Pages.tsx:310`) | — | — |
| 12 | Zéro faux avis | Sans objet | Aucun avis, aucun témoignage. Les traces de l'aperçu sont des données de démonstration (`src/data/sakinah.ts:8`, `src/data/pools.ts:2`) | À l'ouverture : les retirer ou les présenter comme des exemples | Toi |
| 13 | Zéro promesse non prouvée | À compléter | « Aucune promesse de "pour toujours" » (section 11) | Relire chaque engagement chiffré : scellement cinq ans, préavis de six mois, dépôt « 139 € par personne » pris en charge « si le musée réunit assez de traces » (`Pages.tsx:216`) | Toi, juriste |
| 14 | Texte alternatif | En place | Logo décrit (`src/components/Chrome.tsx:22`), médias décrits par leur légende (`Media.tsx:170`), images décoratives en `alt=""` | — | — |
| 15 | Contraste | En place | Contrôle automatique axe-core du 11 novembre : 0 défaut sur 48 pages (4 largeurs × 12 pages) | — | — |
| 16 | Navigation clavier | En place | Lien d'évitement, focus visible, Échap ferme et rend le focus : 32 gestes rejoués par `npm run controles` | Non vérifié : un essai avec un vrai lecteur d'écran | Toi ou un testeur |
| 17 | Accord des parents | En place | Le site est réservé aux 18 ans et plus, case obligatoire (`Creer.tsx:164` et `:377`) | C'est une déclaration, pas une vérification : à faire valider | Juriste |
| 18 | Lien de désinscription | Sans objet | Le serveur n'envoie que des messages de service : code de connexion, changement d'adresse, signalement, décès, retrait (`server/src/courriel.ts`) | Obligatoire le jour où tu envoies une lettre d'information | — |
| 19 | Droits polices et images | À compléter | Polices Newsreader et IBM Plex Sans sous licence libre OFL 1.1 (fichiers `LICENSE` dans `node_modules/@fontsource*`). Section 12 : images faites à la main ou par des outils d'IA, puis retouchées | Vérifier que tes abonnements aux outils d'IA autorisent l'usage public de ces images | Toi |
| 20 | Suppression des données | En place | Effacer son compte : `DELETE /api/moi` (`server/src/routes/auteur.ts:540`) ; emporter ses données : `GET /api/moi/export` (`:465`) ; boutons dans la page Compte | — | — |

## Les textes de référence

Relus à la source le 11 novembre 2026 par un assistant de recherche (extraction de texte des pages officielles ;
la ponctuation n'a pas été contrôlée au caractère près).

| Point | Texte | Ce qu'il dit | Lien |
|---|---|---|---|
| 1 | Loi n° 2004-575 (LCEN), article 1-1 (remplace l'ancien 6 III depuis mai 2024) | Un éditeur non professionnel peut n'afficher que le nom et l'adresse de son hébergeur, s'il lui a donné son identité | [Légifrance](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049568614/) |
| 2 | RGPD, articles 13 et 14 | Identité du responsable, finalités, base juridique, durées et droits, donnés au moment de la collecte | [CNIL](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3) |
| 5, 6 | Loi Informatique et Libertés, article 82 ; règles de la CNIL | Consentement avant tout traceur, sauf s'il est strictement nécessaire au service demandé (connexion, préférences attendues) | [Légifrance](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037813978), [CNIL](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi) |
| 7 | RGPD, article 4 (11) et article 7 | Consentement libre, spécifique, éclairé, séparé des autres questions, aussi simple à retirer qu'à donner | [CNIL](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2) |
| 8 | RGPD, article 5, 1, c | Seulement les données nécessaires | [CNIL](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2) |
| 17 | Loi Informatique et Libertés, article 45 ; RGPD, article 8 | Un mineur consent seul à partir de 15 ans ; avant, avec ses parents | [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000886460) |
| 20 | RGPD, articles 15, 17, 20 et 12 | Copie, effacement, portabilité ; réponse sous un mois | [CNIL](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3) |
| 2 | Loi Informatique et Libertés, article 85 | Chacun peut dire ce que deviendront ses données après sa mort ; ce choix ne peut pas résulter des seules conditions générales | [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000886460) |
| 18 | Code des postes et des communications électroniques, article L34-5 | Prospection par e-mail seulement avec accord, et moyen de la faire cesser dans chaque message | [Légifrance](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042155961) |
| 12, 13 | Code de la consommation, articles L121-1 à L121-4 (faux avis : 27° et 28°) | Pratiques trompeuses et faux avis interdits | [Légifrance](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563107) |
| 4 | Code de la consommation, articles L221-1 et L221-18 | Quatorze jours de rétractation pour un contrat à distance entre un professionnel et un consommateur | [Légifrance](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226842) |
| 14 à 16 | Loi n° 2005-102, article 47 ; décret n° 2019-768 ; directive (UE) 2019/882 | Obligation d'accessibilité pour les organismes publics et les entreprises au-delà de 250 millions d'euros ; depuis le 28 juin 2025, pour les services en ligne vendus aux consommateurs, sauf très petites entreprises. Un particulier n'est pas dans la liste : ici, c'est un choix de qualité | [Légifrance](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000037388867), [DGCCRF](https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/professionnels-vos-produits-et-services-doivent-etre-conformes-la-directive-accessibilite) |

## Ce qui n'a pas pu être vérifié

- L'alinéa de l'article L34-5 qui définit la prospection n'a été lu que sur des copies non officielles : à relire
  sur Légifrance avant de le citer.
- Le II de l'article 85 (droits des héritiers) et le texte français qui transpose la directive sur
  l'accessibilité n'ont pas été ouverts.
- Si le site relève un jour du Code de la consommation (L221-1, III : service numérique fourni contre des
  données personnelles) : c'est une question pour un juriste.
- Aucun essai n'a été fait avec un lecteur d'écran réel.
