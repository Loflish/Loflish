import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Backdrop } from './components/Backdrop';
import { Archives, Compte, Juridique, Projet, Ressources, Soutenir } from './pages/Pages';
import { Creer } from './pages/Creer';
import { Explorer } from './pages/Explorer';
import { OeuvreCommune } from './pages/OeuvreCommune';
import { SePerdre } from './pages/SePerdre';
import { TracePage } from './pages/TracePage';

// l'espace de l'équipe n'est téléchargé que par celles et ceux qui l'ouvrent
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })));
// l'atelier des bulles : un outil de travail local, absent du site publié
const AtelierBulles = import.meta.env.DEV ? lazy(() => import('./pages/AtelierBulles')) : null;
const CoupeBulles = import.meta.env.DEV ? lazy(() => import('./pages/CoupeBulles')) : null;

export function App() {
  const location = useLocation();
  return (
    <>
      {/* La constellation vit derrière toutes les pages, elle n'est jamais démontée. */}
      <Backdrop />
      <div id="contenu" className="layer" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Explorer />} />
          <Route path="/bulle/:bulle" element={<Explorer />} />
          <Route path="/se-perdre" element={<SePerdre />} />
          <Route path="/trace/:id" element={<TracePage />} />
          <Route path="/creer" element={<Creer />} />
          <Route path="/ma-trace" element={<Navigate to="/compte" replace />} />
          <Route path="/projet" element={<Projet />} />
          <Route path="/ressources" element={<Ressources />} />
          <Route path="/soutenir" element={<Soutenir />} />
          <Route path="/juridique" element={<Juridique />} />
          <Route path="/archives" element={<Archives />} />
          <Route path="/oeuvre-commune" element={<OeuvreCommune />} />
          <Route path="/archives/:edition" element={<Explorer />} />
          <Route path="/compte" element={<Compte />} />
          <Route path="/connexion" element={<Navigate to="/compte" replace />} />
          <Route
            path="/admin"
            element={
              <Suspense fallback={null}>
                <Admin />
              </Suspense>
            }
          />
          {AtelierBulles && (
            <Route
              path="/atelier/bulles"
              element={
                <Suspense fallback={null}>
                  <AtelierBulles />
                </Suspense>
              }
            />
          )}
          {CoupeBulles && (
            <Route
              path="/atelier/coupe"
              element={
                <Suspense fallback={null}>
                  <CoupeBulles />
                </Suspense>
              }
            />
          )}
          <Route path="*" element={<Explorer />} />
        </Routes>
      </div>
    </>
  );
}
