/**
 * L'adresse où écrire au créateur du musée (demandes privées, suppression de données au titre du RGPD).
 * À confirmer : elle peut être changée sans toucher au code, avec VITE_CONTACT au moment de construire le site.
 */
export const CONTACT: string = (import.meta.env.VITE_CONTACT as string | undefined) || 'bonjour@nosmotsmemoriaux.org';
