import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { BubbleImage } from '../components/Chrome';
import { GRIS_PALETTE } from '../lib/palette';
import { rng } from '../lib/random';
import { Page } from './Pages';
import { chargerPlanches, CLAUDE, GOTHIQUE, MELANGE } from './planches';

/**
 * Le tri façon Tinder (local seulement, jamais publié) : les bulles des planches 2, 3 et 4, mêlées, une à une, la planche 4 d'abord.
 * À droite je garde, à gauche je retire. Chaque geste est écrit dans design/tri-bulles.json (vite.config.ts) :
 * un navigateur qui perd sa mémoire ne perd aucun geste.
 */

/** le geste compte à partir de cette distance, en pixels */
const SEUIL = 110;
/** le temps que la carte quitte l'écran, en millisecondes (voir .tri-carte) */
const VOL = 240;
const OBJECTIF = 100;

interface Carte {
  id: string;
  planche: Planche;
  n: number;
  matiere: number;
  nom: string;
  famille: string;
}

type Planche = 2 | 3 | 4;
const PLANCHES: Planche[] = [2, 3, 4];

/** la carte, et si elle est gardée */
type Geste = [string, boolean];

const couleurDe = (n: number) => GRIS_PALETTE[n % GRIS_PALETTE.length]!.id;

export default function AtelierTri() {
  const [cartes, setCartes] = useState<Carte[]>([]);
  // null tant que le fichier n'est pas relu : rien n'est écrit par-dessus avant
  const [gestes, setGestes] = useState<Geste[] | null>(null);
  const [panne, setPanne] = useState(false);
  const [dx, setDx] = useState(0);
  const depart = useRef<number | null>(null);
  const enVol = useRef(false);

  useEffect(() => {
    void (async () => {
      const [{ melange, claude, gothique }, f] = await Promise.all([
        chargerPlanches(),
        fetch('/__tri-bulles').then((r) => r.json() as Promise<{ gestes?: Geste[] }>),
      ]);
      const paquet: Carte[] = [
        ...melange.map((d) => ({ id: `m${d.n}`, planche: 2 as const, n: d.n, matiere: MELANGE + d.n, nom: d.fr, famille: d.famille })),
        ...claude.map((d) => ({ id: `c${d.n}`, planche: 3 as const, n: d.n, matiere: CLAUDE + d.n, nom: d.nom, famille: d.groupe })),
        ...gothique.map((d) => ({ id: `g${d.n}`, planche: 4 as const, n: d.n, matiere: GOTHIQUE + d.n, nom: d.nom, famille: d.famille })),
      ];
      // mêlées, mais dans le même ordre à chaque visite
      const r = rng(7);
      for (let i = paquet.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [paquet[i], paquet[j]] = [paquet[j]!, paquet[i]!];
      }
      setCartes(paquet.sort((a, b) => Number(b.planche === 4) - Number(a.planche === 4)));
      setGestes(f.gestes ?? []);
    })();
  }, []);

  const choix = new Map(gestes ?? []);
  const reste = gestes ? cartes.filter((c) => !choix.has(c.id)) : [];
  const carte = reste[0];
  const compte = (garde: boolean, planche?: Planche) => cartes.filter((c) => choix.get(c.id) === garde && (!planche || c.planche === planche)).length;
  const gardees = (planche: Planche) => cartes.filter((c) => choix.get(c.id) && c.planche === planche);

  useEffect(() => {
    if (!gestes) return;
    const garde = (p: Planche) => cartes.filter((c) => c.planche === p && gestes.some(([id, g]) => g && id === c.id)).map((c) => c.n).sort((a, b) => a - b);
    const corps = JSON.stringify({ gestes, planche2: garde(2), planche3: garde(3), planche4: garde(4), maj: new Date().toISOString() });
    fetch('/__tri-bulles', { method: 'POST', body: corps })
      .then((r) => setPanne(!r.ok))
      .catch(() => setPanne(true));
  }, [gestes, cartes]);

  const trancher = useCallback(
    (garde: boolean) => {
      if (!carte || enVol.current) return;
      enVol.current = true;
      setDx(garde ? 1200 : -1200);
      window.setTimeout(() => {
        setGestes((g) => [...(g ?? []), [carte.id, garde]]);
        setDx(0);
        enVol.current = false;
      }, VOL);
    },
    [carte],
  );

  const annuler = useCallback(() => {
    if (!enVol.current) setGestes((g) => g && g.slice(0, -1));
  }, []);

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') trancher(true);
      else if (e.key === 'ArrowLeft') trancher(false);
      else if (e.key === 'Backspace') annuler();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [trancher, annuler]);

  const poser = (e: PointerEvent<HTMLDivElement>) => {
    if (enVol.current) return;
    depart.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const glisser = (e: PointerEvent<HTMLDivElement>) => {
    if (depart.current !== null) setDx(e.clientX - depart.current);
  };
  const lacher = () => {
    if (depart.current === null) return;
    depart.current = null;
    if (Math.abs(dx) > SEUIL) trancher(dx > 0);
    else setDx(0);
  };

  const taille = typeof window === 'undefined' ? 280 : Math.max(180, Math.min(300, window.innerHeight - 500));

  return (
    <Page className="tri" titre="Le tri des bulles">
      <h1 className="page-titre">Le tri des bulles</h1>
      {cartes.length > 0 && gestes && (
        <>
          <p className="tri-compte" aria-live="polite">
            <strong>{compte(true)} gardées</strong> · {compte(false)} retirées · {reste.length} à voir · objectif {OBJECTIF}
          </p>
          <p className="tri-planches">
            Planche 2 : {compte(true, 2)} gardées, {compte(false, 2)} retirées · Planche 3 : {compte(true, 3)} gardées, {compte(false, 3)} retirées · Planche 4 : {compte(true, 4)} gardées, {compte(false, 4)} retirées
          </p>
        </>
      )}
      {panne && <p className="tri-planches">Ce geste n’a pas pu être écrit dans le fichier : préviens Claude avant de continuer.</p>}

      {carte && (
        <>
          <div className="tri-pile" style={{ '--taille': `${taille}px` } as CSSProperties}>
            {reste.slice(0, 3).reverse().map((c, i, liste) => {
              const dessus = c === carte;
              return (
                <div
                  key={c.id}
                  className={`tri-carte${dessus ? '' : ' tri-dessous'}${i === 0 && liste.length === 3 ? ' tri-cachee' : ''}`}
                  style={dessus ? { transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition: depart.current === null ? undefined : 'none' } : undefined}
                  onPointerDown={dessus ? poser : undefined}
                  onPointerMove={dessus ? glisser : undefined}
                  onPointerUp={dessus ? lacher : undefined}
                  onPointerCancel={dessus ? lacher : undefined}
                  onDragStart={(e) => e.preventDefault()}
                >
                  {dessus && (
                    <>
                      <span className="tri-tampon tri-tampon-garde" style={{ opacity: Math.min(1, dx / SEUIL) }}>
                        Je garde
                      </span>
                      <span className="tri-tampon tri-tampon-retire" style={{ opacity: Math.min(1, -dx / SEUIL) }}>
                        Je retire
                      </span>
                    </>
                  )}
                  <BubbleImage id={`tri-${c.n}`} couleur={couleurDe(c.n)} matiere={c.matiere} size={taille} />
                  <BubbleImage id={`tri-${c.n}`} couleur={couleurDe(c.n)} matiere={c.matiere} size={42} />
                  <p className="tri-nom">{c.nom}</p>
                </div>
              );
            })}
          </div>
          <p className="tri-boutons">
            <button className="bouton bouton-discret" onClick={() => trancher(false)}>
              ← Je retire
            </button>
            <button className="bouton" onClick={() => trancher(true)}>
              Je garde →
            </button>
          </p>
        </>
      )}

      {!carte && cartes.length > 0 && gestes && (
        <>
          <h2 className="intertitre">Tu gardes {compte(true)} bulles</h2>
          <p className="tri-planches">C’est enregistré : dis-moi « c’est fait ».</p>
          {PLANCHES.map((p) => (
            <section key={p} aria-label={`Planche ${p}`}>
              <h3 className="melange-nom">
                Planche {p} : {compte(true, p)} gardées
              </h3>
              <ul className="comparer-grille" style={{ '--taille': '92px' } as CSSProperties}>
                {gardees(p).map((c) => (
                  <li key={c.id} title={c.nom}>
                    <BubbleImage id={`tri-${c.n}`} couleur={couleurDe(c.n)} matiere={c.matiere} size={92} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}

      <p className="coupe-actions">
        <button className="lien-discret" onClick={annuler} disabled={!gestes?.length}>
          Annuler le dernier geste
        </button>
        <span>à la souris : glisse la carte. Au clavier : → je garde, ← je retire, retour arrière pour annuler</span>
        <Link className="lien-discret" to="/atelier/comparer">
          Comparer les planches
        </Link>
      </p>
    </Page>
  );
}
