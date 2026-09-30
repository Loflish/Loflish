import { Fragment, type CSSProperties } from 'react';
import alphabet from '../data/alphabet.json';
import { HD } from '../lib/hd';
import { hashString } from '../lib/random';

/**
 * Les 200 caractères, brodés : chaque lettre est une vraie broderie, le
 * contour des lettres d'IBM Plex Sans cousu au point avant (planches générées
 * puis découpées, design/hd/alphabet.py), posée sur sa ligne de base. Une même
 * lettre n'a pas toujours la même inclinaison : le fil n'est jamais
 * parfaitement régulier.
 *
 * Le monde entier peut écrire ici, dans sa langue. Ce qui n'a pas sa broderie
 * s'écrit dans IBM Plex Sans, le même dessin de lettre, couleur du fil :
 * l'arabe, l'hébreu, le devanagari, le thaï, le japonais, le coréen, le
 * cyrillique, le grec… Un mot d'une autre écriture reste toujours d'un seul
 * tenant (les lettres se lient, le sens de lecture est respecté) ; un texte
 * surtout écrit dans une autre écriture est écrit entièrement en Plex. Le vrai
 * texte reste lisible par les lecteurs d'écran.
 */

type Glyphe = { x: number; y: number; w: number; h: number; d: number };
const A = alphabet as { em: number; largeur: number; hauteur: number; glyphes: Record<string, Glyphe[]> };
const URL_ATLAS = `${import.meta.env.BASE_URL}hd/alphabet.webp`;
const APPROCHE = -0.02; // les lettres brodées se rapprochent un peu

/** Latin, chiffres et ponctuation : ces caractères se posent un à un, sans liaison entre eux. */
const LATIN = /^[\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]$/u;

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
  if (!HD) return <span className={className}>{texte}</span>;
  if (!brodable(texte))
    return (
      <span className={`texte-plex ${className}`} dir="auto">
        {texte}
      </span>
    );
  const mots = texte.split(/(\s+)/);
  let n = 0;
  return (
    <span className={`texte-brode ${className}`}>
      <span className="sr-only">{texte}</span>
      <span aria-hidden="true">
        {mots.map((mot, k) => {
          // une vraie espace : elle disparaît en fin de ligne, comme dans un texte ordinaire
          if (/^\s+$/.test(mot)) return <Fragment key={k}> </Fragment>;
          // un mot d'une autre écriture reste d'un seul tenant : ses lettres se lient
          if ([...mot].some((c) => !A.glyphes[c] && !LATIN.test(c)))
            return (
              <span key={k} className="brode-repli" dir="auto">
                {mot}
              </span>
            );
          // un mot très long (sans espace) peut se couper n'importe où : il ne sort jamais du cadre
          const long = [...mot].length > 14;
          return (
            <span key={k} className={`brode-mot${long ? ' brode-long' : ''}`}>
              {[...mot].map((c, j) => {
                const i = n++;
                return (
                  <Fragment key={i}>
                    {long && j > 0 && <wbr />}
                    {A.glyphes[c] ? (
                      lettre(c, i)
                    ) : (
                      // pas de broderie pour ce caractère : la typographie prend le relais, à sa place
                      <span className="brode-repli">{c}</span>
                    )}
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
