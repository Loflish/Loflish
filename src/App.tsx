import { lazy, Suspense, useLayoutEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Backdrop } from './components/Backdrop';
import { Explorer } from './pages/Explorer';

/**
 * La constellation (Explorer) arrive avec la page ; chaque autre espace n'est téléchargé que la
 * première fois qu'on y entre (le profil, Créer, l'œuvre commune, les pages, l'espace du fondateur).
 */
const page = <T extends Record<string, unknown>, K extends keyof T>(charger: () => Promise<T>, nom: K) =>
  lazy(() => charger().then((m) => ({ default: m[nom] as React.ComponentType })));
const SePerdre = page(() => import('./pages/SePerdre'), 'SePerdre');
const TracePage = page(() => import('./pages/TracePage'), 'TracePage');
const Creer = page(() => import('./pages/Creer'), 'Creer');
const OeuvreCommune = page(() => import('./pages/OeuvreCommune'), 'OeuvreCommune');
const Projet = page(() => import('./pages/Pages'), 'Projet');
const Ressources = page(() => import('./pages/Pages'), 'Ressources');
const Soutenir = page(() => import('./pages/Pages'), 'Soutenir');
const Juridique = page(() => import('./pages/Pages'), 'Juridique');
const Archives = page(() => import('./pages/Pages'), 'Archives');
const Compte = page(() => import('./pages/Pages'), 'Compte');
const Introuvable = page(() => import('./pages/Pages'), 'Introuvable');
// l'espace de l'équipe n'est téléchargé que par celles et ceux qui l'ouvrent
const Admin = page(() => import('./pages/Admin'), 'Admin');
// l'atelier des bulles : un outil de travail local, absent du site publié
const AtelierBulles = import.meta.env.DEV ? lazy(() => import('./pages/AtelierBulles')) : null;
const CoupeBulles = import.meta.env.DEV ? lazy(() => import('./pages/CoupeBulles')) : null;
const AtelierMelange = import.meta.env.DEV ? lazy(() => import('./pages/AtelierMelange')) : null;
const AtelierComparer = import.meta.env.DEV ? lazy(() => import('./pages/AtelierComparer')) : null;
const AtelierTri = import.meta.env.DEV ? lazy(() => import('./pages/AtelierTri')) : null;
const AtelierDoublons = import.meta.env.DEV ? lazy(() => import('./pages/AtelierDoublons')) : null;

/** Le temps qu'une page arrive : le papier, et une phrase. */
function Attente() {
  return (
    <main className="page page-texte chargement" aria-busy="true">
      <div>
        <div className="chargement-bulle" aria-hidden="true" />
        <p>Un instant…</p>
      </div>
    </main>
  );
}

/** Chaque nouvelle page s'ouvre en haut : un lien du pied de page n'ouvre plus la suivante déjà défilée. */
function EnHaut() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Au clavier : sauter la constellation et le menu pour aller droit au contenu de la page. */
function allerAuContenu(e: React.MouseEvent) {
  e.preventDefault();
  const cible = document.querySelector<HTMLElement>('#contenu h1, #contenu [role="main"] a, #contenu a, #contenu button');
  cible?.setAttribute('tabindex', '-1');
  cible?.focus({ preventScroll: false });
}

export function App() {
  const location = useLocation();
  const lent = (el: React.ReactNode) => <Suspense fallback={<Attente />}>{el}</Suspense>;
  return (
    <>
      <a href="#contenu" className="aller-au-contenu" onClick={allerAuContenu}>
        Aller au contenu
      </a>
      {/* La constellation vit derrière toutes les pages, elle n'est jamais démontée. */}
      <Backdrop />
      <EnHaut />
      <div id="contenu" className="layer" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Explorer />} />
          <Route path="/bulle/:bulle" element={<Explorer />} />
          <Route path="/se-perdre" element={lent(<SePerdre />)} />
          <Route path="/trace/:id" element={lent(<TracePage />)} />
          <Route path="/creer" element={lent(<Creer />)} />
          <Route path="/ma-trace" element={<Navigate to="/compte" replace />} />
          <Route path="/projet" element={lent(<Projet />)} />
          <Route path="/ressources" element={lent(<Ressources />)} />
          <Route path="/soutenir" element={lent(<Soutenir />)} />
          <Route path="/juridique" element={lent(<Juridique />)} />
          <Route path="/archives" element={lent(<Archives />)} />
          <Route path="/oeuvre-commune" element={lent(<OeuvreCommune />)} />
          <Route path="/archives/:edition" element={<Explorer />} />
          <Route path="/compte" element={lent(<Compte />)} />
          <Route path="/connexion" element={<Navigate to="/compte" replace />} />
          <Route path="/admin" element={lent(<Admin />)} />
          {AtelierBulles && <Route path="/atelier/bulles" element={lent(<AtelierBulles />)} />}
          {CoupeBulles && <Route path="/atelier/coupe" element={lent(<CoupeBulles />)} />}
          {AtelierMelange && <Route path="/atelier/melange" element={lent(<AtelierMelange />)} />}
          {AtelierComparer && <Route path="/atelier/comparer" element={lent(<AtelierComparer />)} />}
          {AtelierTri && <Route path="/atelier/tri" element={lent(<AtelierTri />)} />}
          {AtelierDoublons && <Route path="/atelier/doublons" element={lent(<AtelierDoublons />)} />}
          <Route path="*" element={lent(<Introuvable />)} />
        </Routes>
      </div>
    </>
  );
}
