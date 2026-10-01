/**
 * Les mots d'une personne (les 200 caractères, ce qu'on dit d'un proche) :
 * la même typographie que toutes les autres réponses. Le monde entier peut
 * écrire ici, dans sa langue : le sens de lecture suit le texte (dir="auto").
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
