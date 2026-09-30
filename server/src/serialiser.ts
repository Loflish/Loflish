/**
 * Traduit les lignes de la base dans la forme que le site connaît déjà
 * (src/data/types.ts : Trace, Element, Media), pour que le site ne voie aucune
 * différence entre le prototype et le vrai musée.
 */

const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
export const dateFr = (d: Date | string) => date.format(new Date(d));

export interface LigneTrace {
  id: string;
  compte_id: string | null;
  type: 'personnelle' | 'memoire';
  statut: 'publiee' | 'masquee';
  nom: string;
  pseudo: string | null;
  couleur: string;
  matiere: number | null;
  pays: string | null;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  q4: string | null;
  q2_destinataire: string | null;
  memoire_deposee_par: string | null;
  memoire_relation: string | null;
  memoire_origine: string | null;
  memoire_apercu: string | null;
  parametres: Record<string, unknown>;
  cree_le: Date;
  maj_le: Date;
  scellee_le: Date;
  masquee_raison: string | null;
}

export interface LigneFragment {
  id: string;
  trace_id: string;
  rubrique: string;
  titre: string | null;
  texte: string;
  quand: string | null;
  lieu: string | null;
  lien: string | null;
  categorie: string | null;
  en_avant: boolean;
  ordre: number;
  scelle_le: Date;
}

export interface LigneMedia {
  id: string;
  trace_id: string;
  fragment_id: string | null;
  kind: 'image' | 'audio' | 'video' | 'document' | 'lien';
  titre: string;
  legende: string | null;
  duree: string | null;
  cle: string | null;
  mime: string | null;
  nom_fichier: string | null;
  taille: string | number | null;
  url: string | null;
  en_avant: boolean;
  ordre: number;
  scelle_le: Date;
}

const sansVide = <T extends Record<string, unknown>>(o: T): T => {
  for (const k of Object.keys(o)) if (o[k] === null || o[k] === undefined) delete o[k];
  return o;
};

/** Une présence dans la constellation : juste ce qu'il faut pour la bulle, son nom et son aperçu. */
export function presence(t: LigneTrace) {
  return sansVide({
    id: t.id,
    nom: t.nom,
    type: t.type,
    couleur: t.couleur,
    matiere: t.matiere ?? undefined,
    pays: t.pays,
    creeLe: dateFr(t.cree_le),
    apercu: t.type === 'personnelle' ? t.q4 : t.memoire_apercu,
  });
}

export function media(m: LigneMedia, rubriqueDuFragment?: string) {
  return sansVide({
    id: m.id,
    kind: m.kind,
    titre: m.titre,
    legende: m.legende,
    duree: m.duree,
    src: m.cle ? `/api/fichiers/${m.cle}` : undefined,
    mime: m.mime,
    nom: m.nom_fichier,
    taille: m.taille === null ? undefined : Number(m.taille),
    url: m.url,
    enAvant: m.en_avant || undefined,
    scelleLe: m.scelle_le.toISOString(),
    origine: rubriqueDuFragment,
  });
}

/** Une trace complète, telle que le profil l'affiche. `auteur` : on y ajoute les réglages non publics. */
export function trace(t: LigneTrace, fragments: LigneFragment[], medias: LigneMedia[], auteur = false) {
  const rubriqueDe = new Map(fragments.map((f) => [f.id, f.rubrique]));
  const mediasDe = new Map<string, string[]>();
  for (const m of medias) if (m.fragment_id) mediasDe.set(m.fragment_id, [...(mediasDe.get(m.fragment_id) ?? []), m.id]);
  const rubriques: Record<string, unknown[]> = {};
  for (const f of fragments) {
    (rubriques[f.rubrique] ??= []).push(
      sansVide({
        id: f.id,
        titre: f.titre,
        texte: f.texte,
        quand: f.quand,
        lieu: f.lieu,
        lien: f.lien,
        categorie: f.categorie,
        medias: mediasDe.get(f.id),
        enAvant: f.en_avant || undefined,
        scelleLe: f.scelle_le.toISOString(),
      }),
    );
  }
  return sansVide({
    id: t.id,
    nom: t.nom,
    pseudo: t.pseudo,
    type: t.type,
    couleur: t.couleur,
    matiere: t.matiere ?? undefined,
    pays: t.pays,
    creeLe: dateFr(t.cree_le),
    majLe: dateFr(t.maj_le),
    scelleeLe: t.scellee_le.toISOString(),
    questions: t.type === 'personnelle' ? [t.q1, t.q2, t.q3, t.q4] : undefined,
    q2Destinataire: t.q2_destinataire,
    memoire:
      t.type === 'memoire'
        ? sansVide({ deposeePar: t.memoire_deposee_par ?? '', relation: t.memoire_relation, origine: t.memoire_origine, aperçu: t.memoire_apercu ?? '' })
        : undefined,
    rubriques,
    medias: medias.map((m) => media(m, m.fragment_id ? rubriqueDe.get(m.fragment_id) : undefined)),
    parametres: auteur ? t.parametres : undefined,
    statut: auteur || t.statut !== 'publiee' ? t.statut : undefined,
    masqueeRaison: auteur ? t.masquee_raison : undefined,
  });
}
