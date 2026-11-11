# Les 24 premières étoiles — méthode, limites, reste à faire

Recherche du 11 novembre 2026. Fichiers : `etoiles.json` (24 fiches), `ecartees.md` (citations et images écartées, fiches de réserve), `work/` (notes brutes et script de contrôle).

## Résultat en bref

- 24 fiches : 16 en confiance **haute**, 8 en confiance **moyenne**.
- 11 femmes, 13 hommes.
- 17 figures hors Europe occidentale et Amérique du Nord : Afrique et monde arabe ou persan 6 (Algérie, Maroc, Égypte, Nigeria, Liban, Iran), Asie 5 (Inde ×2, Chine, Indonésie, Japon), Europe de l'Est 4 (Ukraine ×3, Russie), Amérique latine et Caraïbes 2 (Mexique, Jamaïque).
- Siècles des textes : Antiquité 2, XIIe 1, XIVe 2, XVIe 1, XVIIe 1, XVIIIe 2, XIXe 10, XXe 5.
- Pas seulement des écrivains : une savante, une soignante, un compositeur, trois peintres, un voyageur, un marin abolitionniste, une militante de l'instruction des filles.
- Sources : 13 fac-similés transcrits, 10 textes édités, 1 page de musée.
- Traductions françaises : 5 citations sont en français d'origine, 4 ont une traduction publiée du domaine public (Gide, Moreau, Defrémery et Sanguinetti, Leconte de Lisle), 15 sont des « traductions du musée, à relire ».

## Méthode suivie

1. **Source d'abord.** Pour chaque figure, j'ai cherché l'œuvre numérisée avant de choisir la phrase. La plupart des lectures passent par l'API MediaWiki de Wikisource (dix langues) : recherche plein texte dans l'espace des pages de fac-similé, puis lecture du wikitexte de la page.
2. **Ce que « lu » veut dire.** J'ai lu des *transcriptions* placées en regard des fac-similés, pas les images elles-mêmes. Chaque fiche dit exactement ce qui a été lu (page entière, ou extrait renvoyé par un moteur de recherche).
3. **Contrôle adverse.** Recherche des phrases sur Wikiquote (anglais, français, allemand, persan), lecture de deux articles de Quote Investigator et de pages Wikipédia sur les attributions douteuses. Résultat fiche par fiche dans `controle_apocryphe`. Pour les textes lus dans l'œuvre, le risque n'est pas l'attribution mais la variante d'édition : c'est ce que les fiches signalent.
4. **Dates.** Naissances et morts relues dans les descriptions courtes d'en.wikipedia (par API), sauf Kartini et Li Qingzhao, dont la description ne donne pas de dates. Toutes les figures sont mortes avant 1955 ; les plus récentes sont Tagore et Tsvetaïeva (1941).
5. **Portraits.** Métadonnées lues par l'API de Wikimedia Commons : auteur, date, mention de licence (`LicenseShortName`) et catégories de licence de la page. Je n'ai pas lu le texte complet des bandeaux de licence.
6. **Échelle de confiance.** *Haute* : phrase lue dans un fac-similé transcrit ou dans des éditions concordantes, sans doute textuel connu. *Moyenne* : texte édité sans fac-similé, édition savante non consultée, ou transcriptions divergentes.

## Accès : ce qui a manqué

- L'accès direct (curl) était bloqué par le proxy de la session pour tous les sites.
- Inaccessibles : **vangoghletters.org** (édition savante des lettres de Van Gogh) et **gutenberg.org** en lecture directe. Internet Archive n'a été essayé qu'en accès direct (bloqué) ; Gallica n'a pas été essayé.
- Le service Firecrawl n'avait plus de crédits ; il n'a rien fourni.
- Conséquence : Seacole, Van Gogh et Hokusai sont lus dans des extraits de page renvoyés par un moteur de recherche, pas dans la page entière.

## À vérifier par un humain avant publication

### Sur l'image du fac-similé

| Fiche | Point à contrôler |
|---|---|
| Montaigne | La transcription porte « plus visue » ; lire probablement « vifue ». |
| Equiano | « will by fully attained » p. 3 : coquille ? Si c'est « be », la phrase suivante ferait une meilleure citation. Vérifier aussi l'année de l'édition numérisée (1794 selon Wikisource). |
| Dickinson | Choisir entre la ponctuation de 1890 (lue) et celle du manuscrit (majuscules et tirets). |
| Chevtchenko | Graphie de 1922 sans apostrophes ; aligner sur une édition académique. |
| Hokusai | Trois transcriptions diffèrent sur des détails ; relecture par un japonisant sur le fac-similé de Commons. |
| Bashkirtseff, Dutt, Oukraïnka, Tagore | Année exacte de l'exemplaire numérisé ou de la première édition, non relue. |

### Sur une édition savante

| Fiche | Édition à consulter |
|---|---|
| Van Gogh | vangoghletters.org : numéro de la lettre, ponctuation, date restituée. |
| Hafez | Une édition critique du Divan (Qazvini-Ghani ou Khanlari). |
| Cavafy | Archives Cavafy (Fondation Onassis) pour la graphie d'origine. |
| Sor Juana | *Fama y obras póstumas* (1700) ou une édition critique. |
| Tsvetaïeva | Une édition imprimée numérisée. |
| Li Qingzhao | Citation de 12 caractères : le critère 60-300 n'est tenu que par la traduction. Datation du texte discutée. |
| Ibn Battûta | Récit dicté puis rédigé par Ibn Juzayy : le dire dans la fiche publique. |

### Traductions

Relire les 15 « traductions du musée ». Elles sont littérales et sans prétention poétique, surtout pour le russe, l'ukrainien, le persan, le chinois, le japonais et le grec. Les années de décès de trois traducteurs anciens (Moreau, Defrémery, Sanguinetti) n'ont pas été relues ; leurs traductions datent de 1853 et 1864.

### Portraits

Ouvrir chaque page Commons et lire le bandeau de licence. Points faibles connus :

| Fiche | Problème |
|---|---|
| Augustin, Horace, Hafez, Ibn Battûta, Li Qingzhao | Portraits imaginaires, peints des siècles plus tard. Le dire au public, ou choisir une autre image. |
| Sor Juana | Portrait posthume (vers 1750). |
| Cavafy | Photographe « Pacino », année de décès inconnue : le statut domaine public repose sur une présomption. |
| Gibran | Seule catégorie de licence : « PD US » ; auteur inconnu. |
| Seacole | Catégorie « PD Old (assumed) ». |
| Kartini | Date floue (« vers 1900–1922 ») ; auteur inconnu. |
| Oukraïnka | Date « 1886 » douteuse ; auteur non identifié. |
| Chevtchenko | 1858 dans le champ date, 1859 dans le titre. |
| Toru Dutt | Le champ auteur donne l'auteur du livre source, pas le photographe. |
| Hokusai | Champ auteur vide ; attribution de l'autoportrait à confirmer sur la notice du Smithsonian. |
| Gouges | Identification du modèle non contrôlée ; année de naissance 1748 ou 1746 selon les sources. |

### Points de fond

- **Ton.** Trois citations touchent à la mort : Beethoven (« ne m'oubliez pas tout à fait dans la mort »), Horace (« la Déesse funèbre » dans la traduction publiée), Chevtchenko (quatrain final d'un poème-testament dont les vers précédents sont violents). Elles parlent du souvenir, pas du deuil, mais c'est au musée de juger.
- **Equiano.** Le pays « Nigeria » suit son propre récit ; son lieu de naissance est discuté (de mémoire, non revérifié).
- **Bashkirtseff et Kartini.** Textes publiés après leur mort par des éditeurs qui ont coupé (de mémoire, non revérifié) ; les phrases retenues figurent bien dans les éditions lues.
- **Trois figures ukrainiennes** (dont Bashkirtseff, qui a vécu en France) : équilibre à revoir si le musée le souhaite. Deux fiches de réserve existent (Martí, Su Shi) dans `ecartees.md`.
- **Droits.** Je n'ai pas fait d'analyse juridique. Le critère « mort avant 1955 » est tenu pour les 24 auteurs et pour Gide (1951). Les traducteurs modernes et les photographes morts après 1955 ont été évités quand je l'ai su.

## Ce que je n'ai pas pu vérifier

- Aucune image de fac-similé n'a été regardée.
- L'édition savante des lettres de Van Gogh.
- Les éditions critiques de Hafez, Cavafy, Sor Juana, Tsvetaïeva, Chevtchenko.
- Le texte complet des bandeaux de licence sur Commons.
- Les dates de Kartini et de Li Qingzhao, données de mémoire.
- La recherche d'apocryphes n'est pas exhaustive : Quote Investigator n'a été lu que pour deux citations écartées, pas interrogé pour chacune des 24.
