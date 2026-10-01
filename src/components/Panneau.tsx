import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

/**
 * Un panneau qui glisse depuis la droite (une « salle ») : une rubrique, les
 * médias, un signalement… Il se ferme avec la croix, Échap ou un clic à côté.
 */
export function Panneau({ titre, onClose, children }: { titre: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const opener = useMemo(() => document.activeElement as HTMLElement | null, []);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      opener?.focus?.();
    };
  }, [onClose, opener]);
  return (
    <div className="salle-scrim" onClick={onClose}>
      <div className="salle" role="dialog" aria-modal="true" aria-label={titre} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="salle-entete">
          <h2 className="salle-titre">{titre}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <Icon name="fermer" size={20} />
          </button>
        </div>
        <div className="salle-corps">{children}</div>
      </div>
    </div>
  );
}
