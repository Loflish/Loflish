import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Constellation, Mode } from '../engine/constellation';

/**
 * État partagé du musée : la constellation vit derrière toutes les pages
 * (elle n'est jamais démontée), chaque page indique seulement comment elle
 * doit se comporter (cahier des charges — patch final, point 3).
 */

type MotionPref = 'systeme' | 'reduit' | 'normal';

interface Settings {
  constellation: boolean;
  motion: MotionPref;
}

interface MuseumCtx {
  engine: React.MutableRefObject<Constellation | null>;
  mode: Mode;
  setMode: (m: Mode) => void;
  settings: Settings;
  setSettings: (s: Partial<Settings>) => void;
  reducedMotion: boolean;
}

const Ctx = createContext<MuseumCtx | null>(null);
const KEY = 'nmm:reglages';

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { constellation: true, motion: 'systeme', ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { constellation: true, motion: 'systeme' };
}

export function MuseumProvider({ children }: { children: ReactNode }) {
  const engine = useRef<Constellation | null>(null);
  const [mode, setMode] = useState<Mode>('explore');
  const [settings, setS] = useState<Settings>(load);
  const [systemReduced, setSystemReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn = () => setSystemReduced(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const reducedMotion = settings.motion === 'reduit' || (settings.motion === 'systeme' && systemReduced);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduit' : 'normal';
  }, [reducedMotion]);

  const value = useMemo<MuseumCtx>(
    () => ({
      engine,
      mode,
      setMode,
      settings,
      reducedMotion,
      setSettings: (s) =>
        setS((prev) => {
          const next = { ...prev, ...s };
          try {
            localStorage.setItem(KEY, JSON.stringify(next));
          } catch {
            /* ignore */
          }
          return next;
        }),
    }),
    [mode, settings, reducedMotion],
  );

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
