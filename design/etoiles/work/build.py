# -*- coding: utf-8 -*-
"""Construit etoiles.json et contrôle les longueurs. Aucune donnée n'est téléchargée ici."""
import json, os, sys

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "etoiles.json")
WS = "Lu le wikitexte de la page via l'API MediaWiki de Wikisource (transcription placée en regard du fac-similé ; l'image du fac-similé elle-même n'a pas été regardée). "
C = "https://commons.wikimedia.org/wiki/File:"

E = []

def add(**k):
    E.append(k)

add(nom="Marie Bashkirtseff", naissance="1858", mort="1884", pays="Ukraine",
    qui="Peintre et diariste née près de Poltava, formée à Paris ; son journal a paru après sa mort.",
    citation_originale="À quoi bon mentir et poser ? Oui, il est évident que j’ai le désir, sinon l’espoir, de rester sur cette terre, par quelque moyen que ce soit.",
    langue="français", citation_fr="À quoi bon mentir et poser ? Oui, il est évident que j’ai le désir, sinon l’espoir, de rester sur cette terre, par quelque moyen que ce soit.",
    traduction="originale",
    oeuvre="Journal de Marie Bashkirtseff, Paris, G. Charpentier et Cie (1re édition 1887 ; édition lue : 1890), tome premier",
    annee_oeuvre="1887 (édition lue : 1890)",
    localisation="Préface, premières phrases ; tome 1, p. 5 selon la pagination indiquée par Wikisource (page 8 du fichier)",
    source_url="https://fr.wikisource.org/wiki/Page:Bashkirtseff_-_Journal,_1890,_tome_1.pdf/8",
    source_type="fac-similé",
    verification=WS + "Les deux phrases y figurent mot pour mot ; « rester » est en italique dans l'édition. La suite : « Si je ne meurs pas jeune, j’espère rester comme une grande artiste ; mais si je meurs jeune, je veux laisser publier mon journal […] ». La date de la préface n'a pas été relue.",
    controle_apocryphe="Aucun signalement d'apocryphe trouvé ; la phrase est dans l'édition originale. Point d'attention (connaissance générale, non revérifiée en ligne pendant cette recherche) : le Journal de 1887 a été coupé et retouché par la famille ; la préface est néanmoins donnée comme de sa main.",
    portrait_url=C + "Marie_Bashkirtseff1878.jpg", portrait_auteur="Auteur inconnu (« Unknown author »)", portrait_date="1878",
    portrait_licence="Public domain (catégories de la page : PD Old, CC-PD-Mark)", confiance="haute")

add(nom="Emily Dickinson", naissance="1830", mort="1886", pays="États-Unis",
    qui="Poétesse d'Amherst (Massachusetts) ; presque toute son œuvre a été publiée après sa mort.",
    citation_originale="This is my letter to the world,\nThat never wrote to me,—\nThe simple news that Nature told,\nWith tender majesty.\n\nHer message is committed\nTo hands I cannot see;\nFor love of her, sweet countrymen,\nJudge tenderly of me!",
    langue="anglais",
    citation_fr="Ceci est ma lettre au monde,\nQui ne m'a jamais écrit, —\nLes simples nouvelles que la Nature a dites,\nAvec une tendre majesté.\n\nSon message est confié\nÀ des mains que je ne peux voir ;\nPour l'amour d'elle, doux compatriotes,\nJugez-moi avec tendresse !",
    traduction="traduction du musée, à relire",
    oeuvre="Poems by Emily Dickinson, éd. Mabel Loomis Todd et T. W. Higginson, Boston, Roberts Brothers",
    annee_oeuvre="1890 (posthume)",
    localisation="Poème liminaire sans titre (« Prelude » sur Wikisource), page 17 du fichier numérisé",
    source_url="https://en.wikisource.org/wiki/Page:Emily_Dickinson_Poems_(1890).djvu/17",
    source_type="fac-similé",
    verification=WS + "Les huit vers sont reproduits tels que transcrits, ponctuation de 1890 comprise.",
    controle_apocryphe="Recherche de la phrase sur en.wikiquote : la page « Emily Dickinson » donne la leçon du manuscrit (« This is my letter to the World / That never wrote to Me – »). L'édition de 1890 a donc normalisé majuscules et tirets : texte authentique, mais ponctuation des éditeurs. À décider par le musée : garder 1890 (lu) ou adopter la leçon manuscrite (à vérifier sur les Emily Dickinson Archive, non consultées).",
    portrait_url=C + "Black-white_photograph_of_Emily_Dickinson2.png", portrait_auteur="Auteur inconnu (daguerréotype ; source indiquée : Amherst College)", portrait_date="entre 1846 et 1847",
    portrait_licence="Public domain (catégories : PD US ; Author died more than 100 years ago public domain images ; CC-PD-Mark)", confiance="haute")

add(nom="Olympe de Gouges", naissance="1748", mort="1793", pays="France",
    qui="Femme de lettres, autrice de la Déclaration des droits de la femme et de la citoyenne (1791).",
    citation_originale="Je légue mon cœur à la patrie, ma probité aux hommes (ils en ont besoin). Mon âme aux femmes, je ne leur fais pas un don indifférent […]",
    langue="français", citation_fr="Je lègue mon cœur à la patrie, ma probité aux hommes (ils en ont besoin). Mon âme aux femmes, je ne leur fais pas un don indifférent […]",
    traduction="originale",
    oeuvre="Testament politique d’Olympe de Gouges (brochure)", annee_oeuvre="1793",
    localisation="p. 10 (début de l'énumération des legs)",
    source_url="https://fr.wikisource.org/wiki/Page:Gouges_-_Testament_(1793).djvu/10",
    source_type="fac-similé",
    verification=WS + "Texte lu p. 10 avec la graphie d'époque « légue » ; la phrase se poursuit après le point-virgule (« mon génie créateur aux auteurs dramatiques… »), d'où le […]. citation_fr corrige seulement l'accent (« lègue »).",
    controle_apocryphe="Aucun signalement d'apocryphe trouvé ; brochure imprimée de son vivant, lue en fac-similé transcrit. Date de naissance : 1748 dans les sources françaises usuelles, mais la description courte d'en.wikipedia lue par API indique 1746 : à trancher.",
    portrait_url=C + "Olympe_de_Gouges.png", portrait_auteur="Alexander Kucharsky (pastel)", portrait_date="XVIIIe siècle (« 18 th century »)",
    portrait_licence="Public domain (catégories : PD-Art (PD-old-auto-expired) ; PD-old-100-expired ; CC-PD-Mark)", confiance="haute")

add(nom="Toru Dutt", naissance="1856", mort="1877", pays="Inde",
    qui="Poétesse bengalie de Calcutta, écrivant en anglais et en français, morte à 21 ans.",
    citation_originale="[…] and though weak the verse\nThat would thy beauty fain, oh fain rehearse.\nMay Love defend thee from Oblivion's curse.",
    langue="anglais",
    citation_fr="[…] et si faible que soit le vers\nqui voudrait tant, oh ! tant redire ta beauté,\npuisse l'Amour te défendre de la malédiction de l'Oubli.",
    traduction="traduction du musée, à relire",
    oeuvre="Ancient Ballads and Legends of Hindustan, Londres, Kegan Paul, Trench & Co.", annee_oeuvre="1882 (posthume ; l'année de l'exemplaire numérisé n'a pas été relue)",
    localisation="« Our Casuarina Tree », trois derniers vers, p. 139",
    source_url="https://en.wikisource.org/wiki/Page:Ancient_Ballads_and_Legends_of_Hindustan.djvu/175",
    source_type="fac-similé",
    verification=WS + "Derniers vers de la p. 139, adressés à l'arbre de son enfance, lié au souvenir de son frère et de sa sœur morts. Le premier vers cité commence au milieu d'un vers (d'où le […]).",
    controle_apocryphe="Aucun signalement d'apocryphe trouvé. Variante de ponctuation constatée dans une autre édition présente sur Wikisource (The Bengali Book of English Verse : « rehearse, / … curse! »).",
    portrait_url=C + "Toru_Dutt_portrait.jpg", portrait_auteur="Champ auteur de la page : « Harihar Das » (auteur du livre source, Life and Letters of Toru Dutt) ; photographe non indiqué", portrait_date="1921 (date de publication du livre source)",
    portrait_licence="Public domain (catégories : PD India ; PD US expired)", confiance="haute")

add(nom="Marina Tsvetaïeva", naissance="1892", mort="1941", pays="Russie",
    qui="Poétesse russe née à Moscou, exilée à Prague puis à Paris, rentrée en URSS en 1939.",
    citation_originale="Разбросанным в пыли по магазинам,\nГде их никто не брал и не берёт,\nМоим стихам, как драгоценным винам,\nНастанет свой черёд.",
    langue="russe",
    citation_fr="Éparpillés dans la poussière des librairies,\nOù personne ne les prenait ni ne les prend,\nMes vers, comme les vins précieux,\nAuront leur tour.",
    traduction="traduction du musée, à relire",
    oeuvre="Poème « Моим стихам, написанным так рано… »", annee_oeuvre="1913",
    localisation="Dernière strophe ; poème daté « Коктебель, 13 мая 1913 »",
    source_url="https://ru.wikisource.org/wiki/Моим_стихам,_написанным_так_рано_(Цветаева)",
    source_type="texte édité",
    verification="Lu le wikitexte de la page ru.wikisource (texte édité, sans fac-similé ; source déclarée par la page : site « Наследие Марины Цветаевой », tsvetayeva.com, non consulté). La strophe et la date y figurent.",
    controle_apocryphe="Aucun signalement d'apocryphe trouvé ; poème de son canon. Aucune édition imprimée numérisée n'a été lue : c'est la raison de la confiance « moyenne ». Les traductions françaises publiées que je connais sont de traducteurs encore sous droits.",
    portrait_url=C + "Марина_Цветаева_(1925)_(cropped).jpg", portrait_auteur="Pierre Choumoff", portrait_date="1925",
    portrait_licence="Public domain (catégories : PD-Russia ; Author died more than 70 years ago public domain images ; CC-PD-Mark)", confiance="moyenne")

add(nom="Lessia Oukraïnka", naissance="1871", mort="1913", pays="Ukraine",
    qui="Poétesse et dramaturge ukrainienne (Laryssa Kossatch), malade de la tuberculose dès l'enfance.",
    citation_originale="Ні, я хочу крізь сльози сміятись,\nСеред лиха співати пісні́,\nБез надії таки сподіватись,\nЖити хочу! Геть думи сумні!",
    langue="ukrainien",
    citation_fr="Non, je veux rire à travers les larmes,\nChanter des chansons au milieu du malheur,\nEspérer malgré tout, sans espoir,\nJe veux vivre ! Arrière, pensées tristes !",
    traduction="traduction du musée, à relire",
    oeuvre="« Contra spem spero! », dans le recueil На крилах пісень (Sur les ailes des chants), Lviv", annee_oeuvre="1892 (millésime du fichier numérisé ; date de composition non relue)",
    localisation="Deuxième strophe ; page 13 du fichier numérisé",
    source_url="https://uk.wikisource.org/wiki/Сторінка:Леся_Українка._На_крилах_пісень._1892.pdf/13",
    source_type="fac-similé",
    verification=WS + "Strophe lue telle quelle, avec l'accent tonique imprimé sur « пісні́ ».",
    controle_apocryphe="Aucun signalement d'apocryphe trouvé. Variantes de ponctuation constatées dans des anthologies présentes sur uk.wikisource (1903, 1918) ; le texte retenu est celui du premier recueil.",
    portrait_url=C + "Lesya_Ukrainka_portrait.jpg", portrait_auteur="Non identifié (champ auteur de la page : « н. »)", portrait_date="1886 selon la page (date à confirmer)",
    portrait_licence="Public domain (catégories : PD Old ; CC-PD-Mark)", confiance="haute")

add(nom="Li Qingzhao (李清照)", naissance="1084", mort="vers 1155", pays="Chine",
    qui="Poétesse de la dynastie Song, collectionneuse d'inscriptions anciennes avec son mari Zhao Mingcheng.",
    citation_originale="今日忽閱此書，如見故人。",
    langue="chinois classique",
    citation_fr="Aujourd'hui, en rouvrant par hasard ce livre, j'ai cru revoir un vieil ami.",
    traduction="traduction du musée, à relire",
    oeuvre="《金石錄後序》, postface au Catalogue des inscriptions sur bronze et sur pierre (金石錄) de Zhao Mingcheng", annee_oeuvre="1132 (date portée par le texte lu : 紹興二年 ; datation discutée)",
    localisation="Avant-dernier développement du texte, paragraphe commençant par « 今日忽閱此書 »",
    source_url="https://zh.wikisource.org/wiki/金石錄後序_(李清照)",
    source_type="texte édité",
    verification="Lu le wikitexte complet de la page zh.wikisource (texte ponctué, sans fac-similé). Recoupé avec la transcription de l'édition Siku quanshu (https://zh.wikisource.org/wiki/金石録_(四庫全書本)/卷30), qui porte « 今日忽閲此書如見故人 » (même phrase, sans ponctuation, variante graphique 閲). La phrase suivante diffère entre les deux transcriptions (來/束) : je ne l'ai donc pas citée.",
    controle_apocryphe="Aucun signalement d'apocryphe trouvé ; le texte est aussi résumé par Hong Mai (容齋四筆, XIIe s., lu sur zh.wikisource). Limites : citation de 12 caractères (le critère 60-300 n'est tenu que par la traduction) ; ponctuation moderne.",
    portrait_url=C + "Song_dynasty_poet_Li_Qingzhao.jpg", portrait_auteur="Jiang Xun (peintre de la dynastie Qing) — portrait imaginaire, postérieur de sept siècles", portrait_date="1784–1821",
    portrait_licence="Public domain (catégories : PD-old-70-expired ; CC-PD-Mark)", confiance="moyenne")

add(nom="Marie Curie", naissance="1867", mort="1934", pays="France",
    qui="Physicienne et chimiste née à Varsovie, deux fois prix Nobel (1903 et 1911).",
    citation_originale="J’espère cependant que l’image qu’il donne de Pierre Curie n’est point déformée et qu’elle aidera à conserver sa mémoire. Je souhaite aussi qu’elle évoque, pour ceux qui l’ont connu, les raisons pour lesquelles ils l’ont aimé.",
    langue="français", citation_fr="J’espère cependant que l’image qu’il donne de Pierre Curie n’est point déformée et qu’elle aidera à conserver sa mémoire. Je souhaite aussi qu’elle évoque, pour ceux qui l’ont connu, les raisons pour lesquelles ils l’ont aimé.",
    traduction="originale",
    oeuvre="Marie Curie, Pierre Curie, Paris, Payot", annee_oeuvre="1924 (édition lue)",
    localisation="Préface signée « Mme Curie », dernier paragraphe (page 7 du fichier numérisé)",
    source_url="https://fr.wikisource.org/wiki/Page:Curie_-_Pierre_Curie,_1924.djvu/7",
    source_type="fac-similé",
    verification=WS + "Le paragraphe commence par « Ce récit n’est certes ni complet, ni parfait. » ; les deux phrases citées suivent immédiatement.",
    controle_apocryphe="Aucun signalement d'apocryphe trouvé pour cette phrase. À l'inverse, la citation la plus répandue sous son nom (« Nothing in life is to be feared… ») n'apparaît sur en.wikiquote que de seconde main (« as quoted ») : je l'ai écartée (voir ecartees.md).",
    portrait_url=C + "Marie_Curie_c._1920s.jpg", portrait_auteur="Henri Manuel", portrait_date="vers 1920",
    portrait_licence="Public domain (catégories : PD-old-75-expired ; CC-PD-Mark)", confiance="haute")

add(nom="Sor Juana Inés de la Cruz", naissance="1648", mort="1695", pays="Mexique",
    qui="Religieuse hiéronymite de Mexico, poétesse et savante de la Nouvelle-Espagne.",
    citation_originale="Yo no estudio para escribir, ni menos para enseñar (que fuera en mí desmedida soberbia), sino sólo por ver si con estudiar ignoro menos. Así lo respondo y así lo siento.",
    langue="espagnol",
    citation_fr="Je n'étudie pas pour écrire, et moins encore pour enseigner (ce qui serait en moi un orgueil démesuré), mais seulement pour voir si, en étudiant, j'ignore moins. Ainsi je le réponds, et ainsi je le sens.",
    traduction="traduction du musée, à relire",
    oeuvre="Respuesta a sor Filotea de la Cruz", annee_oeuvre="1691 (publication posthume en 1700 ; dates non relues sur une édition)",
    localisation="Premier tiers de la lettre, après « …torcer la genuina inteligencia de algún lugar. »",
    source_url="https://es.wikisource.org/wiki/Respuesta_a_sor_Filotea_de_la_Cruz",
    source_type="texte édité",
    verification="Phrases lues dans deux extraits renvoyés par la recherche plein texte de l'API es.wikisource sur cette page (texte édité en orthographe modernisée, sans fac-similé). La page entière (78 000 octets) n'a pas été relue.",
    controle_apocryphe="Aucun signalement d'apocryphe trouvé. Aucune édition ancienne numérisée (Fama y obras póstumas, 1700) ni édition savante n'a été consultée : confiance « moyenne ». Naissance : 1648 ou 1651 selon les sources.",
    portrait_url=C + "Sor_Juana_by_Miguel_Cabrera_(cropped).jpg", portrait_auteur="Miguel Cabrera — portrait posthume", portrait_date="vers 1750",
    portrait_licence="Public domain (catégories : PD-Art (PD-old-auto-expired) ; PD-old-100-expired ; CC-PD-Mark)", confiance="moyenne")

add(nom="Mary Seacole", naissance="1805", mort="1881", pays="Jamaïque",
    qui="Soignante et hôtelière jamaïcaine ; a soigné au Panama puis des soldats pendant la guerre de Crimée.",
    citation_originale="I am not ashamed to confess—for the gratification is, after all, a selfish one—that I love to be of service to those who need a woman’s help. And wherever the need arises—on whatever distant shore—I ask no greater or higher privilege than to minister to it.",
    langue="anglais",
    citation_fr="Je n'ai pas honte de l'avouer — la satisfaction en est, après tout, égoïste : j'aime rendre service à ceux qui ont besoin de l'aide d'une femme. Et partout où ce besoin se fait sentir — sur n'importe quel rivage lointain — je ne demande pas de privilège plus grand ni plus haut que d'y répondre.",
    traduction="traduction du musée, à relire",
    oeuvre="Wonderful Adventures of Mrs. Seacole in Many Lands, Londres, James Blackwood", annee_oeuvre="1857",
    localisation="Chapitre IV, p. 26 (repère [Pg 26] de la transcription)",
    source_url="https://www.gutenberg.org/files/23031/23031-h/23031-h.htm",
    source_type="texte édité",
    verification="Passage lu dans les extraits textuels de la page Project Gutenberg n° 23031 renvoyés par le moteur de recherche (accès direct à gutenberg.org bloqué), et recoupé avec deux autres transcriptions concordantes : digital.library.upenn.edu/women/seacole/adventures/adventures.html et standardebooks.org (chapitre 4). Pas de fac-similé regardé.",
    controle_apocryphe="La version gravée sur sa statue à Londres et souvent citée inverse deux mots (« no higher or greater privilege ») : le livre porte « no greater or higher privilege ». Aucun doute d'attribution trouvé.",
    portrait_url=C + "Mary_Jane_Seacole.jpeg", portrait_auteur="Auteur inconnu (« Unknown author »)", portrait_date="avant 1881",
    portrait_licence="Public domain (catégories : PD-UK ; PD US expired ; PD Old (assumed) ; CC-PD-Mark)", confiance="haute")

add(nom="Raden Adjeng Kartini", naissance="1879", mort="1904", pays="Indonésie",
    qui="Épistolière javanaise de Jepara, engagée pour l'instruction des filles.",
    citation_originale="Ik heb zóó verlangd kennis te maken met een „modern meisje”, het fiere, zelfstandige meisje, dat zoo ten volle mijne sympathie heeft, dat met vluggen, flinken tred haar weg door ’t leven gaat, vroolijk en opgeruimd, vol geestdrift en warm gevoel […]",
    langue="néerlandais",
    citation_fr="J'ai tant désiré faire la connaissance d'une « jeune fille moderne », la jeune fille fière et indépendante qui a toute ma sympathie, qui va son chemin dans la vie d'un pas vif et décidé, gaie et de bonne humeur, pleine d'enthousiasme et de chaleur […]",
    traduction="traduction du musée, à relire",
    oeuvre="Door Duisternis tot Licht. Gedachten over en voor het Javaansche volk (lettres réunies par J. H. Abendanon)", annee_oeuvre="1911 (lettre de 1899)",
    localisation="Première lettre du recueil, « Japara, 25 Mei 1899. (I.) », première phrase (page 23 du fichier numérisé)",
    source_url="https://nl.wikisource.org/wiki/Pagina:Kartini_-_Door_Duisternis_Tot_Licht_(1911).djvu/23",
    source_type="fac-similé",
    verification=WS + "Première phrase de la lettre ; elle continue (« arbeidend niet voor eigen heil en geluk alleen… »), d'où le […]. Le nom de la destinataire n'est pas sur la page lue.",
    controle_apocryphe="Aucun signalement d'apocryphe trouvé pendant la recherche. Point d'attention (connaissance générale, non revérifiée en ligne) : le recueil de 1911 est un choix de lettres coupées par l'éditeur Abendanon ; les dates de naissance et de mort n'ont pas été relues en ligne.",
    portrait_url=C + "Potret_kartini_8_1.jpg", portrait_auteur="Auteur inconnu (« Unknown author ») ; image extraite d'un livre", portrait_date="photo vers 1900–1922, livre publié en 1922 (mention de la page)",
    portrait_licence="Public domain (catégories : PD-1996 ; PD Indonesia Old ; PD Old auto: no death date)", confiance="haute")

add(nom="Michel de Montaigne", naissance="1533", mort="1592", pays="France",
    qui="Magistrat et écrivain périgourdin, auteur des Essais.",
    citation_originale="Ie l’ay voué à la commodité particuliere de mes parens et amis : à ce que m’ayans perdu (ce qu’ils ont à faire bien tost) ils y puissent retrouuer aucuns traicts de mes conditions et humeurs, et que par ce moyen ils nourrissent plus entiere et plus visue la connoissance qu’ils ont eu de moy.",
    langue="français (XVIe siècle)",
    citation_fr="Je l'ai voué à la commodité particulière de mes parents et amis : à ce que m'ayant perdu (ce qu'ils ont à faire bientôt) ils y puissent retrouver quelques traits de mes conditions et humeurs, et que par ce moyen ils nourrissent plus entière et plus vive la connaissance qu'ils ont eue de moi.",
    traduction="originale",
    oeuvre="Les Essais, avis « Au lecteur » (texte de l'édition de 1595, reproduit dans l'édition Firmin-Didot de 1907, tome 1)", annee_oeuvre="1580 (avis daté du 1er mars 1580)",
    localisation="« Au lecteur », troisième phrase ; page 34 du fichier numérisé",
    source_url="https://fr.wikisource.org/wiki/Page:Montaigne_-_Essais,_Didot,_1907,_tome_1.djvu/34",
    source_type="fac-similé",
    verification=WS + "La note de l'édition précise que le texte est collationné sur l'exemplaire de 1595 de la BnF. La transcription porte « plus visue » : sans doute « vifue » (vive), un s long ou un f mal lu ; à vérifier sur l'image. citation_fr est une simple modernisation de l'orthographe par le musée (« aucuns » rendu par « quelques »), à relire.",
    controle_apocryphe="Aucun signalement d'apocryphe ; texte liminaire de toutes les éditions. Variantes connues entre éditions anciennes (la recherche plein texte de Wikisource trouve aussi la leçon « quelques traicts » citée par un dictionnaire) : indiquer l'édition suivie.",
    portrait_url=C + "Portrait_of_Michel_de_Montaigne,_circa_unknown.jpg", portrait_auteur="Auteur inconnu (« Unknown author »)", portrait_date="années 1570",
    portrait_licence="Public domain (catégories : PD-Art (PD-old-100-expired) ; CC-PD-Mark)", confiance="haute")

add(nom="Ludwig van Beethoven", naissance="1770", mort="1827", pays="Allemagne",
    qui="Compositeur né à Bonn, établi à Vienne, devenu sourd.",
    citation_originale="lebt wohl und Vergeßt mich nicht ganz im Tode, ich habe es um euch verdient, indem ich in meinem Leben oft an euch gedacht, euch glücklich zu machen, seyd es –",
    langue="allemand",
    citation_fr="Adieu, et ne m'oubliez pas tout à fait dans la mort ; je l'ai mérité de vous, car dans ma vie j'ai souvent pensé à vous, à vous rendre heureux ; soyez-le –",
    traduction="traduction du musée, à relire",
    oeuvre="Lettre à ses frères Carl et Johann, dite « Testament de Heiligenstadt » (jamais envoyée)", annee_oeuvre="1802",
    localisation="Fin du texte principal, juste avant la signature et la date « Heiglnstadt am 6ten october 1802 » (troisième page de l'autographe)",
    source_url="https://de.wikisource.org/wiki/Seite:Heiligenstädter_Testament.pdf/3",
    source_type="fac-similé",
    verification=WS + "La page donne la transcription de Sieghard Brandenburg (Briefwechsel Gesamtausgabe, t. 1, lettre 106, Henle, 1996) avec les images de l'autographe conservé à Hambourg (SUB, ND VI 4281). Orthographe de Beethoven conservée (majuscule à « Vergeßt », « seyd »).",
    controle_apocryphe="Recherche de la phrase sur de.wikiquote : aucun résultat, aucun signalement. Document autographe, authenticité non discutée. La phrase suit un passage sombre sur la mort : à citer sans le contexte immédiat.",
    portrait_url=C + "Joseph_Karl_Stieler's_Beethoven_mit_dem_Manuskript_der_Missa_solemnis.jpg", portrait_auteur="Joseph Karl Stieler", portrait_date="1820",
    portrait_licence="Public domain (catégories : PD-Art (PD-old-100-expired) ; CC-PD-Mark)", confiance="haute")

add(nom="Rabindranath Tagore", naissance="1861", mort="1941", pays="Inde",
    qui="Poète, musicien et pédagogue bengali, prix Nobel de littérature en 1913.",
    citation_originale="When I go from hence let this be my parting word, that what I have seen is unsurpassable.",
    langue="anglais (version de l'auteur d'après son poème bengali)",
    citation_fr="Lorsque je m’en irai d’ici, que ceci soit mon mot de partance : que ce que j’ai vu est insurpassable.",
    traduction="publiée : André Gide (mort en 1951), L’Offrande lyrique, NRF, édition de 1917, poème XCVI, https://fr.wikisource.org/wiki/Page:Tagore_-_L’Offrande_lyrique.djvu/168",
    oeuvre="Gitanjali (Song Offerings), Londres, Macmillan", annee_oeuvre="1913 (édition lue ; date de la 1re édition non relue)",
    localisation="Poème 96, p. 88, première phrase",
    source_url="https://en.wikisource.org/wiki/Page:Gitanjali.djvu/118",
    source_type="fac-similé",
    verification=WS + "Phrase lue p. 88. Traduction de Gide lue de la même façon sur fr.wikisource (page 168 du fichier).",
    controle_apocryphe="Recherche de la phrase sur en.wikiquote : aucun résultat, aucun signalement. Variante d'auteur constatée : la transcription du manuscrit Rothenstein sur en.wikisource porte « When I leave from hence… ». Le texte anglais est la version en prose de Tagore lui-même, pas une traduction littérale du bengali.",
    portrait_url=C + "Rabindranath_Tagore_in_1909.jpg", portrait_auteur="Generalstabens litografiska anstalt (reproduction parue dans Les Prix Nobel 1913, 1914)", portrait_date="1909",
    portrait_licence="Public domain (catégories : PD-old-100-expired ; CC-PD-Mark)", confiance="haute")

add(nom="Khalil Gibran", naissance="1883", mort="1931", pays="Liban",
    qui="Poète et peintre né à Bcharré, émigré aux États-Unis, écrivant en arabe et en anglais.",
    citation_originale="If in the twilight of memory we should meet once more, we shall speak again together and you shall sing to me a deeper song.",
    langue="anglais",
    citation_fr="Si, au crépuscule de la mémoire, nous devions nous rencontrer une fois encore, nous parlerons de nouveau ensemble et vous me chanterez un chant plus profond.",
    traduction="traduction du musée, à relire",
    oeuvre="The Prophet, New York, Alfred A. Knopf", annee_oeuvre="1923 (exemplaire lu : tirage de 1926)",
    localisation="Dernier chapitre (l'adieu d'Almustafa), p. 106",
    source_url="https://en.wikisource.org/wiki/Page:Kahlil_Gibran_-_The_Prophet_(1926_edition,_Knopf).pdf/128",
    source_type="fac-similé",
    verification=WS + "Phrase lue p. 106 du tirage Knopf de 1926.",
    controle_apocryphe="Recherche sur en.wikiquote : la phrase n'y apparaît que sous une forme réécrite pour le film de 2014 (« we will speak together again ») ; le livre porte « we shall speak again together ». Beaucoup de fausses citations circulent sous le nom de Gibran : s'en tenir au texte du livre.",
    portrait_url=C + "Kahlil_Gibran_1913.jpg", portrait_auteur="Auteur inconnu (« Unknown author »)", portrait_date="avril 1913",
    portrait_licence="Public domain (catégorie : PD US)", confiance="haute")

add(nom="Taras Chevtchenko", naissance="1814", mort="1861", pays="Ukraine",
    qui="Poète et peintre ukrainien, né serf, affranchi en 1838, exilé dix ans par le régime tsariste.",
    citation_originale="І мене в семї великій,\nВ семї вольній, новій,\nНе забудьте помянути\nНезлим, тихим словом!",
    langue="ukrainien",
    citation_fr="Et dans la grande famille,\nLa famille libre et nouvelle,\nN'oubliez pas de m'évoquer\nD'un mot sans colère, d'un mot doux.",
    traduction="traduction du musée, à relire",
    oeuvre="Poème « Як умру, то поховайте… », dit « Заповіт » (Le Testament) ; lu dans l'anthologie Струни, t. 1, Berlin, 1922", annee_oeuvre="1845 (édition lue : 1922)",
    localisation="Quatre derniers vers ; p. 131 de l'anthologie (page 141 du fichier numérisé)",
    source_url="https://uk.wikisource.org/wiki/Сторінка:Струни._Антольоґія_української_поезії._Т._1.djvu/141",
    source_type="fac-similé",
    verification=WS + "Graphie de l'édition de 1922 (sans apostrophes). Les éditions actuelles écrivent « сем'ї », « пом'янути » et « Незлим тихим словом. » : à harmoniser sur une édition académique, non consultée. La date du 25 décembre 1845 est lue dans un extrait de journal de 1915 renvoyé par la recherche uk.wikisource.",
    controle_apocryphe="Aucun signalement d'apocryphe ; poème canonique. À savoir : les vers juste avant appellent à briser les chaînes et à « arroser la liberté du sang ennemi » ; le quatrain retenu est la partie apaisée du poème.",
    portrait_url=C + "Т._Г._Шевченко._Квітень_1859.jpg", portrait_auteur="Andrey Denyer (photographe)", portrait_date="avril 1858 selon le champ date, 1859 selon le titre du fichier",
    portrait_licence="Public domain (catégories : PD-Ukraine ; PD-old-100-expired ; CC-PD-Mark)", confiance="haute")

add(nom="Augustin d'Hippone", naissance="354", mort="430", pays="Algérie",
    qui="Philosophe et évêque né à Thagaste (Souk Ahras), mort à Hippone (Annaba).",
    citation_originale="Magna ista vis est memoriae, magna nimis, Deus meus, penetrale amplum et infinitum.",
    langue="latin",
    citation_fr="Que cette puissance de la mémoire est grande ! Grande, ô mon Dieu ! sanctuaire impénétrable, infini !",
    traduction="publiée : M. Moreau, dans Œuvres complètes de saint Augustin, éd. Raulx, tome I (1864), https://fr.wikisource.org/wiki/Page:Augustin_-_Œuvres_complètes,_éd._Raulx,_tome_I.djvu/468",
    oeuvre="Confessiones (Les Confessions)", annee_oeuvre="vers 397-401",
    localisation="Livre X, chapitre 8, § 15",
    source_url="https://la.wikisource.org/wiki/Confessiones_(ed._Migne)/10",
    source_type="texte édité",
    verification="Phrase lue dans l'extrait renvoyé par la recherche plein texte de l'API la.wikisource (texte de l'édition Migne, § 15), identique dans la seconde édition latine du site (Confessiones/Liber Decimus). Traduction lue dans l'extrait de la page 468 du tome I de l'édition Raulx (fac-similé transcrit) ; le nom du traducteur (« M. Moreau ») est lu dans la table du même tome (page 578 du fichier). Date de décès du traducteur non relue : traduction parue en 1864.",
    controle_apocryphe="Aucun signalement pour cette phrase, lue dans l'œuvre. Attention à une confusion fréquente en France : le texte « La mort n'est rien, je suis seulement passé dans la pièce à côté » n'est ni d'Augustin ni de Péguy (voir ecartees.md).",
    portrait_url=C + "Saint_Augustine_by_Philippe_de_Champaigne.jpg", portrait_auteur="Philippe de Champaigne — portrait imaginaire, peint douze siècles plus tard", portrait_date="vers 1645-1650",
    portrait_licence="Public domain (catégories : PD-Art (PD-old-auto-expired) ; PD-old-100-expired ; CC-PD-Mark)", confiance="haute")

add(nom="Ibn Battûta", naissance="1304", mort="1368 ou 1369", pays="Maroc",
    qui="Voyageur né à Tanger ; il a parcouru l'Afrique, l'Asie et l'Europe pendant près de trente ans.",
    citation_originale="فحزمت أمرى على هجر الأحباب من الإناث والذكور، وفارقت وطني مفارقة الطيور للوكور. وكان والداي بقيد الحياة فتحملت لبعدهما وصبا، ولقيت كما لقيا من الفراق نصبا",
    langue="arabe",
    citation_fr="Je me déterminai donc à me séparer de mes amis des deux sexes, et j’abandonnai ma demeure comme les oiseaux abandonnent leur nid. Mon père et ma mère étaient encore en vie. Je me résignai douloureusement à me séparer d’eux, et ce fut pour moi comme pour eux une cause de maladie.",
    traduction="publiée : C. Defrémery et B. R. Sanguinetti, Voyages d’Ibn Batoutah, tome 1, 1853, https://fr.wikisource.org/wiki/Page:Ibn_Battuta_-_Voyages_-_Traduction_Sanguinetti_-_Volume_1.djvu/71",
    oeuvre="تحفة النظار في غرائب الأمصار وعجائب الأسفار (la « Rihla »), récit dicté à Ibn Juzayy", annee_oeuvre="vers 1355 (date non relue)",
    localisation="Début du récit : départ de Tanger, 2 rajab 725 de l'hégire (14 juin 1325 selon la traduction)",
    source_url="https://ar.wikisource.org/wiki/تحفة_النظار_في_غرائب_الأمصار_وعجائب_الأسفار/الجزء_الأول/فصل:بدء_الرحلة_والخروج_من_طنجة",
    source_type="texte édité",
    verification="Texte arabe lu dans le wikitexte de la page ar.wikisource (texte édité, sans fac-similé ; la graphie « أمرى » est celle de la page). Traduction lue dans le wikitexte de la page 71 du tome 1 sur fr.wikisource (fac-similé transcrit). Années de décès des traducteurs non relues ; traduction de 1853.",
    controle_apocryphe="Aucun signalement pour ce passage. Limite propre à l'œuvre : le récit a été dicté puis mis en forme par le lettré Ibn Juzayy, dont la voix apparaît dans le texte même (« Ibn Djozay raconte ce qui suit »). La prose rimée de cette phrase peut lui devoir beaucoup.",
    portrait_url=C + "Handmade_oil_painting_reproduction_of_Ibn_Battuta_in_Egypt,_a_painting_by_Hippolyte_Leon_Benett..jpg", portrait_auteur="Léon Benett — illustration imaginaire pour Jules Verne, Découverte de la Terre (Hetzel, 1878, p. 81)", portrait_date="1878",
    portrait_licence="Public domain (catégorie : PD France ; la page porte aussi « Images from Gallica to be checked »)", confiance="moyenne")

add(nom="Constantin Cavafy", naissance="1863", mort="1933", pays="Égypte",
    qui="Poète grec d'Alexandrie, employé de l'administration des irrigations.",
    citation_originale="Η Ιθάκη σ' έδωσε το ωραίο ταξίδι.\nΧωρίς αυτήν δεν θάβγαινες στον δρόμο.",
    langue="grec moderne",
    citation_fr="Ithaque t'a donné le beau voyage.\nSans elle, tu ne te serais pas mis en route.",
    traduction="traduction du musée, à relire",
    oeuvre="Poème « Ιθάκη » (Ithaque)", annee_oeuvre="1911 (écrit en 1910, selon la note de la page)",
    localisation="Avant-dernière strophe, deux premiers vers",
    source_url="https://el.wikisource.org/wiki/Ιθάκη",
    source_type="texte édité",
    verification="Lu le wikitexte complet de la page el.wikisource (texte édité en graphie monotonique, sans fac-similé). Le site des archives Cavafy (Fondation Onassis) n'a pas été consulté.",
    controle_apocryphe="Aucun signalement d'apocryphe ; poème canonique. Confiance « moyenne » parce que la graphie d'origine (polytonique) n'a pas été vérifiée sur une édition savante.",
    portrait_url=C + "Konstantinos_Kavafis.jpg", portrait_auteur="Photographe inconnu (« signed: Pacino ») ; source indiquée : C.P. Cavafy Archives - Onassis Foundation", portrait_date="avant 1933",
    portrait_licence="Public domain (catégories : PD Old ; CC-PD-Mark) — année de décès du photographe non établie par la page", confiance="moyenne")

add(nom="Olaudah Equiano", naissance="vers 1745", mort="1797", pays="Nigeria",
    qui="Marin et écrivain, ancien esclave devenu une voix du mouvement abolitionniste britannique.",
    citation_originale="I am not so foolishly vain as to expect from it either immortality or literary reputation.",
    langue="anglais",
    citation_fr="Je n'ai pas la sotte vanité d'en attendre l'immortalité ni une réputation littéraire.",
    traduction="traduction du musée, à relire",
    oeuvre="The Interesting Narrative of the Life of Olaudah Equiano, or Gustavus Vassa, the African (1re édition : Londres, 1789)", annee_oeuvre="1789 (édition lue : celle que Wikisource date de 1794)",
    localisation="Chapitre I, p. 2",
    source_url="https://en.wikisource.org/wiki/Page:The_Interesting_Narrative_of_the_Life_of_Olaudah_Equiano,_or_Gustavus_Vassa,_the_African.pdf/46",
    source_type="fac-similé",
    verification=WS + "Phrase lue p. 2. La phrase suivante (« If it affords any satisfaction to my numerous friends… or in the smallest degree promotes the interests of humanity… ») aurait été un meilleur choix, mais la transcription porte « will by fully attained » p. 3 : coquille à vérifier sur l'image avant de la citer.",
    controle_apocryphe="Recherche sur en.wikiquote : aucun signalement. Point d'attention (connaissance générale, non revérifiée en ligne) : son lieu de naissance, en pays igbo selon son récit, est discuté par des historiens ; le champ « pays » suit son récit.",
    portrait_url=C + "Olaudah_Equiano_-_Project_Gutenberg_eText_15399_(cropped).png", portrait_auteur="Auteur inconnu selon la page (gravure du frontispice)", portrait_date="publié pour la première fois en 1789",
    portrait_licence="Public domain (catégories : PD-Art (PD-old-100) ; CC-PD-Mark)", confiance="haute")

add(nom="Horace", naissance="-65", mort="-8", pays="Italie",
    qui="Poète latin né à Venouse, fils d'affranchi, auteur des Odes, des Satires et des Épîtres.",
    citation_originale="non omnis moriar multaque pars mei\nvitabit Libitinam; usque ego postera\ncrescam laude recens",
    langue="latin",
    citation_fr="Je ne mourrai pas tout entier, et une grande part de moi-même évitera la Déesse funèbre. Je grandirai dans la postérité, rajeuni par la louange",
    traduction="publiée : Leconte de Lisle (mort en 1894), Œuvres d’Horace, tome I, ode III, 30, p. 153, https://fr.wikisource.org/wiki/Page:Horace_-_Œuvres,_trad._Leconte_de_Lisle,_I.djvu/161",
    oeuvre="Carmina (Odes)", annee_oeuvre="-23",
    localisation="Livre III, ode 30, vers 6 à 8",
    source_url="https://la.wikisource.org/wiki/Carmina_(Horatius)/Liber_III/Carmen_XXX",
    source_type="texte édité",
    verification="Lu le wikitexte complet de la page la.wikisource (texte édité, sans fac-similé ; ponctuation et minuscules de cette édition). Traduction lue dans le wikitexte de la page 161 du fichier de l'édition Leconte de Lisle sur fr.wikisource (fac-similé transcrit) ; l'année de cette édition n'a pas été relue.",
    controle_apocryphe="Aucun signalement d'apocryphe ; texte canonique. « Libitina » est la déesse des funérailles : la traduction de Leconte de Lisle (« Déesse funèbre ») sonne plus sombre que le vers latin ; le musée peut s'arrêter après « tout entier ».",
    portrait_url=C + "Quintus_Horatius_Flaccus.jpg", portrait_auteur="Anton von Werner — portrait imaginaire (numérisé d'un livre de 1905)", portrait_date="date inconnue (« Unknown date »)",
    portrait_licence="Public domain (catégories : PD-Art (PD-old-auto) ; PD-old-100 ; CC-PD-Mark)", confiance="haute")

add(nom="Hafez de Chiraz", naissance="vers 1325", mort="vers 1390", pays="Iran",
    qui="Poète persan de Chiraz, maître du ghazal.",
    citation_originale="هرگز نمیرد آن که دلش زنده شد به عشق\nثبت است بر جریدهٔ عالم دوام ما",
    langue="persan",
    citation_fr="Jamais ne meurt celui dont le cœur a pris vie par l'amour ;\nnotre durée est inscrite au registre du monde.",
    traduction="traduction du musée, à relire",
    oeuvre="Divan, ghazal n° 11 (numérotation du site Ganjoor)", annee_oeuvre="XIVe siècle",
    localisation="Ghazal 11, troisième distique",
    source_url="https://ganjoor.net/hafez/ghazal/sh11",
    source_type="texte édité",
    verification="Lu le ghazal entier sur ganjoor.net (bibliothèque numérique de poésie persane ; texte édité avec voyelles ajoutées, que j'ai retirées sauf le « ٔ » de l'ezafé). L'édition critique sur laquelle repose ce texte n'est pas indiquée de façon vérifiable sur la page.",
    controle_apocryphe="Recherche du distique sur fa.wikiquote : aucun résultat, aucun signalement. Les manuscrits du Divan divergent d'un recueil à l'autre : à confronter à une édition critique (Qazvini-Ghani ou Khanlari), non consultée.",
    portrait_url=C + "Anselm_Feuerbach_Hafis_vor_der_Schenke_(cropped).jpg", portrait_auteur="Anselm Feuerbach — tableau orientaliste imaginaire (Kunsthalle Mannheim)", portrait_date="1852",
    portrait_licence="Public domain (catégories : PD-Art (PD-old-100-expired) ; CC-PD-Mark)", confiance="moyenne")

add(nom="Katsushika Hokusai (葛飾北斎)", naissance="1760", mort="1849", pays="Japon",
    qui="Peintre et dessinateur d'estampes d'Edo, auteur des Trente-six vues du mont Fuji.",
    citation_originale="七十三才にして稍禽獣虫魚の骨格草木の出生を悟し得たり 故に八十歳にしてハ益ゝ進み九十歳にて猶其奥意を極め 一百歳にして正に神妙ならん歟",
    langue="japonais",
    citation_fr="À 73 ans, j'ai un peu compris la structure des oiseaux, des bêtes, des insectes et des poissons, la croissance des herbes et des arbres. Aussi, à 80 ans j'aurai encore progressé, à 90 ans j'en pénétrerai le sens profond, et à 100 ans j'atteindrai peut-être au merveilleux.",
    traduction="traduction du musée, à relire",
    oeuvre="『富嶽百景』初編, postface (跋文) du premier volume des Cent vues du mont Fuji", annee_oeuvre="1834",
    localisation="Postface imprimée à la fin du premier volume, signée « 七十五齢前北斎為一改画狂老人卍筆 »",
    source_url="https://shimane-art-museum-ukiyoe.jp/nagata/c-nagata/h56-01.html",
    source_type="archive",
    verification="Transcription lue sur la page du musée d'art de la préfecture de Shimane (collection Nagata) dans l'extrait renvoyé par le moteur de recherche. Fac-similé de la page imprimée sur Commons (https://commons.wikimedia.org/wiki/File:Hugaku100kei_batsubun.jpg, PD-Japan), dont je n'ai lu que la notice, pas l'écriture cursive.",
    controle_apocryphe="Recherche sur en.wikiquote : aucun signalement. Texte imprimé du vivant de l'auteur, attribution sûre ; mais les transcriptions diffèrent sur des détails (此/比, 描く/画く, 才/歳) entre le musée, ja.wikipedia et un site spécialisé (ukiyo-e.co.jp) : à faire relire sur le fac-similé par un japonisant.",
    portrait_url=C + "Hokusai_as_an_old_man.jpg", portrait_auteur="Champ auteur vide sur la page (« missing name ») ; source : Smithsonian, Freer Gallery of Art, F1904.282", portrait_date="date inconnue (« Unknown date »)",
    portrait_licence="CC0", confiance="moyenne")

add(nom="Vincent van Gogh", naissance="1853", mort="1890", pays="Pays-Bas",
    qui="Peintre néerlandais ; il a travaillé surtout en France et laissé une vaste correspondance.",
    citation_originale="Je voudrais, tu vois, je suis loin de dire que je puisse faire tout cela mais enfin j'y tends, je voudrais faire des portraits qui un siècle plus tard aux gens d'alors apparussent comme des apparitions.",
    langue="français", citation_fr="Je voudrais, tu vois, je suis loin de dire que je puisse faire tout cela mais enfin j'y tends, je voudrais faire des portraits qui un siècle plus tard aux gens d'alors apparussent comme des apparitions.",
    traduction="originale",
    oeuvre="Lettre à sa sœur Willemien (W22 dans l'ancienne numérotation)", annee_oeuvre="1890",
    localisation="Auvers-sur-Oise, 5 juin 1890 ; paragraphe commençant par « Ce qui me passionne le plus »",
    source_url="https://www.webexhibits.org/vangogh/letter/21/W22-fr.htm",
    source_type="texte édité",
    verification="Lettre lue en entier, en français, dans l'extrait de la page webexhibits.org renvoyé par le moteur de recherche. L'édition savante de référence (vangoghletters.org, Musée Van Gogh et Institut Huygens) était inaccessible depuis cet environnement : ni son numéro de lettre ni sa transcription diplomatique n'ont pu être relus.",
    controle_apocryphe="Recherche de la phrase sur fr.wikiquote : aucun résultat, aucun signalement. Lettre écrite en français de sa main ; la ponctuation peut différer dans l'édition savante. La date de la lettre est une restitution d'éditeur.",
    portrait_url=C + "Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_(454045).jpg", portrait_auteur="Vincent van Gogh (autoportrait, Art Institute of Chicago)", portrait_date="1887",
    portrait_licence="Public domain (catégories : PD-Art (PD-old-100-expired) ; CC-PD-Mark)", confiance="moyenne")

KEYS = ["nom","naissance","mort","pays","qui","citation_originale","langue","citation_fr","traduction","oeuvre","annee_oeuvre","localisation","source_url","source_type","verification","controle_apocryphe","portrait_url","portrait_auteur","portrait_date","portrait_licence","confiance"]
ok = True
for e in E:
    missing = [k for k in KEYS if k not in e]
    extra = [k for k in e if k not in KEYS]
    lo, lf, lq = len(e["citation_originale"]), len(e["citation_fr"]), len(e["qui"])
    flag = []
    if missing or extra: flag.append("CLES %s %s" % (missing, extra))
    if lq > 120: flag.append("QUI>120")
    if not (60 <= lo <= 300): flag.append("ORIG hors 60-300")
    if not (60 <= lf <= 300): flag.append("FR hors 60-300")
    if e["source_type"] not in ("fac-similé","texte édité","archive"): flag.append("TYPE")
    if e["confiance"] not in ("haute","moyenne"): flag.append("CONF")
    print("%-28s orig=%3d fr=%3d qui=%3d %s %s" % (e["nom"][:28], lo, lf, lq, e["confiance"], " | ".join(flag)))
    if any(f for f in flag if not f.startswith("ORIG")): ok = False
with open(OUT, "w", encoding="utf-8") as f:
    json.dump([{k: e[k] for k in KEYS} for e in E], f, ensure_ascii=False, indent=2)
print(len(E), "fiches ; haute =", sum(e["confiance"]=="haute" for e in E), "; moyenne =", sum(e["confiance"]=="moyenne" for e in E), "; controle", "OK" if ok else "A CORRIGER")
