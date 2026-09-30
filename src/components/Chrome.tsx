import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { bubbleDataUrl } from '../engine/bubbleSprite';
import { colorById } from '../lib/palette';
import { getTrace, useMesTraces } from '../data/store';
import { loadMatieres } from '../lib/hd';
import { Icon } from './Icon';

// Logo sur une ligne, recomposé à partir des lettres brodées du tableau (design/logo/logo_ligne.py).
// La version « petit » renforce très légèrement la densité du fil pour rester lisible à petite taille.
const logoUrl = `${import.meta.env.BASE_URL}brand/logo-ligne-petit.webp`;

/**
 * Logo brodé — véritable broderie numérisée, jamais vectorisée.
 * Le bordeaux est réservé à ce seul élément.
 */
export function Logo({ size = 'normal' }: { size?: 'normal' | 'petit' }) {
  return (
    <Link to="/" className={`logo logo-${size}`} aria-label="Nos mots mémoriaux — retour à la constellation">
      <img src={logoUrl} alt="Nos mots mémoriaux, brodé à la main en fil bordeaux" width={900} height={88} />
    </Link>
  );
}

/** Une bulle, identique à celle de la constellation (même graine, même matière). */
export function BubbleImage({
  id,
  couleur,
  matiere,
  size = 160,
  className = '',
}: {
  id: string;
  couleur: string;
  matiere?: number;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState('');
  const m = matiere ?? getTrace(id)?.matiere;
  useEffect(() => {
    let alive = true;
    // attend les taches HD (si elles existent) pour être identique à la constellation
    loadMatieres([m]).then(() => alive && setSrc(bubbleDataUrl(id, colorById(couleur).hex, Math.round(size * 2.2), m)));
    return () => {
      alive = false;
    };
  }, [id, couleur, size, m]);
  return (
    <span className={`bubble-image ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      {src && <img src={src} alt="" />}
    </span>
  );
}

const MENU = [
  { to: '/projet', label: 'Le projet', icon: 'projet' },
  { to: '/musee', label: 'Le musée, demain', icon: 'batiment' },
  { to: '/archives', label: 'Archives', icon: 'archive' },
  { to: '/carte', label: 'Carte du monde', icon: 'carte' },
  { to: '/ressources', label: 'Ressources & aide', icon: 'aide' },
  { to: '/soutenir', label: 'Soutenir', icon: 'soutenir' },
  { to: '/juridique', label: 'Juridique & confidentialité', icon: 'juridique' },
  { to: '/compte', label: 'Compte', icon: 'compte' },
];

/**
 * Menu principal — toujours visible sur l'expérience principale
 * (Explorer / Se perdre), centré en bas, compact et silencieux.
 */
export function Dock() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const aTrace = useMesTraces().some((t) => t.type === 'personnelle');

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {open && <div className="menu-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
      {open && (
        <div className="menu-panel" ref={panelRef} role="dialog" aria-label="Menu">
          <nav aria-label="Pages du musée">
            <ul className="menu-list">
              {MENU.map((m) => (
                <li key={m.to}>
                  <Link to={m.to} className="menu-link">
                    <Icon name={m.icon} size={20} />
                    <span>{m.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="menu-help">
            Un moment difficile ? <Link to="/ressources">Des personnes peuvent t’écouter, maintenant.</Link>
          </p>
        </div>
      )}
      <nav className="dock" aria-label="Navigation principale">
        <NavLink to="/" end className="dock-item">
          Explorer
        </NavLink>
        <NavLink to="/se-perdre" className="dock-item">
          Se perdre
        </NavLink>
        {aTrace ? (
          <NavLink to="/ma-trace" className="dock-item">
            Ma trace
          </NavLink>
        ) : (
          <NavLink to="/creer" className="dock-item">
            Créer ma trace
          </NavLink>
        )}
        <button
          ref={btnRef}
          className="dock-item dock-menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'fermer' : 'menu'} size={18} />
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
}

/** En-tête léger des pages intérieures : logo + retour au musée. */
export function PageTop({ back = true }: { back?: boolean }) {
  return (
    <header className="page-top">
      <Logo size="petit" />
      {back && (
        <Link to="/" className="lien-discret">
          <Icon name="retour" size={16} /> Retour au musée
        </Link>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <Logo size="petit" />
      <nav aria-label="Liens de bas de page">
        <Link to="/ressources">Ressources & aide</Link>
        <Link to="/juridique">Juridique & confidentialité</Link>
      </nav>
    </footer>
  );
}
