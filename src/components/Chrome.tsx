import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { bubbleDataUrl } from '../engine/bubbleSprite';
import { colorById } from '../lib/palette';
import { useMuseum } from '../lib/museum';
import { Icon } from './Icon';

const logoUrl = `${import.meta.env.BASE_URL}brand/logo-brode.webp`;
// version réduite : même broderie, densité du fil légèrement renforcée pour rester lisible en petit
const logoPetitUrl = `${import.meta.env.BASE_URL}brand/logo-brode-petit.webp`;

/**
 * Logo brodé — véritable broderie numérisée, jamais vectorisée.
 * Le bordeaux est réservé à ce seul élément.
 */
export function Logo({ size = 'normal' }: { size?: 'normal' | 'petit' }) {
  return (
    <Link to="/" className={`logo logo-${size}`} aria-label="Nos mots mémoriaux — retour à la constellation">
      <img
        src={size === 'petit' ? logoPetitUrl : logoUrl}
        alt="Nos mots mémoriaux, brodé à la main en fil bordeaux"
        width={900}
        height={1008}
      />
    </Link>
  );
}

/** Une bulle, identique à celle de la constellation (même graine, même matière). */
export function BubbleImage({ id, couleur, size = 160, className = '' }: { id: string; couleur: string; size?: number; className?: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    setSrc(bubbleDataUrl(id, colorById(couleur).hex, Math.round(size * 2.2)));
  }, [id, couleur, size]);
  return (
    <span className={`bubble-image ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      {src && <img src={src} alt="" />}
    </span>
  );
}

const MENU = [
  { to: '/projet', label: 'Le projet', icon: 'projet' },
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
          <DisplaySettings />
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
        <NavLink to="/creer" className="dock-item">
          Créer ma trace
        </NavLink>
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

/** Compte / Menu → Accessibilité & affichage */
export function DisplaySettings() {
  const { settings, setSettings } = useMuseum();
  return (
    <fieldset className="reglages">
      <legend>Accessibilité & affichage</legend>
      <div className="reglage">
        <span id="lbl-const">Constellation en arrière-plan</span>
        <div className="segmented" role="radiogroup" aria-labelledby="lbl-const">
          {[
            [true, 'Activée'],
            [false, 'Désactivée'],
          ].map(([v, l]) => (
            <button
              key={String(v)}
              role="radio"
              aria-checked={settings.constellation === v}
              onClick={() => setSettings({ constellation: v as boolean })}
            >
              {l as string}
            </button>
          ))}
        </div>
      </div>
      <div className="reglage">
        <span id="lbl-motion">Mouvement</span>
        <div className="segmented" role="radiogroup" aria-labelledby="lbl-motion">
          {(
            [
              ['systeme', 'Système'],
              ['normal', 'Normal'],
              ['reduit', 'Réduit'],
            ] as const
          ).map(([v, l]) => (
            <button key={v} role="radio" aria-checked={settings.motion === v} onClick={() => setSettings({ motion: v })}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </fieldset>
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
