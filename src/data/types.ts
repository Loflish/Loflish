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

/** Les 5 sens : chacun est une rubrique à part entière, avec ses propres limites. */
export type Sens = 'voir' | 'entendre' | 'sentir' | 'gouter' | 'toucher';
export const SENS: Sens[] = ['voir', 'entendre', 'sentir', 'gouter', 'toucher'];

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
  /** Ancien format (une seule rubrique « Les 5 sens ») : le sens du fragment, lu à la migration. */
  sens?: Sens;
  /** Un média ou document au plus par fragment. */
  medias?: string[];
  /** Posé en avant sur le profil (5 au plus par rubrique). */
  enAvant?: boolean;
  /** Date (ISO) du dépôt : un fragment est scellé dès qu'il est déposé. */
  scelleLe?: string;
}

export type RubriqueId =
  | Sens
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
  /** matière d'aquarelle choisie (0 = aquarelle cousue, 1 à 92 = taches) ; absente = tirée au hasard, fixe */
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
  /**
   * Date (ISO) à laquelle l'auteur a scellé ses réponses : la trace devient alors
   * publique, et ses réponses ne changent plus pendant cinq ans.
   */
  scelleeLe?: string;
  parametres?: Parametres;
  /** Présence légère (constellation) : le profil complet se charge à la demande. */
  leger?: boolean;
  /** Vu par l'auteur ou l'équipe : une trace peut être masquée par la modération. */
  statut?: 'publiee' | 'masquee';
  masqueeRaison?: string;
  /** Données de démonstration. */
  demo?: boolean;
}

export interface Rubrique {
  id: RubriqueId;
  titre: string;
  /** Icône dessinée associée. */
  icone: string;
  /** La question posée à l'auteur, rappelée en tête de la salle. */
  question?: string;
  /** Les 5 sens se présentent ensemble sur le profil. */
  famille?: 'sens';
  /** Titre court, sous l'intertitre « Les 5 sens ». */
  court?: string;
}

export const RUBRIQUES: Rubrique[] = [
  { id: 'voir', titre: 'Voir une dernière fois', court: 'Voir', icone: 'oeil', famille: 'sens', question: 'Qu’aimerais-tu voir une dernière fois ?' },
  { id: 'entendre', titre: 'Entendre une dernière fois', court: 'Entendre', icone: 'oreille', famille: 'sens', question: 'Qu’aimerais-tu entendre une dernière fois ?' },
  { id: 'sentir', titre: 'Sentir une dernière fois', court: 'Sentir', icone: 'nez', famille: 'sens', question: 'Qu’aimerais-tu sentir une dernière fois ?' },
  { id: 'gouter', titre: 'Manger une dernière fois', court: 'Manger', icone: 'tasse', famille: 'sens', question: 'Qu’aimerais-tu manger une dernière fois ?' },
  { id: 'toucher', titre: 'Toucher une dernière fois', court: 'Toucher', icone: 'main', famille: 'sens', question: 'Qu’aimerais-tu toucher ou tenir une dernière fois ?' },
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

export const QUESTIONS: [string, string, string, string] = [
  'Que dirais-tu à toi-même si ta vie s’arrêtait ?',
  'Que dirais-tu à la personne que tu aimes ?',
  'Que dirais-tu au monde entier ?',
  'En 200 caractères maximum, comment résumerais-tu tes trois réponses ?',
];

export const LIMITES = { q: 1200, q4: 200, sens: 800 };

/**
 * Combien de fragments une rubrique peut recevoir : cela dépend de ce qu'on y
 * dépose. Les réponses brèves (les 5 sens, les petites choses…) : 10. Les
 * textes longs (souvenirs, ce que je n'ai jamais dit, parole libre) : 7, plus
 * rares et plus forts. Les personnes et les lieux : 15. Dans tous les cas, 5
 * sont posés en avant sur le profil ; « Voir tout » montre le reste.
 */
export const MAX_FRAGMENTS = 10;
const LIMITE_PAR_RUBRIQUE: Partial<Record<RubriqueId, number>> = {
  souvenirs: 7,
  jamaisDit: 7,
  paroleLibre: 7,
  personnes: 15,
  lieux: 15,
};
export function limiteDe(rubrique: RubriqueId): number {
  return LIMITE_PAR_RUBRIQUE[rubrique] ?? MAX_FRAGMENTS;
}
export const MAX_EN_AVANT = 5;
/** Médias & documents : 20 au plus (les médias joints aux fragments ne comptent pas). */
export const MAX_MEDIAS = 20;

/** Combien de fragments peut encore recevoir une rubrique. */
export function placesRestantes(items: Element[], rubrique: RubriqueId): number {
  return Math.max(0, limiteDe(rubrique) - items.length);
}

/** Catégories proposées pour « Œuvres / cultures » (saisie libre possible avec « Autre »). */
export const CATEGORIES_OEUVRES = [
  'Livre', 'Film', 'Série', 'Musique', 'Chanson', 'Peinture', 'Photographie', 'Manga', 'Bande dessinée',
  'Anime', 'Jeu vidéo', 'Théâtre', 'Poésie', 'Danse', 'Podcast', 'Sculpture', 'Architecture', 'Autre',
];
