import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { Constellation, Mode } from '../engine/constellation';

/**
 * État partagé du musée : la constellation vit derrière toutes les pages
 * (elle n'est jamais démontée), chaque page indique seulement comment elle
 * doit se comporter.
 *
 * La constellation et le mouvement sont toujours présents (choix du projet).
 * Si le système demande de réduire les animations, le mouvement ralentit
 * seulement. Le visiteur peut aussi mettre tout le mouvement en pause d'un
 * clic (WCAG 2.2.2) : ce choix est retenu sur son appareil.
 */

const CLE_PAUSE = 'nmm:pause';

/**
 * Les pages qui ne montrent pas la constellation (les mêmes routes que dans App.tsx).
 * Toute autre adresse, même inconnue, ouvre la constellation.
 */
const SANS_CONSTELLATION = /^\/(se-perdre|trace\/|creer|ma-trace|projet|ressources|soutenir|juridique|archives\/?$|oeuvre-commune|compte|connexion|admin|atelier\/)/;

/** Cette adresse montre-t-elle la constellation ? Sinon, son moteur et ses images ne sont pas chargés. */
export function estRouteExplorer(pathname: string): boolean {
  return !SANS_CONSTELLATION.test(pathname);
}

interface MuseumCtx {
  engine: React.MutableRefObject<Constellation | null>;
  mode: Mode;
  setMode: (m: Mode) => void;
  reducedMotion: boolean;
  enPause: boolean;
  setEnPause: (v: boolean) => void;
}

const Ctx = createContext<MuseumCtx | null>(null);

export function MuseumProvider({ children }: { children: ReactNode }) {
  const engine = useRef<Constellation | null>(null);
  // l'état de départ suit l'adresse : une page de texte ne commence pas par allumer la constellation
  const depart = useLocation().pathname;
  const [mode, setMode] = useState<Mode>(() => (estRouteExplorer(depart) ? 'explore' : 'texte'));
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const [enPause, setEnPause] = useState(() => {
    try {
      return localStorage.getItem(CLE_PAUSE) === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      if (enPause) localStorage.setItem(CLE_PAUSE, '1');
      else localStorage.removeItem(CLE_PAUSE);
    } catch {
      /* stockage indisponible : le choix vaut pour cette visite */
    }
  }, [enPause]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const value = useMemo<MuseumCtx>(() => ({ engine, mode, setMode, reducedMotion, enPause, setEnPause }), [mode, reducedMotion, enPause]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMuseum(): MuseumCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useMuseum hors MuseumProvider');
  return c;
}

/** Chaque page déclare l'état de la constellation derrière elle. */
export function useMuseumMode(mode: Mode): void {
  const { setMode } = useMuseum();
  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);
}
