import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { bubbleDataUrl } from '../engine/bubbleSprite';
import { colorById } from '../lib/palette';
import { getTrace } from '../data/store';
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
    <Link to="/" className={`logo logo-${size}`} aria-label="Nos Mots Mémoriaux, retour à la constellation">
      <img src={logoUrl} alt="Nos Mots Mémoriaux, brodé à la main en fil bordeaux" width={900} height={88} />
    </Link>
  );
}

/**
 * File de peinture des bulles : chacune se peint dans un petit budget par
 * image (8 ms), la plus grande d'abord ; un catalogue de cent vignettes ne
 * bloque jamais un clic ni une animation.
 */
const file: (() => void)[] = [];
let planifie = false;
function vider() {
  const t0 = performance.now();
  while (file.length && performance.now() - t0 < 8) file.shift()!();
  if (file.length) requestAnimationFrame(vider);
  else planifie = false;
}
function peindre(job: () => void, prioritaire: boolean) {
  if (prioritaire) file.unshift(job);
  else file.push(job);
  if (!planifie) {
    planifie = true;
    requestAnimationFrame(vider);
  }
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
    loadMatieres([m]).then(() =>
      peindre(() => alive && setSrc(bubbleDataUrl(id, colorById(couleur).hex, Math.round(size * 2.2), m)), size >= 120),
    );
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

// Deux colonnes égales ; le compte prend la place qu'avait l'œuvre commune (passée dans le dock).
const MENU = [
  { to: '/projet', label: 'Le projet', icon: 'projet' },
  { to: '/compte', label: 'Compte', icon: 'compte' },
  { to: '/archives', label: 'Archives', icon: 'archive' },
  { to: '/ressources', label: 'Ressources & aide', icon: 'aide' },
  { to: '/soutenir', label: 'Soutenir', icon: 'soutenir' },
  { to: '/juridique', label: 'Juridique', icon: 'juridique' },
];

/** Les expériences du musée. Le dock ne montre jamais la page où l'on se trouve déjà. */
const EXPERIENCES = [
  { to: '/', label: 'Explorer' },
  { to: '/se-perdre', label: 'Se perdre' },
  { to: '/creer', label: 'Créer ma trace' },
  { to: '/oeuvre-commune', label: 'L’œuvre commune' },
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
        </div>
      )}
      <nav className="dock" aria-label="Navigation principale">
        {EXPERIENCES.filter((x) => x.to !== location.pathname).map((x) => (
          <Link key={x.to} to={x.to} className="dock-item">
            {x.label}
          </Link>
        ))}
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

/**
 * En-tête léger des pages intérieures : la signature, petite, qui ramène au
 * musée (le seul autre endroit où le logo apparaît, en grand, est la constellation).
 */
export function PageTop({ back = true }: { back?: boolean }) {
  return (
    <header className="page-top">
      <Link to="/" className="page-top-logo" aria-label="Nos Mots Mémoriaux, retour au musée">
        <Logo size="petit" />
      </Link>
      {back && (
        <Link to="/" className="lien-discret">
          <Icon name="retour" size={16} /> Retour au musée
        </Link>
      )}
    </header>
  );
}

/** Le pied de page ne propose jamais la page où l'on est déjà. */
export function Footer() {
  const { pathname } = useLocation();
  const liens = [
    { to: '/ressources', label: 'Ressources & aide' },
    { to: '/juridique', label: 'Juridique & confidentialité' },
  ].filter((l) => l.to !== pathname);
  return (
    <footer className="site-footer">
      <nav aria-label="Liens de bas de page">
        {liens.map((l) => (
          <Link key={l.to} to={l.to}>
            {l.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
