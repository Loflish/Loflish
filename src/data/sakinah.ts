import type { Trace } from './types';

/**
 * Profil de référence — reprend exactement le contenu de la maquette
 * « Proposition A révisée » (Sakinah, elle/her, pseudo : spacehey).
 * Données de démonstration.
 */
export const SAKINAH: Trace = {
  id: 'sakinah',
  nom: 'Sakinah',
  pronoms: 'elle/her',
  pseudo: 'spacehey',
  type: 'personnelle',
  couleur: 'b3',
  pays: 'France',
  creeLe: '12 juin 2024',
  majLe: '3 mars 2025',
  demo: true,
  questions: [
    'Sois fière. Tu as fait de ton mieux, même dans les moments difficiles. Tu as eu peur souvent, et tu as avancé quand même. Tu as appris à te pardonner tard, mais tu l’as appris. Repose-toi maintenant : tu n’as plus rien à prouver à personne, et surtout pas à toi.',
    'Merci d’avoir toujours été là, même quand les mots manquaient. Tu m’as appris qu’on peut aimer quelqu’un en silence, en préparant un thé, en laissant la lumière du couloir allumée. Si tu lis ceci, garde la lumière allumée pour quelqu’un d’autre.',
    'Prenez soin les uns des autres. La gentillesse change tout. Elle ne coûte presque rien et elle reste longtemps dans les gens, bien plus longtemps que ce qu’on imagine. Parlez aux inconnus dans les files d’attente. Appelez vos grands-parents. Plantez quelque chose.',
    'Une vie simple, remplie de curiosité, d’amitié et de petits bonheurs. J’espère avoir laissé un peu plus de douceur autour de moi.',
  ],
  q2Destinataire: 'ma sœur',
  rubriques: {
    sens: [
      { id: 's1', sens: 'voir', texte: 'Le soleil qui se couche sur l’océan à Essaouira, quand tout devient rose puis gris, et que les mouettes se taisent.', medias: ['m1'], enAvant: true },
      { id: 's2', sens: 'entendre', texte: 'La voix de ma grand-mère qui chantonne en cuisinant, un peu faux, toujours la même chanson.', medias: ['m5'], enAvant: true },
      { id: 's3', sens: 'sentir', texte: 'Le café du matin chez mes parents, mélangé à l’odeur du linge qui sèche.', medias: ['m2'], enAvant: true },
      { id: 's4', sens: 'gouter', texte: 'Les msemen chauds avec du miel, le dimanche.', enAvant: true },
      { id: 's5', sens: 'toucher', texte: 'Le pelage de Mimi, ma chatte, quand elle dort au soleil.', medias: ['m4'], enAvant: true },
      { id: 's6', sens: 'voir', texte: 'Les pivoines roses que ma mère achète au marché chaque printemps.', medias: ['m3'] },
      { id: 's7', sens: 'entendre', texte: 'La pluie sur le toit de la maison de vacances.' },
      { id: 's8', sens: 'sentir', texte: 'La terre après l’orage.' },
    ],
    souvenirs: [
      { id: 'so1', titre: 'La photo ratée', texte: 'On voulait une belle photo de famille. Le retardateur s’est déclenché trop tôt, tout le monde riait, personne ne regardait l’objectif. C’est la seule photo de nous tous que j’ai gardée.', quand: 'Été 2009', lieu: 'Tanger', medias: ['m6'], enAvant: true },
      { id: 'so2', titre: 'Mimi arrive', texte: 'Une boîte en carton, un miaulement minuscule, et ma vie a changé d’odeur et de rythme.', quand: '2016', medias: ['m4'], enAvant: true },
      { id: 'so3', titre: 'Le premier appartement', texte: 'Un matelas par terre, deux assiettes, une plante qu’on m’avait offerte. J’étais riche.', quand: '2014', lieu: 'Lyon', enAvant: true },
      { id: 'so4', titre: 'La nuit à l’hôpital', texte: 'Ma sœur m’a tenu la main toute la nuit sans rien dire. Je n’ai jamais su la remercier correctement.', quand: '2019', enAvant: true },
      { id: 'so5', titre: 'Le train raté', texte: 'On a raté le dernier train, on a marché jusqu’au matin, c’est devenu la plus belle nuit de l’année.', quand: '2012', enAvant: true },
      { id: 'so6', titre: 'La lettre', texte: 'Une lettre de mon père retrouvée dans un livre, jamais envoyée. Je la garde toujours sur moi.', medias: ['m9'] },
    ],
    chapitres: [
      { id: 'c1', titre: 'L’enfance à Tanger', quand: '1994 — 2005', texte: 'Le quartier, les cousins, la mer derrière chaque rue.', enAvant: true },
      { id: 'c2', titre: 'Les études', quand: '2005 — 2013', texte: 'La bibliothèque comme deuxième maison, les amitiés qui restent.', enAvant: true },
      { id: 'c3', titre: 'Lyon', quand: '2013 — 2020', texte: 'Apprendre à vivre seule, apprendre à demander de l’aide.', enAvant: true },
      { id: 'c4', titre: 'Le retour vers la mer', quand: '2020 — aujourd’hui', texte: 'Ralentir. Écouter. Écrire enfin.', enAvant: true },
    ],
    oeuvres: [
      { id: 'o1', titre: 'Le Petit Prince', categorie: 'Livre', texte: 'Parce que je l’ai relu à chaque âge et qu’il m’a répondu différemment chaque fois.', enAvant: true },
      { id: 'o2', titre: 'Mon voisin Totoro', categorie: 'Film', texte: 'Il m’a appris que la tristesse et l’émerveillement peuvent habiter la même maison.', enAvant: true },
      { id: 'o3', titre: 'Oum Kalthoum — Enta Omri', categorie: 'Musique', texte: 'La chanson de mes parents. Je l’entends et je les vois danser dans le salon.', medias: ['m7'], enAvant: true },
      { id: 'o4', titre: 'Les Nymphéas', categorie: 'Peinture', texte: 'Je suis restée une heure devant, sans comprendre pourquoi je pleurais.', enAvant: true },
      { id: 'o5', titre: 'Mushishi', categorie: 'Manga', texte: 'Une lenteur qui soigne.' },
    ],
    jamaisDit: [
      { id: 'j1', texte: 'J’ai toujours eu peur de décevoir, et c’est pour ça que je disais oui à tout.', enAvant: true },
      { id: 'j2', texte: 'C’est moi qui ai cassé le vase bleu en 2003. Pardon maman.', enAvant: true },
      { id: 'j3', texte: 'J’aurais aimé devenir illustratrice. Je dessine encore, en secret.', enAvant: true },
    ],
    paroleLibre: [
      { id: 'p1', titre: 'Pour celles et ceux qui passent ici', texte: 'Si vous êtes arrivé·e jusqu’à ma bulle par hasard, bonjour. Je ne vous connais pas, mais je suis contente que vous soyez là. Prenez le temps. Rien ne presse.', enAvant: true },
      { id: 'p2', texte: 'Un message enregistré un soir d’hiver.', medias: ['m5'], enAvant: true },
    ],
    personnes: [
      { id: 'pe1', titre: 'Nour', lien: 'Ma sœur', texte: 'Ma boussole. Celle qui sait sans que je dise.', enAvant: true },
      { id: 'pe2', titre: 'Mamani', lien: 'Ma grand-mère', texte: 'Ses mains, ses chansons, ses silences.', enAvant: true },
      { id: 'pe3', titre: 'Camille', lien: 'Amie depuis la fac', texte: 'Le rire le plus contagieux de Lyon.', enAvant: true },
      { id: 'pe4', titre: 'M. Benali', lien: 'Professeur de français', texte: 'Il m’a donné le goût des mots.', enAvant: true },
    ],
    lieux: [
      { id: 'l1', titre: 'Essaouira', lieu: 'Maroc', texte: 'Le vent, les remparts, le bleu des barques.', enAvant: true },
      { id: 'l2', titre: 'La bibliothèque de la Part-Dieu', lieu: 'Lyon, France', texte: 'Là où j’ai appris à être seule sans être triste.', enAvant: true },
      { id: 'l3', titre: 'La maison de Tanger', lieu: 'Maroc', texte: 'La terrasse, le linge, les appels à la prière au loin.', enAvant: true },
    ],
    convictions: [
      { id: 'cv1', titre: 'La douceur est une force', texte: 'On peut être doux et ne pas céder.', enAvant: true },
      { id: 'cv2', titre: 'Personne ne devrait être oublié', texte: 'Chaque vie mérite une trace.', enAvant: true },
      { id: 'cv3', titre: 'Le temps offert', texte: 'Le plus beau cadeau, c’est une heure sans téléphone.', enAvant: true },
    ],
    objets: [
      { id: 'ob1', nature: 'objet', titre: 'L’appareil photo de mon père', texte: 'Un argentique qui ne fonctionne plus. Je l’emporte partout quand même.', medias: ['m8'], enAvant: true },
      { id: 'ob2', nature: 'création', titre: 'Carnets de dessins', texte: 'Sept carnets, jamais montrés. Jusqu’à aujourd’hui.', medias: ['m10'], enAvant: true },
      { id: 'ob3', nature: 'accomplissement', titre: 'Avoir appris à nager à 27 ans', texte: 'La peur ne part pas. On apprend à nager avec.', enAvant: true },
    ],
    aimeVivre: [
      { id: 'a1', texte: 'Voir une aurore boréale avec ma sœur.', enAvant: true },
      { id: 'a2', texte: 'Publier un livre illustré pour enfants.', enAvant: true },
      { id: 'a3', texte: 'Apprendre le japonais pour lire Mushishi dans le texte.', enAvant: true },
    ],
    petitesChoses: [
      { id: 'pc1', texte: 'Le premier café, avant que la maison se réveille.', enAvant: true },
      { id: 'pc2', texte: 'Les draps propres.', enAvant: true },
      { id: 'pc3', texte: 'Quand un inconnu tient la porte.', enAvant: true },
      { id: 'pc4', texte: 'Les fins de mois où il reste un peu de chocolat.', enAvant: true },
    ],
  },
  medias: [
    { id: 'm1', kind: 'image', titre: 'L’océan à Essaouira', legende: 'Le soir de mes trente ans.', teinte: '#E9C6B8', origine: 'sens' },
    { id: 'm2', kind: 'image', titre: 'Le café du matin', teinte: '#D9CBBE', origine: 'sens' },
    { id: 'm3', kind: 'image', titre: 'Pivoines', teinte: '#EBCBD0', origine: 'sens' },
    { id: 'm4', kind: 'video', titre: 'Mimi au soleil', duree: '0:42', teinte: '#D8D1C4', origine: 'souvenirs' },
    { id: 'm5', kind: 'audio', titre: 'Un soir d’hiver', duree: '2:34', teinte: '#CBD4E2', origine: 'paroleLibre' },
    { id: 'm6', kind: 'image', titre: 'La photo ratée', legende: 'Tout le monde rit, personne ne regarde.', teinte: '#DCCFB9', origine: 'souvenirs' },
    { id: 'm7', kind: 'lien', titre: 'Enta Omri — enregistrement de 1964', teinte: '#D9D3E4', origine: 'oeuvres' },
    { id: 'm8', kind: 'image', titre: 'L’argentique de papa', teinte: '#CFCAC2', origine: 'objets' },
    { id: 'm9', kind: 'document', titre: 'Lettre.pdf', legende: 'La lettre jamais envoyée.', teinte: '#E4DED2', origine: 'souvenirs' },
    { id: 'm10', kind: 'image', titre: 'Carnet n°4, page 12', teinte: '#DDE3D6', origine: 'objets' },
    { id: 'm11', kind: 'video', titre: 'Les vagues', duree: '1:12', teinte: '#C9D6DD' },
  ],
  versions: [
    { v: 3, date: '3 mars 2025', note: 'Mise à jour de plusieurs sections' },
    { v: 2, date: '12 janvier 2025', note: 'Ajout de médias' },
    { v: 1, date: '12 juin 2024', note: 'Création du profil' },
  ],
  parametres: {
    droitsReutilisation: true,
    archivageLongueDuree: true,
    choixApresDeces: 'Laisser ma trace telle quelle',
    reseauxSociaux: false,
    feedbackPrive: true,
  },
};
