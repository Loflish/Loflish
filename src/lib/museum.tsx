import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Constellation, Mode } from '../engine/constellation';

/**
 * État partagé du musée : la constellation vit derrière toutes les pages
 * (elle n'est jamais démontée), chaque page indique seulement comment elle
 * doit se comporter.
 *
 * La constellation et le mouvement sont toujours présents (choix du projet).
 * Si le système demande de réduire les animations, le mouvement ralentit
 * seulement.
 */

interface MuseumCtx {
  engine: React.MutableRefObject<Constellation | null>;
  mode: Mode;
  setMode: (m: Mode) => void;
  reducedMotion: boolean;
}

const Ctx = createContext<MuseumCtx | null>(null);

export function MuseumProvider({ children }: { children: ReactNode }) {
  const engine = useRef<Constellation | null>(null);
  const [mode, setMode] = useState<Mode>('explore');
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const value = useMemo<MuseumCtx>(() => ({ engine, mode, setMode, reducedMotion }), [mode, reducedMotion]);
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
