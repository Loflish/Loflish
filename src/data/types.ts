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
  /** Image de démonstration ou ancienne photo en ligne (data URL), affichée telle quelle. */
  src?: string;
  /** Fichier réellement déposé, gardé dans le stockage des médias (IndexedDB dans le prototype). */
  fichier?: boolean;
  mime?: string;
  /** Nom du fichier d'origine et poids, pour les documents. */
  nom?: string;
  taille?: number;
  /** Adresse d'un lien (http ou https). */
  url?: string;
  /** Posé en avant sur le profil (5 au plus parmi les médias & documents). */
  enAvant?: boolean;
  /** Date (ISO) du dépôt : un média déposé est scellé. */
  scelleLe?: string;
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
  /** Un média ou document au plus par fragment. */
  medias?: string[];
  /** Posé en avant sur le profil (5 au plus par rubrique). */
  enAvant?: boolean;
  /** Date (ISO) du dépôt : un fragment est scellé dès qu'il est déposé. */
  scelleLe?: string;
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
   * Date (ISO) à laquelle l'auteur a scellé ses réponses : la trace devient alors
   * publique, et ses réponses ne changent plus pendant cinq ans.
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
 * Au plus 10 fragments par rubrique (pour les 5 sens : 10 par sens), dont 5
 * posés en avant sur le profil ; « Voir tout » montre le reste.
 */
export const MAX_FRAGMENTS = 10;
export const MAX_EN_AVANT = 5;
/** Médias & documents : 20 au plus (les médias joints aux fragments ne comptent pas). */
export const MAX_MEDIAS = 20;

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
