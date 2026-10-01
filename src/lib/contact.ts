/**
 * L'adresse où écrire au fondateur du musée (questions, signalements, protection des données :
 * consulter, modifier ou supprimer ses données). Elle peut être changée sans toucher au code,
 * avec VITE_CONTACT au moment de construire le site.
 */
export const CONTACT: string = (import.meta.env.VITE_CONTACT as string | undefined) || 'nosmots@memoriaux.org';
