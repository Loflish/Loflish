/**
 * La coupe des bulles (26 octobre) : les 253 matières (A 0 à 100, B 1 à 100, C 1 à 52) s'affrontent deux à deux
 * jusqu'à ce qu'il en reste 100. Chaque duel oppose deux bulles qui se ressemblent (appariées à l'œil par Claude,
 * famille par famille) : la moins belle des deux « jumelles » part, et les 100 qui restent ne se répètent pas.
 *
 * 1er tour : 126 duels de jumelles (l'aquarelle cousue, n° 0, est exemptée) → 127.
 * 2e tour : 27 duels entre les gagnantes des paires les plus proches → 100.
 * Les 48 bulles C à venir (29 octobre) défieront ensuite chacune sa plus proche parmi les 100.
 */
const a = (n: number) => n;
const b = (n: number) => 100 + n;
const c = (n: number) => 200 + n;

/** l'aquarelle cousue, l'une des préférées de Tom, passe directement */
export const EXEMPTEE = a(0);

export const TOUR1: [number, number][] = [
  // spirales et cercles concentriques
  [a(93), b(2)], //   0 cernes peints / cernes d'un tronc
  [a(30), a(63)], //  1
  [a(34), a(75)], //  2
  [a(31), a(70)], //  3 spirales
  [a(66), a(45)], //  4 tourbillons
  [b(18), c(11)], //  5 nautile / chaînette en spirale
  [c(23), c(40)], //  6 spirales de Klimt / fil d'or
  [b(48), b(50)], //  7 empreinte digitale / lignes de la main
  [b(80), c(26)], //  8 mandala / étoiles à huit branches
  // rayonnantes
  [a(35), a(87)], //  9
  [a(43), a(91)], // 10
  [a(44), a(10)], // 11
  [b(5), b(6)], //   12 tournesol / lamelles
  [b(49), a(89)], // 13 iris / œil sombre
  [a(54), b(73)], // 14 éclats / feux d'artifice
  // un cœur sombre
  [a(6), a(21)], //  15
  [a(46), a(26)], // 16
  // formes superposées, géométrie
  [a(88), a(64)], // 17
  [a(22), a(36)], // 18
  [a(62), c(36)], // 19 cercles superposés / pavement aux cercles
  [a(40), a(72)], // 20
  [a(16), c(27)], // 21 cristaux / tesselles
  [b(16), c(28)], // 22 ruche / muqarnas
  [c(24), c(42)], // 23 carrés et ovales de Klimt
  [c(33), c(32)], // 24 voûte d'ogives / arcs entrelacés
  [b(78), c(35)], // 25 vitrail / rosace
  [c(18), c(20)], // 26 papier peint / tapisserie
  [c(19), c(12)], // 27 carreaux / point de croix
  [c(31), c(44)], // 28 rinceaux / arabesques
  // bandes et horizons
  [a(18), a(19)], // 29
  [a(2), a(29)], //  30
  [a(25), a(86)], // 31
  [a(27), a(65)], // 32
  [a(60), a(71)], // 33
  [a(52), a(67)], // 34
  [a(47), a(98)], // 35
  [a(38), a(28)], // 36
  // moitiés et croissants
  [a(7), a(76)], //  37
  [a(8), a(73)], //  38
  [a(68), b(21)], // 39 croissant / lune
  // mouchetés, étoiles
  [a(13), a(39)], // 40
  [a(90), a(85)], // 41
  [a(57), a(80)], // 42
  [a(58), a(94)], // 43
  [a(12), a(82)], // 44
  [b(20), c(52)], // 45 voie lactée / ciel aux ruines
  [b(22), b(23)], // 46 flocons / givre
  [b(24), b(25)], // 47 aurore / éclair
  // marbrures, nuages
  [a(14), a(78)], // 48
  [a(37), a(69)], // 49
  [a(42), a(74)], // 50
  [b(19), c(51)], // 51 nuages / tours dans la brume
  [c(29), a(92)], // 52 lavis / disque uni
  [b(28), a(96)], // 53 marbre veiné / craquelures
  [a(3), a(32)], //  54
  // efflorescences
  [a(61), a(99)], // 55
  [a(53), a(55)], // 56
  [c(46), b(8)], //  57 dentelle organique / branches d'hiver
  [b(3), b(14)], //  58 mousse / poils fins
  [a(23), a(79)], // 59 coulures
  // réseaux, craquelures
  [a(50), b(29)], // 60 réseau / terre craquelée
  [b(84), b(69)], // 61 mur fissuré / briques
  [b(17), b(64)], // 62 toile d'araignée / filet
  [a(97), c(13)], // 63 hachures / lin effiloché
  [b(30), b(1)], //  64 delta / nervures
  // gouttes et bulles
  [a(17), a(56)], // 65
  [b(39), c(30)], // 66 bulles de savon / constellation de bulles
  [b(81), b(83)], // 67 larmes / pluie
  [b(37), c(7)], //  68 billes / boutons
  // fête et lumières
  [b(74), b(99)], // 69 lanternes / lumignons
  [b(79), c(49)], // 70 bougies / rayons dans l'église
  [b(72), b(40)], // 71 confettis / cerfs-volants
  [b(71), b(12)], // 72 foule / étourneaux
  // textiles et broderies
  [a(5), c(1)], //   73 dentelle / napperon
  [c(2), b(34)], //  74 crochet / layette
  [b(67), b(33)], // 75 tricot / osier
  [b(47), b(90)], // 76 tresse / cheveux blancs
  [c(3), c(14)], //  77 tulle / organza
  [c(4), c(6)], //   78 points avant / mots cousus
  [c(15), c(47)], // 79 feutre / nuno
  [c(16), c(17)], // 80 mèches de soie / laine cardée
  [c(8), c(37)], //  81 patchwork / collage Ruth Rae
  [c(39), b(66)], // 82 envers de broderie / bobines
  [c(9), c(10)], //  83 sashiko / points de nœud
  [c(38), c(5)], //  84 jardin brodé / cœur brodé
  // le végétal
  [a(81), b(95)], // 85 ginkgo / feuilles mortes
  [a(95), b(97)], // 86 fleur / pétales tombés
  [a(77), c(21)], // 87 feuilles flottantes / nymphéas
  [a(15), b(9)], //  88 plumes / plumes
  [b(4), c(25)], //  89 crosses de fougère / arbre de vie
  [b(46), c(41)], // 90 bouquet / jardin de Klimt
  [c(45), c(50)], // 91 saule / glycine
  [b(7), b(52)], //  92 herbes hautes / épis de blé
  [b(62), b(63)], // 93 sillons / rizières
  [b(100), b(96)], // 94 graines / pissenlit
  // l'eau, le sable
  [b(27), c(22)], // 95 vagues / reflets
  [b(86), b(11)], // 96 barques / banc de poissons
  [b(26), b(35)], // 97 dunes / premiers pas dans le sable
  // les bêtes
  [b(10), b(13)], // 98 écailles / léopard
  [b(15), c(48)], // 99 papillon / paons
  // le corps, les mains
  [b(31), b(32)], // 100 main de bébé / empreintes de pieds
  [b(38), b(36)], // 101 marelle / dessins d'enfant
  [b(41), b(91)], // 102 mains entrelacées / mains âgées
  [b(61), b(65)], // 103 mains calleuses / mains de potier
  [b(89), b(82)], // 104 rides / cicatrice
  [b(88), b(87)], // 105 pansements / barbelés fleuris
  // la maison, les objets
  [b(44), b(45)], // 106 alliances / cadenas
  [b(51), b(60)], // 107 pain / tablée
  [b(53), b(54)], // 108 oranges / grenade
  [b(55), b(56)], // 109 café / soupe
  [b(58), b(94)], // 110 clés / rouages
  [b(92), b(42)], // 111 photos / lettres
  [b(75), b(76)], // 112 partition / piano
  // les anneaux
  [a(1), a(4)], //   113
  [a(9), a(20)], //  114
  [a(41), a(49)], // 115
  [a(24), a(48)], // 116
  [a(11), a(33)], // 117
  [a(51), a(59)], // 118
  [a(83), a(84)], // 119
  // les dernières, rapprochées au mieux
  [b(59), c(34)], // 120 fenêtres / colonnes
  [b(70), c(43)], // 121 ville vue du ciel / paysage en aplats
  [b(77), a(100)], // 122 coups de pinceau / taches au bord
  [b(85), b(57)], // 123 valises / linge
  [b(93), b(98)], // 124 sablier / pierres empilées
  [b(68), b(43)], // 125 outils / cœurs gravés
];

/** 2e tour : les gagnantes de deux duels du 1er tour (leurs numéros ci-dessus), choisis parmi les familles les plus serrées */
export const TOUR2: [number, number][] = [
  [1, 2], // cercles concentriques
  [3, 4], // spirales, tourbillons
  [9, 10], // rayonnantes
  [15, 16], // cœurs sombres
  [17, 18], // superpositions
  [29, 30], // bandes en biais
  [31, 32], // bandes horizontales
  [33, 34], // horizons
  [36, 37], // moitiés
  [40, 41], // mouchetés
  [42, 43], // grains et points
  [48, 50], // nuages, marbrures
  [49, 54], // marbrures
  [113, 117], // anneaux
  [114, 115], // halos
  [116, 119], // anneaux sombres
  [55, 56], // efflorescences
  [118, 52], // disques presque unis
  [44, 46], // étoiles, flocons, givre
  [45, 47], // ciels de nuit
  [65, 66], // gouttes et bulles
  [73, 74], // dentelle, crochet
  [77, 78], // tissus légers, points
  [79, 80], // laine, feutre
  [81, 82], // patchwork, fils
  [90, 91], // fleurs
  [24, 25], // l'église gothique
];

/** l'ordre de passage du 1er tour : les familles s'alternent (47 est premier avec 126) */
export const ORDRE_TOUR1 = TOUR1.map((_, i) => (i * 47) % TOUR1.length);
