import { Fragment, type CSSProperties } from 'react';
import alphabet from '../data/alphabet.json';
import { HD } from '../lib/hd';
import { hashString } from '../lib/random';

/**
 * Les 200 caractères, brodés : chaque lettre est une vraie broderie au point
 * arrière (planches générées puis découpées, design/hd/alphabet.py), posée sur
 * sa ligne de base. Une même lettre n'a pas toujours la même inclinaison : le
 * fil n'est jamais parfaitement régulier.
 *
 * Le monde entier peut écrire ici, dans sa langue. Tout caractère qui n'a pas
 * sa broderie (arabe, chinois, cyrillique, hindi, emoji…) est écrit dans la
 * typographie du site, au même endroit, à la même taille : rien n'est jamais
 * perdu ni remplacé. Le vrai texte reste lisible par les lecteurs d'écran.
 */

type Glyphe = { x: number; y: number; w: number; h: number; d: number };
const A = alphabet as { em: number; largeur: number; hauteur: number; glyphes: Record<string, Glyphe[]> };
const URL_ATLAS = `${import.meta.env.BASE_URL}hd/alphabet.webp`;
const APPROCHE = -0.02; // les lettres brodées se rapprochent un peu

/** Proportion de caractères brodés : sous ce seuil (une autre écriture), on garde la typographie seule. */
function brodable(texte: string): boolean {
  const lettres = [...texte].filter((c) => c.trim());
  if (!lettres.length) return false;
  return lettres.filter((c) => A.glyphes[c]).length / lettres.length >= 0.6;
}

function lettre(c: string, i: number): JSX.Element {
  const g = A.glyphes[c]![hashString(c + i) % A.glyphes[c]!.length];
  const em = (v: number) => `${(v / A.em).toFixed(4)}em`;
  // une très légère irrégularité, comme à la main
  const r = ((hashString(`${i}${c}`) % 7) - 3) * 0.35;
  const style: CSSProperties = {
    width: em(g.w),
    marginRight: `${APPROCHE}em`,
  };
  const img: CSSProperties = {
    width: em(g.w),
    height: em(g.h),
    bottom: em(-g.d),
    backgroundImage: `url(${URL_ATLAS})`,
    backgroundSize: `${em(A.largeur)} ${em(A.hauteur)}`,
    backgroundPosition: `${em(-g.x)} ${em(-g.y)}`,
    transform: r ? `rotate(${r}deg)` : undefined,
  };
  return (
    <span key={i} className="brode-lettre" style={style}>
      <span className="brode-fil" style={img} />
    </span>
  );
}

export function TexteBrode({ texte, className = '' }: { texte: string; className?: string }) {
  if (!HD || !brodable(texte)) return <span className={className}>{texte}</span>;
  const mots = texte.split(/(\s+)/);
  let n = 0;
  return (
    <span className={`texte-brode ${className}`}>
      <span className="sr-only">{texte}</span>
      <span aria-hidden="true">
        {mots.map((mot, k) => {
          // une vraie espace : elle disparaît en fin de ligne, comme dans un texte ordinaire
          if (/^\s+$/.test(mot)) return <Fragment key={k}> </Fragment>;
          return (
            <span key={k} className="brode-mot">
              {[...mot].map((c) => {
                const i = n++;
                return A.glyphes[c] ? (
                  lettre(c, i)
                ) : (
                  // pas de broderie pour ce caractère : la typographie prend le relais, à sa place
                  <Fragment key={i}>
                    <span className="brode-repli">{c}</span>
                  </Fragment>
                );
              })}
            </span>
          );
        })}
      </span>
    </span>
  );
}
