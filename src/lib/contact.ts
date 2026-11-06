/**
 * L'adresse où écrire au fondateur du musée (questions, signalements, protection des données :
 * consulter, modifier ou supprimer ses données). Elle peut être changée sans toucher au code,
 * avec VITE_CONTACT au moment de construire le site.
 */
/** une adresse e-mail plausible : un seul @, un point après, pas d'espace (le navigateur fait le reste) */
export const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CONTACT: string = (import.meta.env.VITE_CONTACT as string | undefined) || 'contact@nosmotsmemoriaux.org';
