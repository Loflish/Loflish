import type { Trace } from './types';

/**
 * Seconde trace de référence, remplie : une mémoire déposée par une
 * petite-fille pour son grand-père. Les quatre questions n'appartiennent qu'aux
 * traces personnelles ; une mémoire commence par ce que l'on peut dire de la
 * personne (500 caractères), puis ses fragments.
 * Personne fictive, données de démonstration.
 */

const demo = (f: string) => `${import.meta.env.BASE_URL}demo/${f}`;

export const JEANNOT: Trace = {
  id: 'jeannot',
  nom: 'Jeannot',
  type: 'memoire',
  couleur: 'v3',
  pays: 'France',
  creeLe: '2 novembre 2025',
  majLe: '2 novembre 2025',
  scelleeLe: '2025-11-02T10:00:00.000Z',
  demo: true,
  memoire: {
    deposeePar: 'Léa',
    relation: 'Sa petite-fille',
    aperçu:
      'Mon grand-père était ébéniste à Amboise. Il parlait peu, mais ses mains disaient tout : elles redressaient les chaises bancales des voisins et semaient des radis avec moi chaque printemps. Il sifflait la même valse en travaillant, coupait la tarte en parts inégales pour que la plus grande soit pour moi, et disait qu’un jardin, c’est une lettre qu’on écrit à ceux qui viendront après.',
  },
  rubriques: {
    voir: [
      { id: 'jv1', texte: 'Les premiers radis qui sortent de terre, alignés comme des soldats timides.', medias: ['jm1'] },
      { id: 'jv2', texte: 'La Loire à Amboise, un soir de septembre, depuis le vieux pont.' },
    ],
    entendre: [
      { id: 'je1', texte: 'Il sifflait toujours la même valse en travaillant. On savait où il était dans la maison rien qu’à l’entendre.', medias: ['jm3'] },
      { id: 'je2', texte: 'Le rabot sur une planche de chêne.' },
    ],
    sentir: [{ id: 'js1', texte: 'La sciure de son atelier et le café réchauffé du thermos.' }],
    gouter: [
      { id: 'jg1', texte: 'Les tomates du jardin mangées tièdes, avec du sel, directement sur le pied.' },
      { id: 'jg2', texte: 'La tarte aux pommes de Mamie Odette, qu’il coupait toujours en parts inégales « pour qu’il y en ait une plus grande pour toi ».' },
    ],
    toucher: [{ id: 'jt1', texte: 'Ses mains, rugueuses et chaudes, qui tenaient les graines comme des trésors.', medias: ['jm4'] }],
    souvenirs: [
      { id: 'jso1', titre: 'Les radis', quand: 'Chaque printemps, 1998 à 2012', lieu: 'Amboise', texte: 'Il me laissait faire les trous avec mon doigt, puis il repassait derrière sans rien dire pour les remettre droits.', medias: ['jm1'] },
      { id: 'jso2', titre: 'La cabane', quand: 'Été 2004', texte: 'Il a construit une cabane dans le pommier en trois jours. Elle tient encore.' },
      { id: 'jso3', titre: 'Le dernier été', quand: '2023', texte: 'Il ne pouvait plus bêcher. Il m’a dicté le jardin depuis sa chaise, rang par rang.' },
    ],
    chapitres: [
      { id: 'jc1', titre: 'L’apprenti', quand: '1946 à 1952', texte: 'Entré à quatorze ans chez un ébéniste de Tours.' },
      { id: 'jc2', titre: 'L’atelier', quand: '1953 à 1994', texte: 'Quarante ans de meubles, dont la moitié des buffets du village.' },
      { id: 'jc3', titre: 'Le jardin', quand: '1994 à 2024', texte: 'La retraite, qu’il appelait « mon deuxième métier ».' },
    ],
    oeuvres: [{ id: 'jo1', titre: 'Sous le ciel de Paris', categorie: 'Chanson', texte: 'La valse qu’il sifflait. Il l’avait entendue au bal où il a rencontré Odette.' }],
    personnes: [
      { id: 'jpe1', titre: 'Odette', lien: 'Sa femme', texte: 'Cinquante-huit ans de mariage. Il disait qu’il l’avait choisie pour son rire, et gardée pour sa patience.' },
      { id: 'jpe2', titre: 'Léa', lien: 'Sa petite-fille (moi)', texte: 'Sa « petite jardinière ».' },
    ],
    lieux: [
      { id: 'jl1', titre: 'Le jardin de la rue des Tanneurs', lieu: 'Amboise', texte: 'Trois cents mètres carrés, et le monde entier dedans.' },
      { id: 'jl2', titre: 'L’atelier', lieu: 'Amboise', texte: 'La porte verte, l’établi, la radio toujours allumée.', medias: ['jm2'] },
    ],
    convictions: [{ id: 'jcv1', titre: 'Le travail bien fait', texte: 'Il ne faut pas que ça se voie, il faut que ça tienne.' }],
    objets: [{ id: 'job1', titre: 'Son rabot', texte: 'Le manche est usé à la forme de sa main. Je le garde sur mon bureau.', medias: ['jm2'] }],
    creations: [
      { id: 'jcr1', titre: 'Le buffet de la cuisine', quand: '1961', texte: 'En merisier. Il l’a fait pour Odette la première année.' },
      { id: 'jcr2', titre: 'Le carnet de semis', quand: '1994 à 2023', texte: 'Trente ans de semis notés à la main, avec la météo et parfois un dessin.', medias: ['jm5'] },
    ],
    accomplissements: [{ id: 'jac1', titre: 'Meilleur ouvrier du canton', quand: '1978', texte: 'Il n’en parlait jamais. On a trouvé le diplôme dans un tiroir.' }],
    aimeVivre: [{ id: 'ja1', texte: 'Voir son arrière-petit-enfant planter ses premiers radis.' }],
    petitesChoses: [
      { id: 'jpc1', texte: 'La radio le matin, les informations qu’il commentait à voix haute.' },
      { id: 'jpc2', texte: 'Un verre de vin du voisin, le dimanche.' },
      { id: 'jpc3', texte: 'Trouver le premier ver de terre de l’année.' },
    ],
  },
  medias: [
    { id: 'jm1', kind: 'image', titre: 'Le jardin au printemps', src: demo('jardin.webp'), teinte: '#DCE3D2', origine: 'voir' },
    { id: 'jm2', kind: 'image', titre: 'L’établi', src: demo('atelier.webp'), teinte: '#DDD2C2', origine: 'lieux' },
    { id: 'jm3', kind: 'audio', titre: 'La valse qu’il sifflait (retrouvée)', duree: '0:20', src: demo('valse.webm'), teinte: '#D8D4E4', origine: 'entendre' },
    { id: 'jm4', kind: 'image', titre: 'Ses mains', src: demo('mains.webp'), teinte: '#E2D6C9', origine: 'toucher' },
    { id: 'jm5', kind: 'document', titre: 'Le carnet de semis', nom: 'carnet-de-semis.pdf', mime: 'application/pdf', src: demo('carnet-de-semis.pdf'), teinte: '#E6E0CF', origine: 'creations' },
    { id: 'jf1', kind: 'image', titre: 'Le jardin au printemps', src: demo('jardin.webp'), teinte: '#DCE3D2', enAvant: true },
    { id: 'jf2', kind: 'audio', titre: 'La valse qu’il sifflait', duree: '0:20', src: demo('valse.webm'), teinte: '#D8D4E4', enAvant: true },
    { id: 'jf3', kind: 'image', titre: 'Ses mains', src: demo('mains.webp'), teinte: '#E2D6C9', enAvant: true },
    { id: 'jf4', kind: 'document', titre: 'Le carnet de semis', nom: 'carnet-de-semis.pdf', mime: 'application/pdf', src: demo('carnet-de-semis.pdf'), teinte: '#E6E0CF', enAvant: true },
    { id: 'jf5', kind: 'image', titre: 'L’établi', src: demo('atelier.webp'), teinte: '#DDD2C2', enAvant: true },
    { id: 'jf6', kind: 'lien', titre: 'Sous le ciel de Paris', url: 'https://fr.wikipedia.org/wiki/Sous_le_ciel_de_Paris_(chanson)', teinte: '#D9D3E4' },
  ],
};
