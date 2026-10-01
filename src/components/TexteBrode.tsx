/**
 * Les 200 caractères. Ils étaient brodés lettre à lettre ; ils s'écrivent
 * désormais simplement en IBM Plex Sans, dans un gris de fil (choix du créateur :
 * plus lisible, plus sobre). Le monde entier peut écrire ici, dans sa langue :
 * le sens de lecture suit le texte (dir="auto").
 *
 * L'ancien alphabet brodé reste dans le dépôt (public/hd/alphabet.webp,
 * src/data/alphabet.json, design/hd/alphabet.py) si l'on veut y revenir.
 */
export function TexteBrode({ texte, className = '' }: { texte: string; className?: string }) {
  return (
    <span className={`texte-plex ${className}`} dir="auto">
      {texte}
    </span>
  );
}
