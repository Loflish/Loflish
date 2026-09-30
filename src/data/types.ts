/**
 * Modèle d'un profil de dernières volontés (« trace »).
 * Structure issue du cahier des charges maître (Blocs 2A → 2S) et de
 * l'architecture « Proposition A révisée ».
 */

export type TraceType = 'personnelle' | 'memoire';

export type MediaKind = 'image' | 'audio' | 'video' | 'document' | 'lien';

export interface Media {
  id: string;
  kind: MediaKind;
  titre: string;
  /** Commentaire libre de l'auteur. */
  legende?: string;
  /** Durée affichée pour l'audio / la vidéo. */
  duree?: string;
  /** Image réellement déposée (redimensionnée), affichée telle quelle. */
  src?: string;
  /** Teinte douce de l'emplacement de démonstration (quand il n'y a pas de vraie photo). */
  teinte?: string;
  /** Rubrique d'origine : un média n'existe qu'une fois mais peut être relié à plusieurs rubriques. */
  origine?: RubriqueId;
}

export type Sens = 'voir' | 'entendre' | 'sentir' | 'gouter' | 'toucher';

export interface Element {
  id: string;
  titre?: string;
  texte: string;
  /** Date, période ou année. */
  quand?: string;
  lieu?: string;
  /** Pour « Œuvres / cultures » : catégorie (livre, film, chanson…). */
  categorie?: string;
  /** Pour « Personnes qui ont compté » : le lien avec la personne. */
  lien?: string;
  /** Pour les 5 sens. */
  sens?: Sens;
  medias?: string[];
}

export type RubriqueId =
  | 'sens'
  | 'souvenirs'
  | 'chapitres'
  | 'oeuvres'
  | 'jamaisDit'
  | 'paroleLibre'
  | 'personnes'
  | 'lieux'
  | 'convictions'
  | 'objets'
  | 'creations'
  | 'accomplissements'
  | 'aimeVivre'
  | 'petitesChoses';

export interface Version {
  v: number;
  date: string;
  note: string;
}

export interface Parametres {
  droitsReutilisation: boolean;
  archivageLongueDuree: boolean;
  choixApresDeces: string;
  reseauxSociaux: boolean;
  feedbackPrive: boolean;
}

export interface Trace {
  id: string;
  /** Nom affiché : identité, pseudonyme ou « Anonyme ». */
  nom: string;
  pseudo?: string;
  type: TraceType;
  couleur: string; // id GRIS
  /** matière d'aquarelle choisie (1 à 77) ; absente = tirée au hasard, fixe */
  matiere?: number;
  pays?: string;
  creeLe: string;
  majLe: string;
  /** Les 4 questions — uniquement pour une trace personnelle. */
  questions?: [string, string, string, string];
  /** Précision facultative de Q2 : à qui la personne pensait. */
  q2Destinataire?: string;
  /** Pour une mémoire déposée par un tiers. */
  memoire?: {
    deposeePar: string;
    relation?: string;
    origine?: string;
    aperçu: string;
  };
  rubriques: Partial<Record<RubriqueId, Element[]>>;
  medias: Media[];
  versions: Version[];
  /**
   * Date (ISO) à laquelle l'auteur a terminé sa trace : elle est alors scellée
   * cinq ans, sans aucune modification possible.
   */
  scelleeLe?: string;
  parametres?: Parametres;
  /** Données de démonstration. */
  demo?: boolean;
}

export interface Rubrique {
  id: RubriqueId;
  titre: string;
  /** Icône dessinée associée. */
  icone: string;
}

export const RUBRIQUES: Rubrique[] = [
  { id: 'sens', titre: 'Les 5 sens', icone: 'oeil' },
  { id: 'souvenirs', titre: 'Souvenirs', icone: 'image' },
  { id: 'chapitres', titre: 'Chapitres de vie', icone: 'livre' },
  { id: 'oeuvres', titre: 'Œuvres / cultures qui m’ont marqué', icone: 'note' },
  { id: 'jamaisDit', titre: 'Ce que je n’ai jamais dit', icone: 'bulle' },
  { id: 'paroleLibre', titre: 'Parole libre', icone: 'plume' },
  { id: 'personnes', titre: 'Personnes qui ont compté', icone: 'personnes' },
  { id: 'lieux', titre: 'Lieux qui ont compté', icone: 'lieu' },
  { id: 'convictions', titre: 'Convictions / ce en quoi je croyais', icone: 'feuille' },
  { id: 'objets', titre: 'Objets importants', icone: 'objet' },
  { id: 'creations', titre: 'Mes créations', icone: 'creation' },
  { id: 'accomplissements', titre: 'Mes accomplissements', icone: 'accomplissement' },
  { id: 'aimeVivre', titre: 'Ce que j’aurais encore aimé vivre', icone: 'horizon' },
  { id: 'petitesChoses', titre: 'Les petites choses qui me rendaient heureux·se', icone: 'fleur' },
];

export const SENS_QUESTIONS: Record<Sens, { court: string; question: string }> = {
  voir: { court: 'Voir', question: 'Qu’aimerais-tu voir une dernière fois ?' },
  entendre: { court: 'Entendre', question: 'Qu’aimerais-tu entendre une dernière fois ?' },
  sentir: { court: 'Sentir', question: 'Qu’aimerais-tu sentir une dernière fois ?' },
  gouter: { court: 'Goûter', question: 'Qu’aimerais-tu goûter ou manger une dernière fois ?' },
  toucher: { court: 'Toucher', question: 'Qu’aimerais-tu toucher ou tenir une dernière fois ?' },
};

export const QUESTIONS: [string, string, string, string] = [
  'Que dirais-tu à toi-même si ta vie s’arrêtait ?',
  'Que dirais-tu à la personne que tu aimes ?',
  'Que dirais-tu au monde entier ?',
  'En 200 caractères maximum, que veux-tu laisser ?',
];

export const LIMITES = { q: 1200, q4: 200, sens: 800 };

/**
 * Au plus 5 fragments par rubrique ; pour les 5 sens, au plus 5 par sens.
 * Rien n'est caché : tout ce qui est déposé est montré.
 */
export const MAX_FRAGMENTS = 5;

/** Combien de fragments peut encore recevoir une rubrique (ou un sens). */
export function placesRestantes(items: Element[], rubrique: RubriqueId, sens?: Sens): number {
  const list = rubrique === 'sens' ? items.filter((e) => e.sens === sens) : items;
  return Math.max(0, MAX_FRAGMENTS - list.length);
}

/** Catégories proposées pour « Œuvres / cultures » (saisie libre possible avec « Autre »). */
export const CATEGORIES_OEUVRES = [
  'Livre', 'Film', 'Série', 'Musique', 'Chanson', 'Peinture', 'Photographie', 'Manga', 'Bande dessinée',
  'Anime', 'Jeu vidéo', 'Théâtre', 'Poésie', 'Danse', 'Podcast', 'Sculpture', 'Architecture', 'Autre',
];
