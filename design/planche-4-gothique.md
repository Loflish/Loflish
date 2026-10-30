# Planche 4 : les filaments gothiques

**Direction de Tom (nuit du 30 au 31/10/2026).** Partir de la bulle n° 80 de la planche 3 : ce qu'il aime, ce sont les fils et le côté abstrait derrière. Une matière dramatique et gothique, presque religieuse, aussi forte que Beksiński mais abstraite, en contraste avec les couleurs, et pourtant douce et apaisante. Un fil différent sur chaque bulle. Le trait brodé toujours.

**La recette.** Trois couches : un fond abstrait (encre noire mouillée, sans bord), une forme à peine dite (voûte, souffle, couronne), un geste de fil. Les 100 bulles sont listées dans `planche-4-gothique.json` (`fils`, `fonds`, `bulles`) et découpées par `hd/taches_gothique.py`.

## Ce que j'ai vu chez Beksiński

J'ai parcouru les [708 œuvres de WikiArt](https://www.wikiart.org/en/zdzislaw-beksinski/all-works), en vignettes, puis une vingtaine plus grandes. Le musée de Sanok décrit les œuvres tardives : parfois [« composed of countless lines »](https://muzeum.sanok.pl/en/zdzislaw-beksinski/), parfois une forme qui semble sortir de l'espace peint. Ce que je garde, c'est une manière, jamais un tableau, ni ses corps, ni ses crânes, ni ses croix :

| Ce qu'il fait | Œuvres regardées (numéros WikiArt de ma liste) | Ce que ça devient ici |
|---|---|---|
| Un disque entier fait de fibres, cœur sombre, lueur autour | 391, 682 | Famille Fibres : le nid, le dôme, le buisson |
| Une masse immense seule dans le vide, bord perdu dans la brume | 453, 454, 265 | Famille Masses |
| Une nef de fils qui pendent, lumière tout en haut | 289, 473 | La nef, le faisceau |
| Des murs dissous en filet de lignes pâles sur noir | 397, 398 | Fils griffés en clair dans le noir |
| Un voile de lignes tombant d'un seul point | 540, 505 | Le voile en ogive, le grand pli |
| Une lumière étroite entre deux masses sombres | 608 | La porte, les lancettes |
| Un éventail de veines dans un soleil | 490 | Le soleil noir, l'éclipse |
| Des lignes qui suivent la forme comme des fibres | 329, 331 | Les ailes, les souffles |

Son vrai drame tient à cinq choses : une seule masse monumentale, une seule lumière, tout semble tissé, les bords se perdent, le silence.

## 21 façons de tracer un fil

| Fil | Geste | Source vérifiée |
|---|---|---|
| `soie` | Innombrables lignes lentes, qui s'amincissent | [Sanok](https://muzeum.sanok.pl/en/zdzislaw-beksinski/) |
| `griffe` | Lignes pâles griffées dans le noir | [Tobey, écriture blanche, Seattle Art Museum](https://samblog.seattleartmuseum.org/2012/02/samart-white-writing/) ; [Wols, grattage, Menil](https://storage.production.menil.org/twill/35db3b80-655b-4ed7-b9f6-71ad07f74b37/Wols_GalleryGuide_2013.pdf) |
| `sec` | Pinceau sec dont les poils se séparent en fils parallèles : le « blanc volant » | [Asian Art Museum](https://education.asianart.org/resources/an-introduction-to-chinese-character-and-brushstrokes/) ; [musée du Palais, Pékin](https://www.dpm.org.cn/lemmas/240500.html) |
| `brume` | Grands arcs et lignes nerveuses projetés au pulvérisateur | [Hartung, Tate Papers](https://www.tate.org.uk/research/tate-papers/very-late-style-hans-hartung) |
| `fagot` | Lignes fouettées avec des branches d'olivier | [Hartung, Tate Papers](https://www.tate.org.uk/research/tate-papers/very-late-style-hans-hartung) |
| `tremble` | Séisme miniature, milliers de tremblements | [Michaux, Courtauld](https://courtauld.ac.uk/wp-content/uploads/2025/02/Micahux-for-website.pdf) |
| `grille` | Grille cassée, désalignée, sans centre | [Gego, MACBA](https://www.macba.cat/en/obra/r4344-reticularea/) ; [Guggenheim Bilbao](https://www.guggenheim-bilbao.eus/en/exhibition/dibujos-sin-papel-ca-1976-88) |
| `branche` | Filaments qui se divisent, chacun séparé des autres | [Cajal : des cellules individuelles, pas un réseau continu, Grey Art Museum](https://greyartmuseum.nyu.edu/exhibitions/the-beautiful-brain-the-drawings-of-santiago-ramon-y-cajal) |
| `reserve` | Filaments pâles laissés en réserve, comme une empreinte de lumière | [Atkins, The Met](https://www.metmuseum.org/art/collection/search/286656) ; [NYPL](https://digitalcollections.nypl.org/collections/photographs-of-british-algae-cyanotype-impressions) |
| `boucle` | Une ligne qui s'enroule, tracée avec un long bâton | [Marden, The Met](https://www.metmuseum.org/art/collection/search/360170) |
| `eau` | Lignes d'eau, qui suivent le courant et se recourbent dans le tourbillon | [Léonard : l'eau a deux mouvements, comme les cheveux, Cité des sciences](https://www.cite-sciences.fr/au-programme/expos-temporaires/leonard-de-vinci/manuscrits-leonard-vinci/acc/old-man-swirling-water.html) ; [Ma Yuan, musée du Palais](https://www.dpm.org.cn/collection/paint/229607.html) |
| `flottant` | Anneaux d'encre flottante, étirés par un souffle | [Suminagashi, The Met](https://www.metmuseum.org/perspectives/playing-with-paper) ; [University of Washington](https://content.lib.washington.edu/dpweb/essay1.html) |
| `botte` | Traits rapides d'un pinceau en botte, qui se dissolvent dans la brume | [Tōhaku, Pins, musée de Tokyo](https://www.tnm.jp/modules/r_free_page/index.php?id=657&lang=en) ; [ColBase](https://colbase.nich.go.jp/collection_items/tnm/A-10471?locale=en) |
| `fouet` | Un seul trait, épais et fin, avec un virage brusque | [Obrist, Kunsthalle München](https://www.kunsthalle-muc.de/en/jugendstil/) ; [Web Gallery of Art](https://www.wga.hu/html/o/obrist/textile2.html) |
| `chanvre` | Longues fibres ondulées, côte à côte | [Asian Art Museum](https://education.asianart.org/resources/an-introduction-to-chinese-character-and-brushstrokes/) |
| `pendu` | Fils tendus, droits et parallèles | [Tawney, Drawings in Air](https://lenoretawney.org/work/drawing/drawings-in-air/) ; [Clouds](https://lenoretawney.org/work/fiber/clouds/) |
| `rayon` | Lignes droites qui rayonnent de points cachés | [Kunz, Serpentine](https://www.serpentinegalleries.org/whats-on/emma-kunz-visionary-drawings-exhibition-conceived-christodoulos-panayiotou/) |
| `une` | Une seule ligne qui ne quitte jamais le papier | [Asawa, SFMOMA](https://asawa.access.sfmoma.org/3/) |
| `flamme` | Filaments étirés autour d'un disque noir | [Couronne solaire, NASA](https://science.gsfc.nasa.gov/attic/eclipse2017.gsfc.nasa.gov/helmet-streamers.html) |
| `etoile` | Longs fils entre de petits nœuds, autour de vides | [Toile cosmique, NASA](https://science.nasa.gov/universe/galaxies/large-scale-structures/) ; [ESA](https://www.esa.int/ESA_Multimedia/Images/2025/06/Simulation_of_the_cosmic_web) |
| `hachure` | Le noir construit par la ligne seule, comme une gravure | Dessins de Beksiński regardés (208 à 255 de ma liste) |

Wols apporte aussi une idée pour *La couture* : pour la Menil, ses griffures [« seem to depict stitches »](https://www.menil.org/index.php/collection/objects/5211-untitled-composition), à la fois violence et guérison. Ça rejoint le trait brodé du site.

## Gothique, sans symbole

- **La voûte.** L'arc brisé et les nervures ont permis de [dissoudre le mur](https://www.metmuseum.org/essays/gothic-art) : la pierre devient lignes, et le regard est tiré vers le haut.
- **La voûte en éventail.** Des nervures identiques [rayonnent comme les jets d'une fontaine](https://royalsocietypublishing.org/rspa/article/477/2246/20200893/82344/Statics-of-fan-vaulting-current-state-of-knowledge) : c'est déjà un dessin de filaments.
- **La lumière.** Suger veut [passer de la lumière à la contemplation](https://smarthistory.org/birth-of-the-gothic-abbot-suger-and-the-ambulatory-at-st-denis/) en ouvrant les murs.
- **Les plis.** Sur les pleurants de Dijon, [le drapé devient aussi expressif qu'un visage](https://smarthistory.org/claus-sluter-with-claus-de-werve-mourners/) : l'émotion sans corps, exactement ce qu'il nous faut.

**Décision.** Pas de croix ni d'autre signe d'une religion : le musée accueille tout le monde. Le sacré passe par l'élan, la lumière et le silence.

## Réglages de la matière

- `paintTache` écrasait les noirs (mélange à 28 %) et tournait chaque bulle au hasard. Pour les matières à partir de 5000 (`MATIERE_ENCRE`) : gris à pleine force, sens conservé, réduction de haute qualité pour que les fils ne s'émiettent pas. Les autres bulles ne changent pas.
- `VOILE = 0,36` : même le plus pâle reste de la couleur. À 0,17, le côté pâle faisait un reflet.
- `ENCRE = 0,1` : la couleur de la personne tombe à 10 % dans les noirs. C'est là que naît le contraste avec les couleurs.

## Ce qui a été écarté

- **Corps.** Des fils autour d'une fente verticale évoquent des poils et une anatomie : le mot `hair` est banni, on dit `lines`, `spider silk`. *Le grand pli* et *La tour de fibres* refaits pour cette raison.
- **Œil.** Un anneau autour d'un point sombre : *Le halo*, *L'éclipse* d'essai.
- **Trop dit.** Toile d'araignée, arbre, roseaux, rocher, rideau, arcades : remplacés ou refaits en plus abstrait.
- **Méduse.** Une masse d'où pendent des fils.
- **Tics de modèle.** « Une seule petite masse sombre » donnait toujours le même point noir ; « une petite région de lumière » faisait une boule brillante. 25 bulles refaites avec d'autres fonds.

## Modèle

Nano Banana 2.1 dans Google Flow, 1024 px, 0 crédit. Pro et Lite ont perdu le match sur la matière de la bulle 80 le 30/10, je ne les ai pas réessayés sur la recette gothique. Krea 2 Turbo (AI Horde) retrouve presque exactement la douceur de la bulle 80, mais trois essais ont pris 32 minutes.
